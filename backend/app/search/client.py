from __future__ import annotations

import asyncio
import logging
from urllib.parse import urlparse

from tavily import TavilyClient

from app.config import settings
from app.search.cache import SearchCache
from app.search.query_builder import (
    build_primary,
    build_related_articles,
    build_relaxed,
    build_topic,
)
from app.search.relevance import compute_relevance

logger = logging.getLogger(__name__)

_RELEVANCE_THRESHOLD = 0.15   # lowered: TF-IDF on short claims vs long articles naturally scores low
_MIN_GOOD_RESULTS = 3


def _domain(url: str) -> str:
    try:
        return urlparse(url).netloc.removeprefix("www.")
    except Exception:
        return ""


class TavilySearchClient:
    def __init__(self, cache: SearchCache | None = None) -> None:
        self._client = TavilyClient(api_key=settings.tavily_api_key)
        self._cache = cache or SearchCache.from_settings()

    def _raw_search(
        self,
        query: str,
        max_results: int,
        include_domains: list[str] | None,
        days: int | None,
        topic: str = "general",
    ) -> list[dict]:
        cached = self._cache.get(query, max_results, include_domains, days)
        if cached is not None:
            return cached

        kwargs: dict = {
            "query": query,
            "search_depth": "advanced",
            "topic": topic,
            "max_results": max_results,
        }
        if include_domains:
            kwargs["include_domains"] = include_domains
        # days is only honoured by Tavily when topic="news"
        if days and topic == "news":
            kwargs["days"] = days

        try:
            resp = self._client.search(**kwargs)
            results = resp.get("results", [])
            self._cache.set(query, max_results, include_domains, days, results)
            logger.debug(
                "Tavily [%s] query=%r → %d results", topic, query[:70], len(results)
            )
            return results
        except Exception as exc:
            logger.warning("Tavily search failed query=%r: %s", query[:70], exc)
            raise

    def _enrich_results(
        self,
        raw: list[dict],
        claim: str,
        region: str | None,
        fallback_level: int,
        domain_resolver,
    ) -> list[dict]:
        texts = [r.get("content", "") + " " + r.get("title", "") for r in raw]
        relevances = compute_relevance(claim, texts)

        enriched = []
        for i, r in enumerate(raw):
            dom = _domain(r.get("url", ""))
            enriched.append({
                "claim": claim,
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "domain": dom,
                "content": r.get("content", "")[:600],
                "score": float(r.get("score", 0.0)),
                "relevance": relevances[i] if i < len(relevances) else 0.0,
                "credibility": domain_resolver.credibility_score(dom, region),
                "published_date": r.get("published_date"),
                "fallback_level": fallback_level,
            })
        return enriched

    async def search_with_fallback(
        self,
        claim: str,
        geo_region: str | None,
        trusted_domains: list[str],
        days: int | None,
        domain_resolver,
    ) -> tuple[list[dict], list[str]]:
        """
        Two-track search per query level:
          Track A – topic=general, no date filter → finds official sites, wikis, all sources
          Track B – topic=news + trusted domains → recent regional news coverage

        Falls back through 3 query levels only when relevant results are scarce.
        """
        errors: list[str] = []
        queries = [
            (build_primary(claim, geo_region), 0),
            (build_relaxed(claim), 1),
            (build_topic(claim), 2),
        ]

        all_results: list[dict] = []

        for query, level in queries:
            raw: list[dict] = []

            # Track A: general web search (no date restriction → finds older docs too)
            try:
                general = await asyncio.to_thread(
                    self._raw_search, query, 8, None, None, "general"
                )
                raw.extend(general)
            except Exception as exc:
                errors.append(f"[level {level} general] {exc}")

            # Track B: regional news with trusted domains
            if geo_region and trusted_domains:
                try:
                    regional = await asyncio.to_thread(
                        self._raw_search, query, 6, trusted_domains, days or 90, "news"
                    )
                    raw.extend(regional)
                except Exception as exc:
                    errors.append(f"[level {level} regional] {exc}")
            else:
                # No region: add a broad news search for recent coverage
                try:
                    news = await asyncio.to_thread(
                        self._raw_search, query, 5, None, days or 90, "news"
                    )
                    raw.extend(news)
                except Exception as exc:
                    errors.append(f"[level {level} news] {exc}")

            if raw:
                enriched = self._enrich_results(raw, claim, geo_region, level, domain_resolver)
                all_results.extend(enriched)

                good = [r for r in enriched if r["relevance"] >= _RELEVANCE_THRESHOLD]
                if len(good) >= _MIN_GOOD_RESULTS:
                    logger.debug(
                        "Query level %d: %d good results — stopping cascade", level, len(good)
                    )
                    break
                elif level < 2:
                    logger.debug(
                        "Query level %d: only %d relevant results for %r — trying next level",
                        level, len(good), claim[:60],
                    )

        return all_results, errors

    async def search_related(
        self,
        article_text: str,
        geo_region: str | None,
        days: int | None,
        domain_resolver,
    ) -> list[dict]:
        query = build_related_articles(article_text, geo_region)
        raw: list[dict] = []
        try:
            # General search finds related coverage across the web
            general = await asyncio.to_thread(
                self._raw_search, query, 5, None, None, "general"
            )
            raw.extend(general)
            # News search for recent coverage
            news = await asyncio.to_thread(
                self._raw_search, query, 4, None, days or 60, "news"
            )
            raw.extend(news)
        except Exception as exc:
            logger.warning("Related articles search failed: %s", exc)
        return self._enrich_results(raw, article_text[:200], geo_region, 3, domain_resolver)

    @staticmethod
    def deduplicate(items: list[dict]) -> list[dict]:
        seen: dict[str, dict] = {}
        for item in items:
            url = item.get("url", "")
            if url not in seen or item.get("relevance", 0) > seen[url].get("relevance", 0):
                seen[url] = item
        return list(seen.values())

    @staticmethod
    def rank(items: list[dict]) -> list[dict]:
        return sorted(
            items,
            key=lambda x: (x.get("relevance", 0) * 0.5 + x.get("score", 0) * 0.3 + x.get("credibility", 0) * 0.2),
            reverse=True,
        )

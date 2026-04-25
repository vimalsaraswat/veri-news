from __future__ import annotations

import hashlib
import json
import logging

from cachetools import TTLCache

logger = logging.getLogger(__name__)


def make_cache_key(
    query: str,
    max_results: int,
    include_domains: list[str] | None,
    days: int | None,
) -> str:
    payload = {
        "q": query.lower().strip(),
        "n": max_results,
        "d": sorted(include_domains or []),
        "days": days,
    }
    return hashlib.md5(json.dumps(payload, sort_keys=True).encode()).hexdigest()


class SearchCache:
    def __init__(self, maxsize: int = 256, ttl: int = 1800) -> None:
        self._cache: TTLCache = TTLCache(maxsize=maxsize, ttl=ttl)

    def get(
        self,
        query: str,
        max_results: int,
        include_domains: list[str] | None,
        days: int | None,
    ) -> list[dict] | None:
        key = make_cache_key(query, max_results, include_domains, days)
        result = self._cache.get(key)
        if result is not None:
            logger.debug("Cache hit for query=%r", query[:60])
        return result

    def set(
        self,
        query: str,
        max_results: int,
        include_domains: list[str] | None,
        days: int | None,
        results: list[dict],
    ) -> None:
        key = make_cache_key(query, max_results, include_domains, days)
        self._cache[key] = results

    @classmethod
    def from_settings(cls) -> SearchCache:
        from app.config import settings
        return cls(maxsize=settings.cache_max_size, ttl=settings.cache_ttl_seconds)

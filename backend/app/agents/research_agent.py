from __future__ import annotations

import logging

from langchain_core.messages import HumanMessage, SystemMessage

from app.agents.state import VeriNewsState
from app.geography.domains import DomainResolver
from app.search.client import TavilySearchClient
from app.search.query_builder import estimate_search_days
from app.utils.llm import extract_text

logger = logging.getLogger(__name__)

_ASSESSMENT_SYSTEM = """You are a source credibility analyst. Evaluate the evidence below for factual consistency.
For each piece of evidence, assess whether it supports, contradicts, or is neutral regarding the associated claim.
Format each line exactly as:
[URL] | support|contradict|neutral | one-line reason
Do not include any other text."""


def _parse_assessments(raw: str, evidence: list[dict]) -> tuple[list[dict], int, int]:
    assessments = []
    corroborating = 0
    contradicting = 0

    for line in raw.splitlines():
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 3:
            continue
        url = parts[0].strip("[]")
        verdict_raw = parts[1].lower()
        reason = parts[2] if len(parts) > 2 else ""

        verdict = "neutral"
        if "support" in verdict_raw:
            verdict = "support"
            corroborating += 1
        elif "contradict" in verdict_raw:
            verdict = "contradict"
            contradicting += 1

        assessments.append({"url": url, "assessment": verdict, "reason": reason})

    return assessments, corroborating, contradicting


def _build_diagnostics(
    original_text: str,
    claims: list[str],
    evidence: list[dict],
    geo_result,
    fallback_used: bool,
    search_errors: list[str],
    corroborating: int,
    contradicting: int,
) -> dict:
    total = len(evidence)
    low_rel_count = sum(1 for e in evidence if e.get("relevance", 0) < 0.2)
    low_relevance_ratio = low_rel_count / total if total > 0 else 1.0

    claims_with_evidence = len(
        {e["claim"] for e in evidence if e.get("relevance", 0) >= 0.2}
    )

    return {
        "detected_geography": geo_result.region if geo_result else None,
        "geography_confidence": geo_result.confidence if geo_result else 0.0,
        "claims_extracted": len(claims),
        "claims_with_evidence": claims_with_evidence,
        "low_relevance_ratio": round(low_relevance_ratio, 3),
        "evidence_count": total,
        "search_errors": search_errors,
        "fallback_used": fallback_used,
        "corroborating": corroborating,
        "contradicting": contradicting,
        "low_relevance_flag": low_relevance_ratio > 0.6,
    }


def _format_evidence_for_prompt(evidence: list[dict]) -> str:
    lines = []
    for e in evidence[:12]:
        lines.append(
            f"Claim: {e['claim']}\n"
            f"URL: {e['url']}\n"
            f"Title: {e['title']}\n"
            f"Relevance: {e['relevance']:.2f} | Credibility: {e['credibility']:.2f}\n"
            f"Snippet: {e['content'][:200]}\n---"
        )
    return "\n".join(lines)


class ResearchAgent:
    def __init__(self, llm, search_client: TavilySearchClient, domain_resolver: DomainResolver) -> None:
        self._llm = llm
        self._search = search_client
        self._resolver = domain_resolver

    async def run(self, state: VeriNewsState) -> dict:
        geo_result = state.get("geo_result")
        claims = state["claims"]
        original_text = state["original_text"]
        fallback_used = state.get("fallback_used", False)

        region = geo_result.region if geo_result else None
        trusted_domains = self._resolver.get_trusted_domains(region)
        days = estimate_search_days(original_text)  # None when no temporal signal

        all_evidence: list[dict] = []
        all_errors: list[str] = []

        for claim in claims[:4]:
            ev, errs = await self._search.search_with_fallback(
                claim=claim,
                geo_region=region,
                trusted_domains=trusted_domains,
                days=days,
                domain_resolver=self._resolver,
            )
            all_evidence.extend(ev)
            all_errors.extend(errs)

        related = await self._search.search_related(
            article_text=original_text,
            geo_region=region,
            days=days,
            domain_resolver=self._resolver,
        )

        deduped = TavilySearchClient.deduplicate(all_evidence)
        ranked = TavilySearchClient.rank(deduped)[:16]

        evidence_block = _format_evidence_for_prompt(ranked)
        geo_label = f"{region} (confidence: {geo_result.confidence:.2f})" if (geo_result and region) else "unknown"

        messages = [
            SystemMessage(content=_ASSESSMENT_SYSTEM),
            HumanMessage(
                content=(
                    f"Detected geography: {geo_label}\n\n"
                    f"Evidence to assess:\n{evidence_block}"
                )
            ),
        ]
        response = await self._llm.ainvoke(messages)
        raw_assessment = extract_text(response)

        assessments, corroborating, contradicting = _parse_assessments(raw_assessment, ranked)

        diagnostics = _build_diagnostics(
            original_text, claims, ranked, geo_result, fallback_used,
            all_errors, corroborating, contradicting
        )

        logger.info(
            "Research complete: evidence=%d related=%d corroborating=%d contradicting=%d",
            len(ranked), len(related), corroborating, contradicting,
        )

        return {
            "evidence": ranked,
            "related_articles": related[:8],
            "claim_assessments": assessments,
            "search_errors": all_errors,
            "diagnostics": diagnostics,
        }

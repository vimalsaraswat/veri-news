from __future__ import annotations

import logging
import re

from langchain_core.messages import HumanMessage, SystemMessage

from app.agents.state import VeriNewsState
from app.geography.detector import GeographyDetector
from app.search.relevance import tfidf_scores
from app.utils.llm import extract_text

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """You are a forensic claim extractor. Given article text, extract 3–7 specific, verifiable factual claims.

Rules:
- Each claim must be independently verifiable with a web search
- No opinions, no paraphrases of the headline alone
- No claims like "officials say" without the specific fact
- Output format: one claim per line, no bullets, no numbers, no prefixes
- If no verifiable claims exist, output exactly: NO_VERIFIABLE_CLAIMS"""

_BULLET_RE = re.compile(r"^[\-\*•·\d]+[.)]\s*")


def _parse_claims(raw: str) -> list[str]:
    if "NO_VERIFIABLE_CLAIMS" in raw:
        return []
    lines = [_BULLET_RE.sub("", line).strip() for line in raw.splitlines()]
    return [c for c in lines if len(c) > 15 and len(c.split()) >= 4]


def _deduplicate(claims: list[str]) -> list[str]:
    if len(claims) <= 1:
        return claims
    try:
        deduped = [claims[0]]
        for claim in claims[1:]:
            # keep claim if it's sufficiently different from all already-kept claims
            if not any(
                tfidf_scores(k, [claim])[0] > 0.70 for k in deduped
            ):
                deduped.append(claim)
        return deduped[:7]
    except Exception:
        return claims[:7]


class ContentAnalystAgent:
    def __init__(self, llm, geo_detector: GeographyDetector) -> None:
        self._llm = llm
        self._geo = geo_detector

    async def run(self, state: VeriNewsState) -> dict:
        original_text = state["original_text"]

        messages = [
            SystemMessage(content=_SYSTEM_PROMPT),
            HumanMessage(content=original_text),
        ]

        response = await self._llm.ainvoke(messages)
        raw = extract_text(response)

        claims = _parse_claims(raw)
        claims = _deduplicate(claims)

        fallback_used = False
        if not claims:
            logger.warning("No verifiable claims extracted; using first 2 sentences as fallback")
            sentences = [s.strip() for s in original_text.split(".") if s.strip()]
            claims = sentences[:2]
            fallback_used = True

        combined_text = original_text + " " + " ".join(claims)
        geo_result = self._geo.detect(combined_text)

        logger.info(
            "Claims extracted: %d fallback=%s geography=%s",
            len(claims),
            fallback_used,
            geo_result.region,
        )

        return {
            "claims": claims,
            "fallback_used": fallback_used,
            "geo_result": geo_result,
        }

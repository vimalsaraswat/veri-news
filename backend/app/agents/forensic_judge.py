from __future__ import annotations

import json
import logging
import re

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.agents.state import VeriNewsState
from app.scoring.confidence import compute_confidence
from app.utils.llm import extract_text

logger = logging.getLogger(__name__)

_REPORT_SYSTEM = """You are a Senior Forensic Investigator and Disinformation Analyst.

Produce a structured forensic report in this exact format:

## Key Claims
List the verifiable claims being investigated.

## Evidence Review
For each piece of evidence: URL, what it says, and whether it supports/contradicts the claim.

## Credibility Audit
Assess source quality, geography match, and relevance. Note any red flags.

## Final Verdict
State one of: Real | Fake | Suspicious | Inconclusive
Followed by a 1–2 sentence summary explaining your verdict.

Guardrails (MUST follow):
- If low_relevance_flag=true AND evidence_count < 3: verdict must be Suspicious or Inconclusive
- If fallback_used=true (no clean claims extracted): verdict must be Inconclusive
- Do not declare Fake from absence of evidence alone — absence ≠ disproof
- Do not weight sources by geography — weight by relevance and credibility
- If sources from different regions corroborate the claim, treat as strong support"""

_VERDICT_EXTRACT_SYSTEM = """Extract the verdict from this forensic report.
Respond with ONLY valid JSON and nothing else:
{"verdict": "Real" or "Fake" or "Suspicious" or "Inconclusive", "summary": "<1 sentence>", "corroborating_count": <int>, "contradicting_count": <int>}"""

_VERDICT_RE = re.compile(r"\b(Real|Fake|Suspicious|Inconclusive)\b")


def _extract_verdict_json(text: str, fallback_corr: int, fallback_cont: int) -> dict:
    try:
        json_match = re.search(r"\{[^}]+\}", text, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            verdict = data.get("verdict", "Inconclusive")
            if verdict not in ("Real", "Fake", "Suspicious", "Inconclusive"):
                verdict = "Inconclusive"
            return {
                "verdict": verdict,
                "summary": data.get("summary", "Verdict extracted from forensic analysis."),
                "corroborating_count": int(data.get("corroborating_count", fallback_corr)),
                "contradicting_count": int(data.get("contradicting_count", fallback_cont)),
            }
    except Exception:
        pass

    # Last-resort: regex scan of last verdict word
    matches = _VERDICT_RE.findall(text)
    verdict = matches[-1] if matches else "Inconclusive"
    return {
        "verdict": verdict,
        "summary": "Verdict determined by forensic analysis.",
        "corroborating_count": fallback_corr,
        "contradicting_count": fallback_cont,
    }


class ForensicJudgeAgent:
    def __init__(self, llm) -> None:
        self._llm = llm

    async def run(self, state: VeriNewsState) -> dict:
        diagnostics = state.get("diagnostics", {})
        evidence = state.get("evidence", [])
        claims = state.get("claims", [])

        corroborating = diagnostics.get("corroborating", 0)
        contradicting = diagnostics.get("contradicting", 0)
        claims_extracted = diagnostics.get("claims_extracted", len(claims))
        claims_with_evidence = diagnostics.get("claims_with_evidence", 0)

        evidence_block = "\n".join(
            f"- [{e['url']}] ({e['domain']}) relevance={e['relevance']:.2f}: {e['content'][:150]}"
            for e in evidence[:12]
        )
        diagnostics_block = json.dumps({k: v for k, v in diagnostics.items()}, indent=2)

        report_prompt = (
            f"Diagnostics:\n{diagnostics_block}\n\n"
            f"Claims:\n" + "\n".join(f"- {c}" for c in claims) + "\n\n"
            f"Evidence:\n{evidence_block}"
        )

        messages = [
            SystemMessage(content=_REPORT_SYSTEM),
            HumanMessage(content=report_prompt),
        ]

        # Pass 1: stream the full report
        full_response = await self._llm.ainvoke(messages)
        report_text = extract_text(full_response)

        # Pass 2: structured verdict extraction
        verdict_messages = [
            SystemMessage(content=_VERDICT_EXTRACT_SYSTEM),
            HumanMessage(content=report_text),
        ]
        try:
            verdict_response = await self._llm.ainvoke(verdict_messages)
            verdict_raw = extract_text(verdict_response)
        except Exception as exc:
            logger.warning("Verdict extraction LLM call failed: %s", exc)
            verdict_raw = report_text

        structured = _extract_verdict_json(verdict_raw, corroborating, contradicting)

        confidence, confidence_label = compute_confidence(
            evidence=evidence,
            corroborating=structured["corroborating_count"],
            contradicting=structured["contradicting_count"],
            claims_extracted=claims_extracted,
            claims_with_evidence=claims_with_evidence,
        )

        verdict_payload = {
            "verdict": structured["verdict"],
            "confidence": confidence,
            "confidence_label": confidence_label,
            "summary": structured["summary"],
            "corroborating_count": structured["corroborating_count"],
            "contradicting_count": structured["contradicting_count"],
            "claim_verification_rate": claims_with_evidence / max(1, claims_extracted),
        }

        logger.info(
            "Verdict: %s confidence=%.3f (%s)",
            verdict_payload["verdict"],
            confidence,
            confidence_label,
        )

        return {
            "messages": state.get("messages", []) + [AIMessage(content=report_text)],
            "verdict": verdict_payload,
        }

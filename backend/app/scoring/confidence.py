from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    pass


def corroboration_score(corroborating: int, contradicting: int, total: int) -> float:
    if total == 0:
        return 0.0
    net = (corroborating - contradicting * 0.5) / total
    return max(0.0, min(1.0, (net + 1) / 2))


def relevance_score(evidence: list) -> float:
    if not evidence:
        return 0.0
    return sum(e.get("relevance", 0) for e in evidence) / len(evidence)


def credibility_score(evidence: list) -> float:
    if not evidence:
        return 0.0
    sorted_ev = sorted(evidence, key=lambda x: x.get("credibility", 0), reverse=True)
    top = sorted_ev[:5]
    weights = [5, 4, 3, 2, 1][: len(top)]
    return sum(e.get("credibility", 0) * w for e, w in zip(top, weights)) / sum(weights)


def coverage_score(claims_extracted: int, claims_with_evidence: int) -> float:
    if claims_extracted == 0:
        return 0.0
    return claims_with_evidence / claims_extracted


def compute_confidence(
    evidence: list,
    corroborating: int,
    contradicting: int,
    claims_extracted: int,
    claims_with_evidence: int,
) -> tuple[float, str]:
    if not evidence:
        return 0.0, "Low"

    score = (
        0.35 * corroboration_score(corroborating, contradicting, len(evidence))
        + 0.25 * relevance_score(evidence)
        + 0.25 * credibility_score(evidence)
        + 0.15 * coverage_score(claims_extracted, claims_with_evidence)
    )
    score = round(min(1.0, max(0.0, score)), 3)
    label = "High" if score >= 0.70 else "Medium" if score >= 0.45 else "Low"
    return score, label

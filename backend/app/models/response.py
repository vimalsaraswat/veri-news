from typing import Literal

from pydantic import BaseModel


class EvidenceItem(BaseModel):
    claim: str
    title: str
    url: str
    domain: str
    content: str
    score: float
    relevance: float
    credibility: float
    published_date: str | None = None
    fallback_level: int = 0


class DiagnosticsPayload(BaseModel):
    detected_geography: str | None
    geography_confidence: float
    claims_extracted: int
    claims_with_evidence: int
    low_relevance_ratio: float
    evidence_count: int
    search_errors: list[str]


class VerdictPayload(BaseModel):
    verdict: Literal["Real", "Fake", "Suspicious", "Inconclusive"]
    confidence: float
    confidence_label: Literal["High", "Medium", "Low"]
    summary: str
    corroborating_count: int
    contradicting_count: int
    claim_verification_rate: float


class SSETokenEvent(BaseModel):
    text: str
    agent: str


class SSEAgentStartEvent(BaseModel):
    agent: str
    label: str

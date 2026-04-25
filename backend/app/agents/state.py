from __future__ import annotations

from typing import TYPE_CHECKING, Any

from langchain_core.messages import BaseMessage
from typing_extensions import TypedDict

if TYPE_CHECKING:
    pass


class VeriNewsState(TypedDict):
    messages: list[BaseMessage]
    original_text: str
    claims: list[str]
    fallback_used: bool
    geo_result: Any          # DetectionResult (Any to avoid import cycle at runtime)
    evidence: list[dict]
    related_articles: list[dict]
    claim_assessments: list[dict]
    search_errors: list[str]
    diagnostics: dict
    verdict: dict

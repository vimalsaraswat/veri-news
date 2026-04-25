from __future__ import annotations

import logging

from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, START, StateGraph

from app.agents.content_analyst import ContentAnalystAgent
from app.agents.forensic_judge import ForensicJudgeAgent
from app.agents.research_agent import ResearchAgent
from app.agents.state import VeriNewsState
from app.config import settings
from app.geography.detector import GeographyDetector
from app.geography.domains import DomainResolver
from app.search.cache import SearchCache
from app.search.client import TavilySearchClient

logger = logging.getLogger(__name__)


class VeriNewsController:
    def __init__(
        self,
        cache: SearchCache | None = None,
        geo_detector: GeographyDetector | None = None,
    ) -> None:
        self._llm = ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            google_api_key=settings.gemini_api_key,
            streaming=True,
            max_retries=3,          # retries 429 / 5xx with exponential backoff
            request_timeout=120,
        )
        _cache = cache or SearchCache.from_settings()
        _geo = geo_detector or GeographyDetector()
        _resolver = DomainResolver(_geo)
        _search = TavilySearchClient(cache=_cache)

        self._analyst = ContentAnalystAgent(self._llm, _geo)
        self._researcher = ResearchAgent(self._llm, _search, _resolver)
        self._judge = ForensicJudgeAgent(self._llm)

    def build(self, original_text: str) -> StateGraph:
        graph = StateGraph(VeriNewsState)

        async def content_analysis(state: VeriNewsState) -> dict:
            return await self._analyst.run(state)

        async def source_credibility(state: VeriNewsState) -> dict:
            return await self._researcher.run(state)

        async def reasoning_verdict(state: VeriNewsState) -> dict:
            return await self._judge.run(state)

        graph.add_node("content_analysis", content_analysis)
        graph.add_node("source_credibility", source_credibility)
        graph.add_node("reasoning_verdict", reasoning_verdict)

        graph.add_edge(START, "content_analysis")
        graph.add_edge("content_analysis", "source_credibility")
        graph.add_edge("source_credibility", "reasoning_verdict")
        graph.add_edge("reasoning_verdict", END)

        return graph.compile()

    def initial_state(self, text: str) -> VeriNewsState:
        from langchain_core.messages import HumanMessage

        from app.geography.detector import DetectionResult
        return VeriNewsState(
            messages=[HumanMessage(content=text)],
            original_text=text,
            claims=[],
            fallback_used=False,
            geo_result=DetectionResult(region=None, confidence=0.0),
            evidence=[],
            related_articles=[],
            claim_assessments=[],
            search_errors=[],
            diagnostics={},
            verdict={},
        )

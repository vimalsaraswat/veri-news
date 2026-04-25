from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.agents.controller import VeriNewsController
from app.middleware.error_handler import sse_error_event
from app.models.request import InvestigateRequest

logger = logging.getLogger(__name__)

router = APIRouter()

_AGENT_LABELS = {
    "content_analysis": "Content Analyst",
    "source_credibility": "Research Agent",
    "reasoning_verdict": "Forensic Judge",
}


def _sse(event: str, data: object) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _extract_token_text(chunk) -> str:
    if hasattr(chunk, "content"):
        c = chunk.content
        if isinstance(c, str):
            return c
        if isinstance(c, list):
            return "".join(
                part.get("text", "") if isinstance(part, dict) else str(part)
                for part in c
            )
    return ""


@router.post("/investigate")
async def investigate(body: InvestigateRequest, request: Request) -> StreamingResponse:
    async def generate():
        yield _sse("connected", {})

        try:
            cache = getattr(request.app.state, "cache", None)
            geo_detector = getattr(request.app.state, "geo_detector", None)
            controller = VeriNewsController(cache=cache, geo_detector=geo_detector)
            graph = controller.build(body.text)
            initial = controller.initial_state(body.text)
        except Exception as exc:
            logger.exception("Controller init failed: %s", exc)
            yield sse_error_event(str(exc))
            return

        current_node: str | None = None

        try:
            async for mode, payload in graph.astream(
                initial,
                stream_mode=["messages", "updates"],
            ):
                if await request.is_disconnected():
                    logger.info("Client disconnected; stopping stream")
                    return

                if mode == "messages":
                    chunk, metadata = payload
                    node = metadata.get("langgraph_node", "")

                    if node != current_node:
                        current_node = node
                        label = _AGENT_LABELS.get(node, node)
                        yield _sse("agent_start", {"agent": node, "label": label})

                    token_text = _extract_token_text(chunk)
                    if token_text:
                        yield _sse("token", {"text": token_text, "agent": node})

                elif mode == "updates":
                    for node_name, node_update in payload.items():
                        if not isinstance(node_update, dict):
                            continue

                        if "evidence" in node_update and node_update["evidence"]:
                            yield _sse("evidence", {"items": node_update["evidence"]})

                        if "related_articles" in node_update and node_update["related_articles"]:
                            yield _sse("related_articles", {"items": node_update["related_articles"]})

                        if "diagnostics" in node_update and node_update["diagnostics"]:
                            yield _sse("diagnostics", node_update["diagnostics"])

                        if "verdict" in node_update and node_update["verdict"]:
                            yield _sse("verdict", node_update["verdict"])

            yield _sse("done", {})

        except Exception as exc:
            logger.exception("Investigation stream error: %s", exc)
            yield sse_error_event(str(exc))

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

import json
import logging

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        try:
            return await call_next(request)
        except ValueError as exc:
            return JSONResponse(status_code=422, content={"error": str(exc)})
        except Exception as exc:
            logger.exception("Unhandled server error: %s", exc)
            return JSONResponse(
                status_code=500,
                content={"error": "internal_error", "detail": str(exc)},
            )


def sse_error_event(message: str, code: str = "INTERNAL_ERROR") -> str:
    """Format an SSE error event to emit mid-stream before closing."""
    data = json.dumps({"message": message, "code": code})
    return f"event: error\ndata: {data}\n\n"

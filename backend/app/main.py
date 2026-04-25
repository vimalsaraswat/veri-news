from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.geography.detector import GeographyDetector
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.routers import health, investigate
from app.search.cache import SearchCache
from app.utils.logging import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(settings.log_level)
    app.state.cache = SearchCache(
        maxsize=settings.cache_max_size,
        ttl=settings.cache_ttl_seconds,
    )
    app.state.geo_detector = GeographyDetector()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="VeriNews API",
        description="AI-powered fake news detection",
        version="2.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "Accept"],
    )
    app.add_middleware(ErrorHandlerMiddleware)

    app.include_router(health.router, prefix="/api")
    app.include_router(investigate.router, prefix="/api")

    return app


app = create_app()

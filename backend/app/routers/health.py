from fastapi import APIRouter

from app.config import settings

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "model": settings.gemini_model,
        "cache_ttl_seconds": settings.cache_ttl_seconds,
    }

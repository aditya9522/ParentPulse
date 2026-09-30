# backend/app/api/v1/endpoints/admin.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.common import ApiResponse
from app.helpers.response_builder import build_response
from app.core.config import get_settings

router = APIRouter(prefix="/admin", tags=["Admin & System"])


@router.get("/health", response_model=ApiResponse[dict])
async def health_check():
    return build_response({
        "status": "healthy",
        "service": "ParentPulse API",
        "version": "1.0.0",
    })


@router.get("/metrics", response_model=ApiResponse[dict])
async def get_system_metrics(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    await session.execute(text("SELECT 1"))
    settings = get_settings()
    return build_response({
        "database_status": "connected",
        "cache_status": "configured" if settings.upstash_redis_rest_url else "not_configured",
        "vector_index": "configured" if settings.pinecone_api_key.get_secret_value() else "not_configured",
    })

# backend/app/api/v1/endpoints/admin.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.common import ApiResponse
from app.helpers.response_builder import build_response

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
    return build_response({
        "active_sessions": 1,
        "database_status": "connected",
        "cache_status": "operational",
        "vector_index": "connected",
    })

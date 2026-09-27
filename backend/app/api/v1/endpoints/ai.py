# backend/app/api/v1/endpoints/ai.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_user, get_db
from app.core.permissions import verify_parent_access
from app.models.user import User
from app.schemas.ai import AIChatRequest, AIChatResponse
from app.schemas.common import ApiResponse
from app.helpers.response_builder import build_response
from app.services.rag_service import RAGService

router = APIRouter(prefix="/ai", tags=["ParentPulse AI Assistant"])


@router.post("/chat", response_model=ApiResponse[AIChatResponse])
async def chat_with_health_assistant(
    request: AIChatRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    # Verify the authenticated user has authorization to access this parent's health records
    await verify_parent_access(session, current_user.id, request.parent_id)
    
    service = RAGService(session)
    response = await service.answer_health_query(request.parent_id, request.query)
    return build_response(response)


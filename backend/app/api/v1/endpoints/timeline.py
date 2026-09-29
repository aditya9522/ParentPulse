# backend/app/api/v1/endpoints/timeline.py
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db, get_parent_access_context
from app.core.exceptions import AuthorizationError, ResourceNotFoundError
from app.core.permissions import verify_parent_access
from app.helpers.response_builder import build_response
from app.models.document import Document
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.timeline import TimelineEventCreate, TimelineEventResponse
from app.services.timeline_service import TimelineService

router = APIRouter(prefix="/timeline", tags=["Health Timeline"])


@router.post("", response_model=ApiResponse[TimelineEventResponse])
async def create_timeline_event(
    data: TimelineEventCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    parent, _ = await verify_parent_access(session, current_user.id, data.parent_id)
    if data.family_id != parent.family_id:
        raise AuthorizationError("The timeline family does not match the selected parent.")
    if data.document_id:
        document = (await session.execute(select(Document).where(Document.id == data.document_id))).scalar_one_or_none()
        if not document:
            raise ResourceNotFoundError("Document", data.document_id)
        if document.parent_id != data.parent_id:
            raise AuthorizationError("The attached document does not belong to the selected parent.")
    service = TimelineService(session)
    event = await service.create_event(data)
    return build_response(TimelineEventResponse.model_validate(event))


@router.get("/parent/{parent_id}", response_model=ApiResponse[list[TimelineEventResponse]])
async def get_parent_timeline(
    parent_id: UUID,
    event_type: str | None = Query(None),
    context=Depends(get_parent_access_context),
    session: AsyncSession = Depends(get_db),
):
    service = TimelineService(session)
    events = await service.list_events(parent_id, event_type)
    return build_response([TimelineEventResponse.model_validate(e) for e in events])

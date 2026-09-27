# backend/app/api/v1/endpoints/timeline.py
from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_user, get_db, get_parent_access_context
from app.models.user import User
from app.schemas.timeline import TimelineEventCreate, TimelineEventResponse
from app.schemas.common import ApiResponse
from app.helpers.response_builder import build_response
from app.services.timeline_service import TimelineService

router = APIRouter(prefix="/timeline", tags=["Health Timeline"])


@router.post("", response_model=ApiResponse[TimelineEventResponse])
async def create_timeline_event(
    data: TimelineEventCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = TimelineService(session)
    event = await service.create_event(data)
    return build_response(TimelineEventResponse.model_validate(event))


@router.get("/parent/{parent_id}", response_model=ApiResponse[List[TimelineEventResponse]])
async def get_parent_timeline(
    parent_id: UUID,
    event_type: Optional[str] = Query(None),
    context=Depends(get_parent_access_context),
    session: AsyncSession = Depends(get_db),
):
    service = TimelineService(session)
    events = await service.list_events(parent_id, event_type)
    return build_response([TimelineEventResponse.model_validate(e) for e in events])

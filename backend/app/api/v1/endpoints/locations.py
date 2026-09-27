# backend/app/api/v1/endpoints/locations.py
from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_user, get_db, get_parent_access_context
from app.models.user import User
from app.schemas.location import LocationVisitCreate, LocationVisitUpdate, LocationVisitResponse
from app.schemas.common import ApiResponse
from app.helpers.response_builder import build_response
from app.services.location_service import LocationService

router = APIRouter(prefix="/parents/{parent_id}/locations", tags=["Location Visits"])


@router.post("/visits", response_model=ApiResponse[LocationVisitResponse])
async def record_parent_visit(
    parent_id: UUID,
    data: LocationVisitCreate,
    context=Depends(get_parent_access_context),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    parent, _ = context
    service = LocationService(session)
    visit = await service.record_visit(parent.family_id, current_user.id, data)
    return build_response(LocationVisitResponse.model_validate(visit))


@router.get("/visits", response_model=ApiResponse[List[LocationVisitResponse]])
async def list_parent_visits(
    parent_id: UUID,
    context=Depends(get_parent_access_context),
    session: AsyncSession = Depends(get_db),
):
    service = LocationService(session)
    visits = await service.list_parent_visits(parent_id)
    return build_response([LocationVisitResponse.model_validate(v) for v in visits])


@router.patch("/visits/{visit_id}", response_model=ApiResponse[LocationVisitResponse])
async def update_parent_visit(
    parent_id: UUID,
    visit_id: UUID,
    data: LocationVisitUpdate,
    context=Depends(get_parent_access_context),
    session: AsyncSession = Depends(get_db),
):
    service = LocationService(session)
    updated = await service.update_visit(visit_id, data)
    return build_response(LocationVisitResponse.model_validate(updated))


@router.delete("/visits/{visit_id}", response_model=ApiResponse[dict])
async def delete_parent_visit(
    parent_id: UUID,
    visit_id: UUID,
    context=Depends(get_parent_access_context),
    session: AsyncSession = Depends(get_db),
):
    service = LocationService(session)
    await service.delete_visit(visit_id)
    return build_response({"status": "deleted", "visit_id": str(visit_id)})

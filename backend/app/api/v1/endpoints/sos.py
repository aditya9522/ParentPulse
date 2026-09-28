from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.helpers.response_builder import build_response
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.sos import PushDeviceRegister, SosAcknowledge, SosCreate, SosResponse
from app.services.sos_service import SosService

router = APIRouter(tags=["Emergency SOS & Push Devices"])


@router.post("/push-devices", response_model=ApiResponse[dict])
async def register_push_device(data: PushDeviceRegister, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    device = await SosService(session).register_device(current_user.id, data.expo_push_token, data.platform, data.device_name)
    return build_response({"id": str(device.id), "registered": True})


@router.delete("/push-devices", response_model=ApiResponse[dict])
async def deactivate_push_device(expo_push_token: str = Query(...), current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    await SosService(session).deactivate_device(current_user.id, expo_push_token)
    return build_response({"registered": False})


@router.post("/sos", response_model=ApiResponse[SosResponse], status_code=201)
async def create_sos(data: SosCreate, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    event, registered, accepted = await SosService(session).start(current_user.id, data.parent_id, data.latitude, data.longitude, data.message)
    return build_response(SosResponse(id=event.id, parent_id=event.parent_id, status=event.status, recipients_registered=registered, pushes_accepted=accepted, created_at=event.created_at))


@router.post("/sos/{event_id}/acknowledge", response_model=ApiResponse[dict])
async def acknowledge_sos(event_id: UUID, data: SosAcknowledge, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    count = await SosService(session).acknowledge(current_user.id, event_id, data.response)
    return build_response({"sos_event_id": str(event_id), "acknowledgements": count})


@router.post("/sos/{event_id}/resolve", response_model=ApiResponse[SosResponse])
async def resolve_sos(event_id: UUID, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    service = SosService(session)
    event = await service.resolve(current_user.id, event_id)
    count = await service.acknowledgement_count(event_id)
    return build_response(SosResponse(id=event.id, parent_id=event.parent_id, status=event.status, recipients_registered=0, pushes_accepted=0, acknowledgements=count, created_at=event.created_at, resolved_at=event.resolved_at))

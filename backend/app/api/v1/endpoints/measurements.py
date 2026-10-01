# backend/app/api/v1/endpoints/measurements.py
from uuid import UUID
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.api.dependencies import get_current_user, get_db, get_parent_access_context
from app.core.permissions import verify_parent_access
from app.models.user import User
from app.models.measurement import Measurement
from app.schemas.measurement import MeasurementCreate, MeasurementResponse
from app.schemas.common import ApiResponse
from app.helpers.response_builder import build_response

router = APIRouter(prefix="/measurements", tags=["Measurements & Vitals"])


@router.post("", response_model=ApiResponse[MeasurementResponse])
async def log_vital_measurement(
    data: MeasurementCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    await verify_parent_access(session, current_user.id, data.parent_id)
    recorded_at = data.recorded_at or datetime.now(timezone.utc)
    measurement = Measurement(
        parent_id=data.parent_id,
        vital_type=data.vital_type.value,
        value_numeric=data.value_numeric,
        value_secondary=data.value_secondary,
        unit=data.unit,
        recorded_at=recorded_at,
        notes=data.notes,
        recorded_by=current_user.id,
    )
    session.add(measurement)
    await session.flush()
    return build_response(MeasurementResponse.model_validate(measurement))


@router.get("/parent/{parent_id}", response_model=ApiResponse[List[MeasurementResponse]])
async def list_parent_measurements(
    parent_id: UUID,
    vital_type: Optional[str] = Query(None),
    context=Depends(get_parent_access_context),
    session: AsyncSession = Depends(get_db),
):
    conditions = [Measurement.parent_id == parent_id]
    if vital_type:
        conditions.append(Measurement.vital_type == vital_type)

    stmt = select(Measurement).where(and_(*conditions)).order_by(Measurement.recorded_at.desc())
    res = await session.execute(stmt)
    records = list(res.scalars().all())
    return build_response([MeasurementResponse.model_validate(m) for m in records])


@router.delete("/{measurement_id}", status_code=204)
async def delete_measurement(
    measurement_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Measurement).where(Measurement.id == measurement_id)
    res = await session.execute(stmt)
    measurement = res.scalar_one_or_none()
    if not measurement:
        return None
    await verify_parent_access(session, current_user.id, measurement.parent_id)
    await session.delete(measurement)
    await session.flush()
    return None

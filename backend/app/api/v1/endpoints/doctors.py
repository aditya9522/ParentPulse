# backend/app/api/v1/endpoints/doctors.py
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.dependencies import get_current_user, get_db
from app.models.doctor import Doctor
from app.models.user import User
from app.schemas.doctor import DoctorCreate, DoctorResponse
from app.schemas.common import ApiResponse
from app.helpers.response_builder import build_response

router = APIRouter(prefix="/doctors", tags=["Doctors"])


@router.post("", response_model=ApiResponse[DoctorResponse])
async def register_doctor(
    data: DoctorCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    doctor = Doctor(
        name=data.name,
        specialty=data.specialty,
        hospital_or_clinic=data.hospital_or_clinic,
        phone_number=data.phone_number,
        email=data.email,
        address=data.address,
        is_verified=True,
    )
    session.add(doctor)
    await session.flush()
    return build_response(DoctorResponse.model_validate(doctor))


@router.get("", response_model=ApiResponse[List[DoctorResponse]])
async def list_verified_doctors(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Doctor).order_by(Doctor.name.asc())
    res = await session.execute(stmt)
    doctors = list(res.scalars().all())
    return build_response([DoctorResponse.model_validate(d) for d in doctors])

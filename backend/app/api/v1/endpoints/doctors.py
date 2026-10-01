# backend/app/api/v1/endpoints/doctors.py
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.dependencies import get_current_user, get_db
from app.models.doctor import Doctor
from app.models.user import User
from uuid import UUID
from app.core.exceptions import ResourceNotFoundError
from app.schemas.doctor import DoctorCreate, DoctorResponse, DoctorUpdate

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
        # Directory verification is an administrative trust decision. A signed-in
        # user may submit a provider, but cannot self-assert verification.
        is_verified=False,
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


@router.get("/{doctor_id}", response_model=ApiResponse[DoctorResponse])
async def get_doctor(
    doctor_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Doctor).where(Doctor.id == doctor_id)
    res = await session.execute(stmt)
    doctor = res.scalar_one_or_none()
    if not doctor:
        raise ResourceNotFoundError("Doctor", doctor_id)
    return build_response(DoctorResponse.model_validate(doctor))


@router.patch("/{doctor_id}", response_model=ApiResponse[DoctorResponse])
async def update_doctor(
    doctor_id: UUID,
    data: DoctorUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Doctor).where(Doctor.id == doctor_id)
    res = await session.execute(stmt)
    doctor = res.scalar_one_or_none()
    if not doctor:
        raise ResourceNotFoundError("Doctor", doctor_id)

    update_dict = data.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        if val is not None:
            setattr(doctor, field, val)

    await session.flush()
    return build_response(DoctorResponse.model_validate(doctor))


@router.delete("/{doctor_id}", status_code=204)
async def delete_doctor(
    doctor_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Doctor).where(Doctor.id == doctor_id)
    res = await session.execute(stmt)
    doctor = res.scalar_one_or_none()
    if not doctor:
        raise ResourceNotFoundError("Doctor", doctor_id)

    await session.delete(doctor)
    await session.flush()
    return None

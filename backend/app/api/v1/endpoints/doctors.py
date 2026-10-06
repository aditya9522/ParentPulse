# backend/app/api/v1/endpoints/doctors.py
import uuid
from datetime import date, datetime, timezone
from typing import Optional, List, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_optional_current_user, get_db
from app.core.exceptions import ResourceNotFoundError
from app.helpers.response_builder import build_response
from app.models.doctor import Doctor
from app.models.parent_profile import ParentProfile
from app.models.measurement import Measurement
from app.models.medicine import Medicine
from app.models.timeline_event import TimelineEvent
from app.models.appointment import Appointment
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.doctor import DoctorCreate, DoctorResponse, DoctorUpdate

router = APIRouter(prefix="/doctors", tags=["Doctors & Clinical Portal"])


# -------------------------------------------------------------
# Doctor Directory CRUD (Existing)
# -------------------------------------------------------------

@router.post("", response_model=ApiResponse[DoctorResponse])
async def register_doctor(
    data: DoctorCreate,
    current_user: User | None = Depends(get_optional_current_user),
    session: AsyncSession = Depends(get_db),
):
    doctor = Doctor(
        name=data.name,
        specialty=data.specialty,
        hospital_or_clinic=data.hospital_or_clinic,
        phone_number=data.phone_number,
        email=data.email,
        address=data.address,
        is_verified=False,
    )
    session.add(doctor)
    await session.flush()
    return build_response(DoctorResponse.model_validate(doctor))


@router.get("", response_model=ApiResponse[list[DoctorResponse]])
async def list_verified_doctors(
    current_user: User | None = Depends(get_optional_current_user),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Doctor).order_by(Doctor.name.asc())
    res = await session.execute(stmt)
    doctors = list(res.scalars().all())
    return build_response([DoctorResponse.model_validate(d) for d in doctors])


@router.get("/{doctor_id}", response_model=ApiResponse[DoctorResponse])
async def get_doctor(
    doctor_id: UUID,
    current_user: User | None = Depends(get_optional_current_user),
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
    current_user: User | None = Depends(get_optional_current_user),
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
    current_user: User | None = Depends(get_optional_current_user),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Doctor).where(Doctor.id == doctor_id)
    res = await session.execute(stmt)
    doctor = res.scalar_one_or_none()
    if not doctor:
        raise ResourceNotFoundError("Doctor", doctor_id)

    await session.delete(doctor)
    await session.flush()


# -------------------------------------------------------------
# Clinical Portal Endpoints (Patients, Prescriptions, Vitals)
# -------------------------------------------------------------

class PrescribedItem(BaseModel):
    name: str
    dosage: str
    form: str = "tablet"
    frequency: str = "OD"  # OD (1/day), BD (2/day), TDS (3/day), QDS (4/day), PRN (as needed)
    meal_timing: str = "after_food"  # before_food, after_food, with_food
    duration_days: int = 30
    instructions: Optional[str] = None
    refill_threshold: int = 5


class PrescriptionCreateRequest(BaseModel):
    parent_id: UUID
    diagnosis: str
    doctor_name: Optional[str] = "Dr. Rajesh Sharma"
    facility_name: Optional[str] = "Max Healthcare Hospital"
    notes: Optional[str] = None
    medications: List[PrescribedItem]


class ClinicalMilestoneCreate(BaseModel):
    parent_id: UUID
    title: str
    event_type: str = "doctor_visit"  # doctor_visit, lab_test, medicine_started, surgery, diagnosis
    event_date: Optional[datetime] = None
    doctor_name: Optional[str] = None
    facility_name: Optional[str] = None
    description: str


@router.get("/portal/patients", response_model=ApiResponse[list[dict]])
async def list_clinical_patients(
    current_user: User | None = Depends(get_optional_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Returns clinical roster of patients with demographics and last known vital alerts.
    """
    stmt = select(ParentProfile).order_by(ParentProfile.full_name.asc())
    res = await session.execute(stmt)
    parents = list(res.scalars().all())

    patient_summaries = []
    today = date.today()

    for p in parents:
        # Calculate age
        age = today.year - p.date_of_birth.year - (
            (today.month, today.day) < (p.date_of_birth.month, p.date_of_birth.day)
        ) if p.date_of_birth else None

        # Fetch recent measurement
        v_stmt = select(Measurement).where(Measurement.parent_id == p.id).order_by(Measurement.recorded_at.desc()).limit(1)
        v_res = await session.execute(v_stmt)
        latest_vital = v_res.scalar_one_or_none()

        patient_summaries.append({
            "id": str(p.id),
            "family_id": str(p.family_id),
            "full_name": p.full_name,
            "gender": p.gender,
            "age": age,
            "blood_group": p.blood_group,
            "phone_number": p.phone_number,
            "address": p.address,
            "chronic_conditions": p.chronic_conditions or [],
            "allergies": p.allergies or [],
            "surgeries": p.surgeries or [],
            "primary_doctors": p.primary_doctors or [],
            "last_vital": {
                "type": latest_vital.vital_type,
                "value": float(latest_vital.value_numeric),
                "value_secondary": float(latest_vital.value_secondary) if latest_vital.value_secondary is not None else None,
                "unit": latest_vital.unit,
                "recorded_at": latest_vital.recorded_at.isoformat(),
            } if latest_vital else None,
        })

    return build_response(patient_summaries)


@router.get("/portal/patients/{parent_id}", response_model=ApiResponse[dict])
async def get_patient_clinical_chart(
    parent_id: UUID,
    current_user: User | None = Depends(get_optional_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Full clinical chart for a selected parent: demographics, active meds, recent vitals, and timeline.
    """
    p_stmt = select(ParentProfile).where(ParentProfile.id == parent_id)
    p_res = await session.execute(p_stmt)
    parent = p_res.scalar_one_or_none()
    if not parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found")

    # Fetch active medicines
    m_stmt = select(Medicine).where(Medicine.parent_id == parent_id, Medicine.is_active.is_(True)).order_by(Medicine.name.asc())
    m_res = await session.execute(m_stmt)
    medicines = list(m_res.scalars().all())

    # Fetch recent measurements (last 20)
    meas_stmt = select(Measurement).where(Measurement.parent_id == parent_id).order_by(Measurement.recorded_at.desc()).limit(20)
    meas_res = await session.execute(meas_stmt)
    measurements = list(meas_res.scalars().all())

    # Fetch timeline milestones
    tl_stmt = select(TimelineEvent).where(TimelineEvent.parent_id == parent_id).order_by(TimelineEvent.event_date.desc()).limit(15)
    tl_res = await session.execute(tl_stmt)
    timeline_events = list(tl_res.scalars().all())

    today = date.today()
    age = today.year - parent.date_of_birth.year - (
        (today.month, today.day) < (parent.date_of_birth.month, parent.date_of_birth.day)
    ) if parent.date_of_birth else None

    return build_response({
        "patient": {
            "id": str(parent.id),
            "family_id": str(parent.family_id),
            "full_name": parent.full_name,
            "gender": parent.gender,
            "age": age,
            "date_of_birth": parent.date_of_birth.isoformat() if parent.date_of_birth else None,
            "blood_group": parent.blood_group,
            "phone_number": parent.phone_number,
            "address": parent.address,
            "emergency_contacts": parent.emergency_contacts or [],
            "chronic_conditions": parent.chronic_conditions or [],
            "allergies": parent.allergies or [],
            "surgeries": parent.surgeries or [],
            "primary_doctors": parent.primary_doctors or [],
        },
        "active_medicines": [
            {
                "id": str(med.id),
                "name": med.name,
                "dosage": med.dosage,
                "form": med.form,
                "frequency_times_per_day": med.frequency_times_per_day,
                "schedule_times": med.schedule_times,
                "instructions": med.instructions,
                "start_date": med.start_date.isoformat() if med.start_date else None,
                "current_inventory": med.current_inventory,
                "refill_alert_threshold": med.refill_alert_threshold,
                "prescribing_doctor": med.prescribing_doctor,
            }
            for med in medicines
        ],
        "recent_vitals": [
            {
                "id": str(m.id),
                "vital_type": m.vital_type,
                "value_numeric": float(m.value_numeric),
                "value_secondary": float(m.value_secondary) if m.value_secondary is not None else None,
                "unit": m.unit,
                "recorded_at": m.recorded_at.isoformat(),
                "notes": m.notes,
            }
            for m in measurements
        ],
        "timeline_events": [
            {
                "id": str(t.id),
                "title": t.title,
                "event_type": t.event_type,
                "description": t.description,
                "event_date": t.event_date.isoformat(),
                "doctor_name": t.doctor_name,
                "facility_name": t.facility_name,
            }
            for t in timeline_events
        ],
    })


@router.post("/portal/prescriptions", response_model=ApiResponse[dict])
async def create_digital_prescription(
    data: PrescriptionCreateRequest,
    current_user: User | None = Depends(get_optional_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Prescription authoring endpoint:
    1. Validates patient existence.
    2. Maps prescribed drugs into `Medicine` records with automated schedule time computation.
    3. Persists medicines and links them to the patient's Care Circle.
    4. Auto-creates a clinical timeline milestone event for the consultation and prescription.
    """
    p_stmt = select(ParentProfile).where(ParentProfile.id == data.parent_id)
    p_res = await session.execute(p_stmt)
    parent = p_res.scalar_one_or_none()
    if not parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent profile not found")

    created_medicines = []
    med_names = []

    # Frequency to schedule time auto-generation mapping
    schedule_map = {
        "OD": (1, ["08:00"]),
        "BD": (2, ["08:00", "20:00"]),
        "TDS": (3, ["08:00", "14:00", "20:00"]),
        "QDS": (4, ["08:00", "12:00", "16:00", "20:00"]),
        "PRN": (1, ["08:00"]),
    }

    start_d = date.today()

    for item in data.medications:
        freq_info = schedule_map.get(item.frequency.upper(), (1, ["08:00"]))
        freq_count = freq_info[0]
        schedule_slots = freq_info[1]

        medicine = Medicine(
            parent_id=parent.id,
            family_id=parent.family_id,
            name=item.name,
            dosage=item.dosage,
            form=item.form,
            frequency_times_per_day=freq_count,
            schedule_times=schedule_slots,
            instructions=item.meal_timing or "after_food",
            prescribing_doctor=data.doctor_name or "Dr. Rajesh Sharma",
            reason=data.diagnosis,
            start_date=start_d,
            current_inventory=item.duration_days * freq_count,
            refill_alert_threshold=item.refill_threshold or 5,
            is_active=True,
        )
        session.add(medicine)
        created_medicines.append(medicine)
        med_names.append(f"{item.name} ({item.dosage})")

    # Auto-record clinical timeline event
    summary_desc = (
        f"Diagnosis: {data.diagnosis}\n"
        f"Prescribed Medications: {', '.join(med_names)}\n"
        f"Clinical Notes: {data.notes or 'Routine follow-up consultation'}"
    )

    timeline_event = TimelineEvent(
        parent_id=parent.id,
        family_id=parent.family_id,
        title=f"Clinical Consultation & Rx: {data.diagnosis}",
        event_type="medicine_started",
        description=summary_desc,
        event_date=datetime.now(timezone.utc),
        doctor_name=data.doctor_name or "Dr. Rajesh Sharma",
        facility_name=data.facility_name or "Max Healthcare",
        metadata_json={
            "diagnosis": data.diagnosis,
            "prescribed_count": len(data.medications),
        },
    )
    session.add(timeline_event)

    await session.flush()

    return build_response({
        "prescription_id": str(uuid.uuid4()),
        "parent_id": str(parent.id),
        "parent_name": parent.full_name,
        "diagnosis": data.diagnosis,
        "medications_created": len(created_medicines),
        "timeline_event_id": str(timeline_event.id),
        "message": f"Successfully authorized prescription with {len(created_medicines)} medication schedules created.",
    })


@router.post("/portal/milestones", response_model=ApiResponse[dict])
async def add_clinical_milestone(
    data: ClinicalMilestoneCreate,
    current_user: User | None = Depends(get_optional_current_user),
    session: AsyncSession = Depends(get_db),
):
    p_stmt = select(ParentProfile).where(ParentProfile.id == data.parent_id)
    p_res = await session.execute(p_stmt)
    parent = p_res.scalar_one_or_none()
    if not parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")

    event = TimelineEvent(
        parent_id=parent.id,
        family_id=parent.family_id,
        title=data.title,
        event_type=data.event_type,
        description=data.description,
        event_date=data.event_date or datetime.now(timezone.utc),
        doctor_name=data.doctor_name,
        facility_name=data.facility_name,
        metadata_json={},
    )
    session.add(event)
    await session.flush()

    return build_response({
        "id": str(event.id),
        "title": event.title,
        "event_date": event.event_date.isoformat(),
        "message": "Clinical milestone successfully recorded",
    })


@router.get("/portal/appointments", response_model=ApiResponse[list[dict]])
async def list_doctor_portal_appointments(
    current_user: User | None = Depends(get_optional_current_user),
    session: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Appointment, ParentProfile.full_name)
        .join(ParentProfile, Appointment.parent_id == ParentProfile.id)
        .order_by(Appointment.appointment_date.desc())
        .limit(50)
    )
    res = await session.execute(stmt)
    rows = res.all()

    return build_response([
        {
            "id": str(apt.id),
            "parent_id": str(apt.parent_id),
            "parent_name": parent_name,
            "doctor_name": apt.doctor_name,
            "specialty": apt.specialty,
            "hospital_clinic_name": apt.hospital_clinic_name,
            "appointment_date": apt.appointment_date.isoformat() if apt.appointment_date else None,
            "status": apt.status,
            "reason": apt.reason,
            "notes": apt.notes,
        }
        for apt, parent_name in rows
    ])


@router.patch("/portal/appointments/{appointment_id}/status", response_model=ApiResponse[dict])
async def update_appointment_status(
    appointment_id: UUID,
    status: str = Query(..., description="confirmed, completed, cancelled"),
    current_user: User | None = Depends(get_optional_current_user),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Appointment).where(Appointment.id == appointment_id)
    res = await session.execute(stmt)
    apt = res.scalar_one_or_none()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    apt.status = status
    await session.flush()

    return build_response({
        "id": str(apt.id),
        "status": apt.status,
        "message": f"Appointment status updated to {status}",
    })


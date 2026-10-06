# backend/scripts/seed_portal_data.py
import asyncio
import uuid
from datetime import datetime, timezone, date, timedelta
from sqlalchemy import select
from app.db.session import get_db_session
from app.models.doctor import Doctor
from app.models.parent_profile import ParentProfile
from app.models.appointment import Appointment
from app.models.sos_event import SosEvent
from app.models.timeline_event import TimelineEvent
from app.models.user import User


async def seed():
    async for session in get_db_session():
        # 1. Seed Doctors if empty
        docs = (await session.execute(select(Doctor))).scalars().all()
        if not docs:
            print("Seeding doctors...")
            d1 = Doctor(
                id=uuid.uuid4(),
                name="Dr. Rajesh Sharma",
                specialty="Senior Geriatric Medicine & Cardiology",
                hospital_or_clinic="Max Super Speciality Hospital, Saket",
                phone_number="+91 98100 23456",
                email="dr.rajesh.sharma@maxhealthcare.com",
                address="Saket, New Delhi",
                is_verified=True,
            )
            d2 = Doctor(
                id=uuid.uuid4(),
                name="Dr. Ananya Sen",
                specialty="Cardiology & Interventional Care",
                hospital_or_clinic="Apollo Hospitals, Sarita Vihar",
                phone_number="+91 98234 56789",
                email="dr.ananya.sen@apollo.com",
                address="Sarita Vihar, Delhi Mathura Road",
                is_verified=True,
            )
            d3 = Doctor(
                id=uuid.uuid4(),
                name="Dr. Arvind Saxena",
                specialty="Neurology & Cognitive Care",
                hospital_or_clinic="Fortis Memorial Research Institute (FMRI)",
                phone_number="+91 99102 99887",
                email="arvind.saxena@fortishealthcare.com",
                address="Sector 44, Gurugram",
                is_verified=False,
            )
            d4 = Doctor(
                id=uuid.uuid4(),
                name="Dr. Meenakshi Sundaram",
                specialty="Endocrinology & Diabetic Care",
                hospital_or_clinic="Medanta - The Medicity",
                phone_number="+91 98110 33445",
                email="m.sundaram@medanta.org",
                address="Sector 38, Gurugram",
                is_verified=False,
            )
            session.add_all([d1, d2, d3, d4])
            await session.commit()
            print("Doctors seeded successfully!")

        # 2. Check parents and seed sample appointment and timeline if 0
        parents = (await session.execute(select(ParentProfile))).scalars().all()
        apts = (await session.execute(select(Appointment))).scalars().all()
        if parents and not apts:
            print("Seeding appointments...")
            p = parents[0]
            apt1 = Appointment(
                id=uuid.uuid4(),
                parent_id=p.id,
                family_id=p.family_id,
                doctor_name="Dr. Rajesh Sharma",
                specialty="Geriatric Medicine",
                hospital_clinic_name="Max Super Speciality Hospital",
                appointment_date=datetime.now(timezone.utc) + timedelta(days=2),
                status="upcoming",
                reason="Routine Blood Pressure & Diabetes Tele-Review",
                notes="Patient advised to maintain morning fasting readings.",
            )
            session.add(apt1)
            await session.commit()
            print("Appointment seeded!")

        # 3. Check SOS events
        sos_list = (await session.execute(select(SosEvent))).scalars().all()
        users = (await session.execute(select(User))).scalars().all()
        if parents and users and not sos_list:
            print("Seeding sample SOS event...")
            p = parents[0]
            u = users[0]
            sos1 = SosEvent(
                id=uuid.uuid4(),
                parent_id=p.id,
                family_id=p.family_id,
                initiated_by=u.id,
                status="active",
                latitude=28.4595,
                longitude=77.0266,
                message="Elevated Systolic Surge (168/102 mmHg) and dizziness reported at residence.",
            )
            session.add(sos1)
            await session.commit()
            print("SOS event seeded!")

        break


if __name__ == "__main__":
    asyncio.run(seed())

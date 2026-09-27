# backend/scripts/seed_database.py
import asyncio
from sqlalchemy import text
from app.db.session import engine

SEED_SQL = """
-- 1. Ensure Users
INSERT INTO users (id, email, full_name, phone_number, preferred_language)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'priya.sharma@example.com', 'Priya Sharma (Daughter)', '+919876543210', 'en'),
    ('22222222-2222-2222-2222-222222222222', 'ramesh.sharma@example.com', 'Ramesh Sharma (Father)', '+919812345678', 'hi'),
    ('33333333-3333-3333-3333-333333333333', 'sunita.sharma@example.com', 'Sunita Sharma (Mother)', '+919812345679', 'hi'),
    ('44444444-4444-4444-4444-444444444444', 'dr.verma@example.com', 'Dr. Arun Verma (Cardiologist)', '+919822334455', 'en')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 2. Ensure Family
INSERT INTO families (id, name, created_by)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sharma Family Care', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- 3. Ensure Family Members
INSERT INTO family_members (id, family_id, user_id, role, relationship, can_manage_medicines, can_manage_appointments, can_upload_documents, can_share_doctor_brief, can_view_location_history)
VALUES 
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'family_member', 'daughter', true, true, true, true, true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'parent', 'father', true, true, true, false, true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'parent', 'mother', true, true, true, false, true)
ON CONFLICT (family_id, user_id) DO NOTHING;

-- 4. Father Profile (Ramesh Sharma)
INSERT INTO parent_profiles (
    id, family_id, full_name, date_of_birth, gender, blood_group, preferred_language, address, latitude, longitude, phone_number,
    allergies, chronic_conditions, surgeries, emergency_contacts, primary_doctors
)
VALUES (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Ramesh Sharma',
    '1954-08-15',
    'male',
    'B+',
    'hi',
    'Flat 402, Shanti Niketan Apartments, Sector 14, Gurugram, Haryana, India',
    28.4721,
    77.0428,
    '+919812345678',
    '["Penicillin", "Sulfa drugs"]'::jsonb,
    '["Type 2 Diabetes Mellitus", "Hypertension", "Mild Osteoarthritis"]'::jsonb,
    '[{"name": "Cataract Surgery (Right Eye)", "date": "2023-04-12"}]'::jsonb,
    '[{"name": "Priya Sharma", "relationship": "Daughter", "phone_number": "+919876543210", "is_primary": true}]'::jsonb,
    '[{"name": "Dr. Arun Verma", "specialty": "Cardiology", "hospital_or_clinic": "Fortis Memorial Research Institute", "phone_number": "+919822334455"}]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 5. Mother Profile (Sunita Sharma)
INSERT INTO parent_profiles (
    id, family_id, full_name, date_of_birth, gender, blood_group, preferred_language, address, latitude, longitude, phone_number,
    allergies, chronic_conditions, surgeries, emergency_contacts, primary_doctors
)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Sunita Sharma',
    '1958-11-22',
    'female',
    'O+',
    'hi',
    'Flat 402, Shanti Niketan Apartments, Sector 14, Gurugram, Haryana, India',
    28.4721,
    77.0428,
    '+919812345679',
    '["Aspirin"]'::jsonb,
    '["Hypothyroidism", "Osteopenia"]'::jsonb,
    '[]'::jsonb,
    '[{"name": "Priya Sharma", "relationship": "Daughter", "phone_number": "+919876543210", "is_primary": true}]'::jsonb,
    '[{"name": "Dr. Ananya Ray", "specialty": "Endocrinologist", "hospital_or_clinic": "Artemis Hospital", "phone_number": "+919844556677"}]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 6. Medicines for Father & Mother
INSERT INTO medicines (
    id, parent_id, family_id, name, dosage, form, frequency_times_per_day, schedule_times, instructions, prescribing_doctor, reason, start_date, current_inventory, refill_alert_threshold
)
VALUES 
    (
        'dddddddd-dddd-dddd-dddd-dddddddddd01',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Telmisartan',
        '40mg',
        'tablet',
        1,
        '["08:00 AM"]'::jsonb,
        'after_food',
        'Dr. Arun Verma',
        'Blood Pressure regulation',
        '2024-01-01',
        24,
        7
    ),
    (
        'dddddddd-dddd-dddd-dddd-dddddddddd02',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Metformin SR',
        '500mg',
        'tablet',
        2,
        '["08:30 AM", "08:30 PM"]'::jsonb,
        'with_food',
        'Dr. Meenakshi Sundaram',
        'Type 2 Diabetes sugar control',
        '2023-11-15',
        18,
        5
    ),
    (
        'dddddddd-dddd-dddd-dddd-dddddddddd03',
        '33333333-3333-3333-3333-333333333333',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Thyronorm',
        '50mcg',
        'tablet',
        1,
        '["06:30 AM"]'::jsonb,
        'empty_stomach',
        'Dr. Ananya Ray',
        'Thyroid regulation',
        '2023-01-01',
        45,
        10
    )
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 7. Real Documents
INSERT INTO documents (
    id, parent_id, family_id, uploaded_by, title, document_type, file_url, storage_path, file_size_bytes, mime_type, document_date, status, doctor_name, hospital_name, summary, extracted_tags, extracted_fields
)
VALUES 
    (
        '77777777-7777-7777-7777-777777777701',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111',
        'Prescription - Hypertension & Diabetes Management',
        'prescription',
        'https://zrbdjorznotclhwwaqnh.supabase.co/storage/v1/object/public/documents/rx_cardiac_verma.pdf',
        'parentpulse/cccccccc-cccc-cccc-cccc-cccccccccccc/rx_verma.pdf',
        245890,
        'application/pdf',
        '2026-09-15',
        'extracted',
        'Dr. Arun Verma',
        'Fortis Memorial Research Institute',
        'Prescribed Telmisartan 40mg once daily in morning. Blood pressure target < 130/80 mmHg. Review in 1 month with lipid profile.',
        '["Prescription", "Cardiology", "Telmisartan", "Verified", "Gemini OCR"]'::jsonb,
        '{"bp_target": "<130/80", "compliance": "Strict", "next_visit": "2026-10-05"}'::jsonb
    ),
    (
        '77777777-7777-7777-7777-777777777702',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111',
        'HbA1c & Fasting Lipid Diagnostic Report',
        'lab_report',
        'https://zrbdjorznotclhwwaqnh.supabase.co/storage/v1/object/public/documents/hba1c_sep2026.pdf',
        'parentpulse/cccccccc-cccc-cccc-cccc-cccccccccccc/hba1c_sep.pdf',
        189420,
        'application/pdf',
        '2026-09-12',
        'extracted',
        'Dr. Lal PathLabs',
        'Diagnostic Laboratory Sector 14',
        'HbA1c: 6.8% (Target controlled < 7.0% for age 72). Fasting Glucose: 118 mg/dL. Total Cholesterol: 182 mg/dL. LDL: 95 mg/dL. Kidney biomarkers within normal thresholds.',
        '["Lab Diagnostic", "HbA1c Normal", "Lipid Profile", "Gemini OCR"]'::jsonb,
        '{"hba1c": "6.8%", "fasting_glucose": "118 mg/dL", "cholesterol": "182 mg/dL", "status": "Normal"}'::jsonb
    ),
    (
        '77777777-7777-7777-7777-777777777703',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111',
        'Chest X-Ray & 12-Lead ECG Analysis',
        'radiology',
        'https://zrbdjorznotclhwwaqnh.supabase.co/storage/v1/object/public/documents/ecg_aug2026.pdf',
        'parentpulse/cccccccc-cccc-cccc-cccc-cccccccccccc/ecg_aug.pdf',
        521300,
        'application/pdf',
        '2026-08-20',
        'extracted',
        'Dr. P.K. Gupta',
        'Fortis Memorial Research Institute',
        'Sinus rhythm at 72 bpm. Normal cardiac axis, no acute ischemic ST-T abnormalities observed. Lung fields clear bilaterally.',
        '["Radiology", "ECG", "Chest X-Ray", "Normal"]'::jsonb,
        '{"heart_rate": "72 bpm", "rhythm": "Sinus", "status": "Normal"}'::jsonb
    )
ON CONFLICT (id) DO NOTHING;

-- 8. Appointments
INSERT INTO appointments (
    id, parent_id, family_id, doctor_name, specialty, hospital_clinic_name, appointment_date, status, reason, address, latitude, longitude
)
VALUES 
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Dr. Arun Verma',
        'Cardiology',
        'Fortis Memorial Research Institute',
        '2026-10-05 10:30:00+00',
        'upcoming',
        'Quarterly Blood Pressure Check & ECG Review',
        'Sector 44, Gurugram, Haryana',
        28.4595,
        77.0725
    ),
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Dr. Meenakshi Sundaram',
        'Endocrinology',
        'Max Super Speciality Hospital',
        '2026-10-18 16:00:00+00',
        'upcoming',
        'Quarterly Diabetes & HbA1c Review',
        'B-Block, Sushant Lok 1, Gurugram',
        28.4682,
        77.0812
    )
ON CONFLICT (id) DO NOTHING;

-- 9. Timeline Events
INSERT INTO timeline_events (
    id, parent_id, family_id, title, description, event_type, event_date, doctor_name, facility_name
)
VALUES 
    (
        '99999999-9999-9999-9999-999999999901',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Cardiology Consultation with Dr. Arun Verma',
        'Blood pressure recorded at 128/82 mmHg. Maintained Telmisartan 40mg. Advised 30 min gentle morning walks.',
        'doctor_visit',
        '2026-09-15 11:00:00+00',
        'Dr. Arun Verma',
        'Fortis Memorial Research Institute'
    ),
    (
        '99999999-9999-9999-9999-999999999902',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Quarterly Fasting Diagnostic Blood Work',
        'HbA1c stable at 6.8%. Fasting glucose 118 mg/dL. Kidney function (eGFR & Creatinine) normal.',
        'lab_test',
        '2026-09-12 08:30:00+00',
        'Dr. Lal PathLabs',
        'Diagnostic Laboratory Sector 14'
    ),
    (
        '99999999-9999-9999-9999-999999999903',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Cataract Surgery Follow-Up Consultation',
        'Right eye intraocular lens implant healing completely. 20/25 vision verified.',
        'surgery',
        '2023-04-20 10:00:00+00',
        'Dr. Daljit Singh',
        'Dr. Daljit Eye Clinic'
    )
ON CONFLICT (id) DO NOTHING;

-- 10. Health Measurements
INSERT INTO measurements (
    id, parent_id, vital_type, value_numeric, value_secondary, unit, recorded_at, recorded_by, notes
)
VALUES 
    (
        'ffffffff-ffff-ffff-ffff-ffffffff0001',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'blood_pressure',
        126.00,
        80.00,
        'mmHg',
        CURRENT_TIMESTAMP - INTERVAL '2 hours',
        '11111111-1111-1111-1111-111111111111',
        'Morning resting reading after breakfast'
    ),
    (
        'ffffffff-ffff-ffff-ffff-ffffffff0002',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'blood_sugar',
        114.00,
        NULL,
        'mg/dL',
        CURRENT_TIMESTAMP - INTERVAL '3 hours',
        '11111111-1111-1111-1111-111111111111',
        'Fasting blood glucose'
    ),
    (
        'ffffffff-ffff-ffff-ffff-ffffffff0003',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'heart_rate',
        74.00,
        NULL,
        'bpm',
        CURRENT_TIMESTAMP - INTERVAL '2 hours',
        '11111111-1111-1111-1111-111111111111',
        'Resting pulse'
    ),
    (
        'ffffffff-ffff-ffff-ffff-ffffffff0004',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'oxygen_saturation',
        98.00,
        NULL,
        '%',
        CURRENT_TIMESTAMP - INTERVAL '1 day',
        '11111111-1111-1111-1111-111111111111',
        'SpO2 normal'
    )
ON CONFLICT (id) DO NOTHING;

-- 11. Location Visits
INSERT INTO location_visits (
    id, parent_id, family_id, place_name, category, address, latitude, longitude, visited_at, confirmed_by
)
VALUES 
    (
        '88888888-8888-8888-8888-888888888801',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Fortis Memorial Research Institute',
        'hospital',
        'Sector 44, Gurugram, Haryana',
        28.4595,
        77.0725,
        CURRENT_TIMESTAMP - INTERVAL '5 days',
        '11111111-1111-1111-1111-111111111111'
    ),
    (
        '88888888-8888-8888-8888-888888888802',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Apollo Pharmacy 24/7',
        'pharmacy',
        'Sector 14 Market, Gurugram',
        28.4731,
        77.0435,
        CURRENT_TIMESTAMP - INTERVAL '3 days',
        '11111111-1111-1111-1111-111111111111'
    )
ON CONFLICT (id) DO NOTHING;
"""

async def run():
    print("Seeding full production database into Supabase PostgreSQL...")
    async with engine.begin() as conn:
        for statement in SEED_SQL.strip().split(";"):
            stmt = statement.strip()
            if stmt:
                await conn.execute(text(stmt))
    print("Database seeding finished successfully!")

if __name__ == "__main__":
    asyncio.run(run())

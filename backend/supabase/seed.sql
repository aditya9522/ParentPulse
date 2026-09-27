-- backend/supabase/seed.sql
-- Development seed data for ParentPulse

-- Seed Users
INSERT INTO users (id, email, full_name, phone_number, preferred_language)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'priya.sharma@example.com', 'Priya Sharma (Daughter)', '+919876543210', 'en'),
    ('22222222-2222-2222-2222-222222222222', 'ramesh.sharma@example.com', 'Ramesh Sharma (Father)', '+919812345678', 'hi'),
    ('33333333-3333-3333-3333-333333333333', 'sunita.sharma@example.com', 'Sunita Sharma (Mother)', '+919812345679', 'hi'),
    ('44444444-4444-4444-4444-444444444444', 'dr.verma@example.com', 'Dr. Arun Verma (Cardiologist)', '+919822334455', 'en')
ON CONFLICT (id) DO NOTHING;

-- Seed Family
INSERT INTO families (id, name, created_by)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sharma Family Care', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Seed Family Members
INSERT INTO family_members (id, family_id, user_id, role, relationship, can_manage_medicines, can_manage_appointments, can_upload_documents, can_share_doctor_brief, can_view_location_history)
VALUES 
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'family_member', 'daughter', true, true, true, true, true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'parent', 'father', true, true, true, false, true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'parent', 'mother', true, true, true, false, true)
ON CONFLICT (id) DO NOTHING;

-- Seed Parent Profile (Ramesh Sharma - Father)
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
ON CONFLICT (id) DO NOTHING;

-- Seed Medicines
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
        '["08:00"]'::jsonb,
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
        '["08:30", "20:30"]'::jsonb,
        'with_food',
        'Dr. Meenakshi Sundaram',
        'Type 2 Diabetes sugar control',
        '2023-11-15',
        18,
        5
    )
ON CONFLICT (id) DO NOTHING;

-- Seed Appointment
INSERT INTO appointments (
    id, parent_id, family_id, doctor_name, specialty, hospital_clinic_name, appointment_date, status, reason, address, latitude, longitude
)
VALUES (
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
)
ON CONFLICT (id) DO NOTHING;

-- Seed Health Measurement
INSERT INTO measurements (
    id, parent_id, vital_type, value_numeric, value_secondary, unit, recorded_at, recorded_by, notes
)
VALUES 
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'blood_pressure', 128.00, 82.00, 'mmHg', CURRENT_TIMESTAMP - INTERVAL '1 day', '11111111-1111-1111-1111-111111111111', 'Morning rest reading')
ON CONFLICT (id) DO NOTHING;

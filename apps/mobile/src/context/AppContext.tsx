import React, { createContext, useContext, useState, useEffect } from "react";
import * as Location from "expo-location";
import {
  ParentProfile,
  MedicalDocument,
  MedicineSchedule,
  Appointment,
  TimelineEvent,
  HealthMeasurement,
  HealthcarePlace,
  LocationVisit,
  CareTask,
  HealthcareExpense,
  InsurancePolicy,
  FamilyMemberItem,
  UserProfile,
  UserRole,
} from "../types";
import { apiClient } from "../api/client";

export type SupportedLanguage =
  | "en"
  | "hi"
  | "mr"
  | "gu"
  | "ta"
  | "te"
  | "bn"
  | "kn"
  | "ml"
  | "pa";

export type ActiveScreen =
  | "tabs"
  | "family"
  | "profile"
  | "expenses"
  | "settings"
  | "report"
  | "onboarding";

export interface MockParentData {
  profile: ParentProfile;
  medicines: MedicineSchedule[];
  appointments: Appointment[];
  documents: MedicalDocument[];
  timeline: TimelineEvent[];
  measurements: HealthMeasurement[];
  visits: LocationVisit[];
  tasks: CareTask[];
  expenses: HealthcareExpense[];
  insurance: InsurancePolicy[];
}

// Initial realistic demo data matching FEATURES.md
const INITIAL_FATHER_DATA: MockParentData = {
  profile: {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    family_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    full_name: "Ramesh Sharma",
    date_of_birth: "1954-08-15",
    gender: "male",
    blood_group: "B+",
    preferred_language: "hi",
    address: "Flat 402, Shanti Niketan Apartments, Sector 14, Gurugram, Haryana",
    latitude: 28.4721,
    longitude: 77.0428,
    phone_number: "+91 98123 45678",
    allergies: ["Penicillin", "Sulfa drugs"],
    chronic_conditions: ["Type 2 Diabetes Mellitus", "Hypertension", "Mild Osteoarthritis"],
    disabilities: [],
    surgeries: [
      { name: "Cataract Surgery (Right Eye)", date: "2023-04-12", notes: "Dr. Daljit Eye Clinic" },
    ],
    emergency_contacts: [
      { name: "Priya Sharma", relationship: "Daughter (Bangalore)", phone_number: "+91 98765 43210", is_primary: true },
      { name: "Sunita Sharma", relationship: "Wife (Gurugram)", phone_number: "+91 98123 45679", is_primary: false },
      { name: "Rajesh Sharma", relationship: "Son (Toronto)", phone_number: "+1 416 555 0192", is_primary: false },
    ],
    primary_doctors: [
      {
        name: "Dr. Arun Verma",
        specialty: "Cardiology",
        hospital_or_clinic: "Fortis Memorial Research Institute",
        phone_number: "+91 98223 34455",
        address: "Sector 44, Gurugram",
      },
      {
        name: "Dr. Meenakshi Sundaram",
        specialty: "Endocrinologist",
        hospital_or_clinic: "Max Super Speciality Hospital",
        phone_number: "+91 98334 45566",
      },
    ],
  },
  medicines: [
    {
      id: "dddddddd-dddd-dddd-dddd-dddddddddd01",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      name: "Telmisartan",
      dosage: "40mg",
      form: "tablet",
      frequency_times_per_day: 1,
      schedule_times: ["08:00 AM"],
      instructions: "after_food",
      prescribing_doctor: "Dr. Arun Verma",
      reason: "Blood Pressure control",
      start_date: "2024-01-01",
      current_inventory: 24,
      refill_alert_threshold: 7,
      is_active: true,
    },
    {
      id: "dddddddd-dddd-dddd-dddd-dddddddddd02",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      name: "Metformin SR",
      dosage: "500mg",
      form: "tablet",
      frequency_times_per_day: 2,
      schedule_times: ["08:30 AM", "08:30 PM"],
      instructions: "with_food",
      prescribing_doctor: "Dr. Meenakshi Sundaram",
      reason: "Type 2 Diabetes sugar regulation",
      start_date: "2023-11-15",
      current_inventory: 18,
      refill_alert_threshold: 5,
      is_active: true,
    },
    {
      id: "med_03",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      name: "Glimepiride",
      dosage: "1mg",
      form: "tablet",
      frequency_times_per_day: 1,
      schedule_times: ["08:00 AM"],
      instructions: "before_food",
      prescribing_doctor: "Dr. Meenakshi Sundaram",
      reason: "Diabetes fasting glucose control",
      start_date: "2024-03-10",
      current_inventory: 4, // Triggers refill alert!
      refill_alert_threshold: 7,
      is_active: true,
    },
  ],
  appointments: [
    {
      id: "app_01",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      doctor_name: "Dr. Arun Verma",
      specialty: "Cardiologist",
      hospital_clinic_name: "Fortis Memorial Research Institute",
      appointment_date: "2026-10-05T10:30:00Z",
      status: "upcoming",
      reason: "Quarterly Blood Pressure & ECG Review",
      address: "Sector 44, Gurugram, Haryana",
      latitude: 28.4595,
      longitude: 77.0725,
      notes: "Carry latest lipid profile and fasting glucose reports.",
    },
    {
      id: "app_02",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      doctor_name: "Dr. Meenakshi Sundaram",
      specialty: "Endocrinologist",
      hospital_clinic_name: "Max Super Speciality Hospital",
      appointment_date: "2026-10-18T16:00:00Z",
      status: "upcoming",
      reason: "HbA1c quarterly diabetes review",
      address: "B-Block, Sushant Lok 1, Gurugram",
      latitude: 28.4682,
      longitude: 77.0812,
    },
  ],
  documents: [
    {
      id: "doc_01",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      title: "Prescription - Hypertension & Diabetes",
      document_type: "prescription",
      file_url: "https://example.com/prescription_verma.pdf",
      document_date: "2026-09-15",
      status: "extracted",
      doctor_name: "Dr. Arun Verma",
      hospital_name: "Fortis Memorial",
      summary: "Prescribed Telmisartan 40mg once daily in morning. Blood pressure target < 130/80 mmHg. Review in 1 month.",
      extracted_tags: ["Prescription", "Cardiology", "Telmisartan", "Verified"],
      extracted_fields: { bp_target: "<130/80", next_visit: "2026-10-05" },
    },
    {
      id: "doc_02",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      title: "HbA1c & Lipid Panel Blood Test",
      document_type: "lab_report",
      file_url: "https://example.com/blood_test_sep2026.pdf",
      document_date: "2026-09-12",
      status: "extracted",
      doctor_name: "Dr. Lal PathLabs",
      hospital_name: "Diagnostic Center Sector 14",
      summary: "HbA1c: 6.8% (Good control for age 72). Fasting Glucose: 118 mg/dL. Total Cholesterol: 182 mg/dL. LDL: 95 mg/dL.",
      extracted_tags: ["Lab Report", "HbA1c", "Blood Sugar", "Lipid Profile"],
      extracted_fields: { hba1c: "6.8%", fasting_sugar: "118 mg/dL", ldl: "95 mg/dL" },
    },
    {
      id: "doc_03",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      title: "Chest X-Ray & ECG Report",
      document_type: "radiology",
      file_url: "https://example.com/ecg_aug2026.pdf",
      document_date: "2026-08-20",
      status: "extracted",
      doctor_name: "Dr. P.K. Gupta",
      hospital_name: "Fortis Memorial",
      summary: "Sinus rhythm at 72 bpm. Normal axis, no acute ischemic ST-T changes. Lungs clear.",
      extracted_tags: ["Radiology", "ECG", "Chest X-Ray", "Normal"],
    },
  ],
  timeline: [
    {
      id: "time_01",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      title: "Quarterly Consultation with Dr. Arun Verma",
      description: "Blood pressure recorded at 128/82 mmHg. Maintained Telmisartan 40mg. Advised 30 min morning walking.",
      event_type: "doctor_visit",
      event_date: "2026-09-15T11:00:00Z",
      doctor_name: "Dr. Arun Verma",
      facility_name: "Fortis Memorial",
      document_id: "doc_01",
    },
    {
      id: "time_02",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      title: "Quarterly Comprehensive Blood Work",
      description: "HbA1c stable at 6.8%. Fasting glucose 118 mg/dL. Kidney function (eGFR & Creatinine) normal.",
      event_type: "lab_test",
      event_date: "2026-09-12T08:30:00Z",
      facility_name: "Dr. Lal PathLabs",
      document_id: "doc_02",
    },
    {
      id: "time_03",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      title: "Medicine Adjustment: Glimepiride Refill",
      description: "Added 1mg Glimepiride before breakfast to control fasting morning spikes.",
      event_type: "medicine_started",
      event_date: "2026-03-10T09:00:00Z",
      doctor_name: "Dr. Meenakshi Sundaram",
    },
    {
      id: "time_04",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      title: "Cataract Surgery Follow-Up",
      description: "Right eye lens implant healing perfectly. 20/25 vision achieved.",
      event_type: "surgery",
      event_date: "2023-04-20T10:00:00Z",
      doctor_name: "Dr. Daljit Singh",
      facility_name: "Dr. Daljit Eye Clinic",
    },
  ],
  measurements: [
    {
      id: "vital_01",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      vital_type: "blood_pressure",
      value_numeric: 126,
      value_secondary: 80,
      unit: "mmHg",
      recorded_at: "Today, 08:15 AM",
      notes: "Resting, after morning walk",
    },
    {
      id: "vital_02",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      vital_type: "blood_sugar",
      value_numeric: 114,
      unit: "mg/dL",
      recorded_at: "Today, 07:30 AM",
      notes: "Fasting",
    },
    {
      id: "vital_03",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      vital_type: "heart_rate",
      value_numeric: 74,
      unit: "bpm",
      recorded_at: "Today, 08:15 AM",
    },
    {
      id: "vital_04",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      vital_type: "oxygen_saturation",
      value_numeric: 98,
      unit: "%",
      recorded_at: "Yesterday, 08:00 PM",
    },
  ],
  visits: [
    {
      id: "vis_01",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      place_name: "Fortis Memorial Research Institute",
      category: "hospital",
      address: "Sector 44, Gurugram",
      latitude: 28.4595,
      longitude: 77.0725,
      visited_at: "2026-09-15 10:45 AM",
      notes: "Consultation with Dr. Arun Verma",
    },
    {
      id: "vis_02",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      place_name: "Apollo Pharmacy 24/7",
      category: "pharmacy",
      address: "Sector 14 Market, Gurugram",
      latitude: 28.4731,
      longitude: 77.0435,
      visited_at: "2026-09-15 12:30 PM",
      notes: "Purchased monthly Telmisartan & Metformin",
    },
  ],
  tasks: [
    {
      id: "task_01",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      family_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      title: "Order Glimepiride & Metformin refills",
      description: "Inventory low (4 days left). Pick up from Apollo Pharmacy Sector 14.",
      priority: "urgent",
      status: "pending",
      due_date: "Today, 5:00 PM",
      assigned_to_name: "Manoj Kumar (Caregiver)",
      created_at: "2026-09-27T08:00:00Z",
    },
    {
      id: "task_02",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      family_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      title: "Confirm Dr. Arun Verma cardiology follow-up",
      description: "Consultation scheduled for Oct 5. Ensure recent ECG & Lipid panel are printed.",
      priority: "high",
      status: "pending",
      due_date: "Oct 3, 2026",
      assigned_to_name: "Priya Sharma (Daughter)",
      created_at: "2026-09-26T10:00:00Z",
    },
    {
      id: "task_03",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      family_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      title: "Morning Fasting Glucose check",
      description: "Record reading in ParentPulse before breakfast.",
      priority: "medium",
      status: "completed",
      due_date: "Today, 8:00 AM",
      assigned_to_name: "Ramesh Sharma (Father)",
      created_at: "2026-09-27T07:30:00Z",
    },
    {
      id: "task_04",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      family_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      title: "Renew Star Health senior citizen policy",
      description: "Review policy coverage and submit renewal before March 2027.",
      priority: "low",
      status: "pending",
      due_date: "Mar 15, 2027",
      assigned_to_name: "Rajesh Sharma (Son)",
      created_at: "2026-09-20T12:00:00Z",
    },
  ],
  expenses: [
    {
      id: "exp_01",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      family_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      title: "Dr. Arun Verma Consultation Fee",
      category: "doctor",
      amount: 1500,
      currency: "INR",
      expense_date: "2026-09-15",
      provider_name: "Fortis Memorial Research Institute",
      notes: "Quarterly review of blood pressure and Telmisartan dosage",
      is_reimbursed: true,
      created_at: "2026-09-15T11:30:00Z",
    },
    {
      id: "exp_02",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      family_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      title: "Monthly Prescription Medicines",
      category: "medicine",
      amount: 3450,
      currency: "INR",
      expense_date: "2026-09-15",
      provider_name: "Apollo Pharmacy Sector 14",
      notes: "Telmisartan 40mg (60 tabs) & Metformin SR 500mg (60 tabs)",
      is_reimbursed: false,
      created_at: "2026-09-15T12:45:00Z",
    },
    {
      id: "exp_03",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      family_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      title: "Comprehensive Lipid Profile & HbA1c",
      category: "lab",
      amount: 2200,
      currency: "INR",
      expense_date: "2026-09-12",
      provider_name: "Dr. Lal PathLabs",
      notes: "Home blood sample collection",
      is_reimbursed: true,
      created_at: "2026-09-12T09:00:00Z",
    },
  ],
  insurance: [
    {
      id: "ins_01",
      parent_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      family_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      provider: "Star Health Senior Citizens Red Carpet",
      policy_number: "SH-SENIOR-98214-GUR",
      plan_name: "Comprehensive Senior Health Guard",
      coverage_amount: 1500000,
      currency: "INR",
      expiry_date: "2027-03-31",
      tpa_cashless_helpline: "1800-425-2255",
      notes: "Cashless pre-authorization available at Fortis and Max Hospitals",
      created_at: "2026-01-01T10:00:00Z",
    },
  ],
};

const INITIAL_MOTHER_DATA: MockParentData = {
  profile: {
    id: "33333333-3333-3333-3333-333333333333",
    family_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    full_name: "Sunita Sharma",
    date_of_birth: "1958-11-22",
    gender: "female",
    blood_group: "O+",
    preferred_language: "hi",
    address: "Flat 402, Shanti Niketan Apartments, Sector 14, Gurugram, Haryana",
    latitude: 28.4721,
    longitude: 77.0428,
    phone_number: "+91 98123 45679",
    allergies: ["Aspirin"],
    chronic_conditions: ["Hypothyroidism", "Osteopenia"],
    disabilities: [],
    surgeries: [],
    emergency_contacts: [
      { name: "Priya Sharma", relationship: "Daughter", phone_number: "+91 98765 43210", is_primary: true },
      { name: "Ramesh Sharma", relationship: "Husband", phone_number: "+91 98123 45678", is_primary: false },
    ],
    primary_doctors: [
      {
        name: "Dr. Ananya Ray",
        specialty: "Endocrinologist",
        hospital_or_clinic: "Artemis Hospital",
        phone_number: "+91 98445 56677",
      },
    ],
  },
  medicines: [
    {
      id: "med_m_01",
      parent_id: "33333333-3333-3333-3333-333333333333",
      name: "Thyronorm",
      dosage: "50mcg",
      form: "tablet",
      frequency_times_per_day: 1,
      schedule_times: ["06:30 AM"],
      instructions: "empty_stomach",
      prescribing_doctor: "Dr. Ananya Ray",
      reason: "Thyroid hormone supplement",
      start_date: "2022-05-10",
      current_inventory: 45,
      refill_alert_threshold: 10,
      is_active: true,
    },
    {
      id: "med_m_02",
      parent_id: "33333333-3333-3333-3333-333333333333",
      name: "Shelcal 500",
      dosage: "500mg",
      form: "tablet",
      frequency_times_per_day: 1,
      schedule_times: ["01:30 PM"],
      instructions: "after_food",
      prescribing_doctor: "Dr. Ananya Ray",
      reason: "Calcium & Vitamin D3 for bone density",
      start_date: "2023-01-15",
      current_inventory: 20,
      refill_alert_threshold: 7,
      is_active: true,
    },
  ],
  appointments: [
    {
      id: "app_m_01",
      parent_id: "33333333-3333-3333-3333-333333333333",
      doctor_name: "Dr. Ananya Ray",
      specialty: "Endocrinologist",
      hospital_clinic_name: "Artemis Hospital",
      appointment_date: "2026-10-22T11:00:00Z",
      status: "upcoming",
      reason: "Thyroid profile & DEXA scan review",
      address: "Sector 51, Gurugram",
    },
  ],
  documents: [
    {
      id: "doc_m_01",
      parent_id: "33333333-3333-3333-3333-333333333333",
      title: "Thyroid Profile (T3, T4, TSH)",
      document_type: "lab_report",
      file_url: "https://example.com/thyroid_aug2026.pdf",
      document_date: "2026-08-15",
      status: "extracted",
      doctor_name: "Dr. Lal PathLabs",
      hospital_name: "Sector 14 Lab",
      summary: "TSH: 2.4 uIU/mL (Optimal range 0.4 - 4.0). Free T4 normal. Continue Thyronorm 50mcg daily.",
      extracted_tags: ["Thyroid", "TSH Normal", "Endocrinology"],
    },
  ],
  timeline: [
    {
      id: "time_m_01",
      parent_id: "33333333-3333-3333-3333-333333333333",
      title: "Thyroid Follow-Up with Dr. Ananya Ray",
      description: "TSH test normal at 2.4. Continue current 50mcg dosage.",
      event_type: "doctor_visit",
      event_date: "2026-08-18T11:30:00Z",
      doctor_name: "Dr. Ananya Ray",
      facility_name: "Artemis Hospital",
    },
  ],
  measurements: [
    {
      id: "vital_m_01",
      parent_id: "33333333-3333-3333-3333-333333333333",
      vital_type: "blood_pressure",
      value_numeric: 118,
      value_secondary: 76,
      unit: "mmHg",
      recorded_at: "Today, 09:00 AM",
    },
  ],
  visits: [
    {
      id: "vis_m_01",
      parent_id: "33333333-3333-3333-3333-333333333333",
      place_name: "Artemis Hospital",
      category: "hospital",
      address: "Sector 51, Gurugram",
      latitude: 28.4328,
      longitude: 77.0697,
      visited_at: "2026-08-18 11:15 AM",
      notes: "Thyroid consultation",
    },
  ],
  tasks: [
    {
      id: "task_m_01",
      parent_id: "33333333-3333-3333-3333-333333333333",
      family_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      title: "Collect Thyronorm 50mcg bottle",
      description: "Pick up 3-month pack from pharmacy",
      priority: "medium",
      status: "completed",
      due_date: "Yesterday",
      assigned_to_name: "Priya Sharma",
      created_at: "2026-09-25T10:00:00Z",
    },
    {
      id: "task_m_02",
      parent_id: "33333333-3333-3333-3333-333333333333",
      family_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      title: "Schedule DEXA Bone Density Scan",
      description: "Advised by Dr. Ananya Ray for osteopenia monitoring",
      priority: "high",
      status: "pending",
      due_date: "Oct 15, 2026",
      assigned_to_name: "Rajesh Sharma",
      created_at: "2026-09-26T14:00:00Z",
    },
  ],
  expenses: [
    {
      id: "exp_m_01",
      parent_id: "33333333-3333-3333-3333-333333333333",
      family_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      title: "Thyroid Consultation & Lab Work",
      category: "doctor",
      amount: 1800,
      currency: "INR",
      expense_date: "2026-08-18",
      provider_name: "Artemis Hospital",
      notes: "Dr. Ananya Ray follow up + TSH report",
      is_reimbursed: true,
      created_at: "2026-08-18T12:00:00Z",
    },
  ],
  insurance: [
    {
      id: "ins_m_01",
      parent_id: "33333333-3333-3333-3333-333333333333",
      family_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      provider: "Star Health Senior Citizens Red Carpet",
      policy_number: "SH-SENIOR-98215-GUR",
      plan_name: "Comprehensive Senior Health Guard",
      coverage_amount: 1500000,
      currency: "INR",
      expiry_date: "2027-03-31",
      tpa_cashless_helpline: "1800-425-2255",
      notes: "Covers pre-existing thyroid & osteopenia after 12 months",
      created_at: "2026-01-01T10:00:00Z",
    },
  ],
};

const INITIAL_FAMILY_MEMBERS: FamilyMemberItem[] = [
  {
    id: "mem_01",
    family_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    user_id: "11111111-1111-1111-1111-111111111111",
    name: "Priya Sharma",
    relationship: "Daughter (Primary Remote Caregiver)",
    role: "family_member",
    email: "priya.sharma@example.com",
    phone: "+91 98765 43210",
    avatar_initials: "PS",
    can_manage_medicines: true,
    can_manage_appointments: true,
    can_upload_documents: true,
    can_share_doctor_brief: true,
    can_view_location_history: true,
  },
  {
    id: "mem_02",
    family_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    user_id: "22222222-2222-2222-2222-222222222222",
    name: "Rajesh Sharma",
    relationship: "Son (Remote - Toronto, Canada)",
    role: "family_member",
    email: "rajesh.sharma@example.com",
    phone: "+1 416 555 0192",
    avatar_initials: "RS",
    can_manage_medicines: true,
    can_manage_appointments: true,
    can_upload_documents: true,
    can_share_doctor_brief: true,
    can_view_location_history: true,
  },
  {
    id: "mem_03",
    family_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    user_id: "33333333-3333-3333-3333-333333333333",
    name: "Sunita Sharma",
    relationship: "Wife / Resident Caregiver",
    role: "parent",
    email: "sunita.sharma@example.com",
    phone: "+91 98123 45679",
    avatar_initials: "SS",
    can_manage_medicines: true,
    can_manage_appointments: true,
    can_upload_documents: true,
    can_share_doctor_brief: true,
    can_view_location_history: true,
  },
  {
    id: "mem_04",
    family_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    user_id: "44444444-4444-4444-4444-444444444444",
    name: "Manoj Kumar",
    relationship: "Local Family Caregiver (Sector 14)",
    role: "caregiver",
    email: "manoj.care@example.com",
    phone: "+91 98111 22334",
    avatar_initials: "MK",
    can_manage_medicines: true,
    can_manage_appointments: true,
    can_upload_documents: false,
    can_share_doctor_brief: false,
    can_view_location_history: true,
  },
  {
    id: "mem_05",
    family_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    user_id: "55555555-5555-5555-5555-555555555555",
    name: "Dr. Arun Verma",
    relationship: "Consulting Cardiologist (Fortis)",
    role: "doctor",
    email: "dr.arun.verma@fortiscare.com",
    phone: "+91 98223 34455",
    avatar_initials: "AV",
    can_manage_medicines: false,
    can_manage_appointments: false,
    can_upload_documents: true,
    can_share_doctor_brief: true,
    can_view_location_history: false,
  },
];

const INITIAL_CURRENT_USER: UserProfile = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "priya.sharma@example.com",
  full_name: "Priya Sharma",
  role: "family_member",
  phone_number: "+91 98765 43210",
  preferred_language: "en",
};

interface AppContextType {
  activeParent: ParentProfile;
  parentList: ParentProfile[];
  setActiveParentId: (id: string) => void;
  updateActiveParentProfile: (updated: Partial<ParentProfile>) => void;

  seniorMode: boolean;
  toggleSeniorMode: () => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;

  // Active Screen Routing ("tabs", "family", "profile", "expenses", "settings", "report", "onboarding")
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;

  // Onboarding & Family Initialization
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (v: boolean) => void;
  registerNewParentAndFamily: (familyName: string, parentData: any) => Promise<ParentProfile>;

  // Medicines & Doses
  medicines: MedicineSchedule[];
  dosesTakenToday: Record<string, boolean>;
  markDoseTaken: (medicineId: string) => void;
  addMedicine: (med: MedicineSchedule) => void;
  deleteMedicine: (medId: string) => void;

  // Appointments, Documents, Timeline, Vitals, Visits
  appointments: Appointment[];
  addAppointment: (app: Appointment) => void;
  deleteAppointment: (appId: string) => void;
  documents: MedicalDocument[];
  addDocument: (doc: MedicalDocument) => void;
  deleteDocument: (docId: string) => void;
  timeline: TimelineEvent[];
  measurements: HealthMeasurement[];
  visits: LocationVisit[];

  // Care Tasks
  tasks: CareTask[];
  addTask: (task: CareTask) => void;
  toggleTaskCompleted: (taskId: string) => void;
  deleteTask: (taskId: string) => void;

  // Expenses & Insurance
  expenses: HealthcareExpense[];
  addExpense: (expense: HealthcareExpense) => void;
  insurance: InsurancePolicy[];
  addInsurance: (policy: InsurancePolicy) => void;

  // Family Coordination & Caregivers
  familyMembers: FamilyMemberItem[];
  inviteFamilyMember: (member: FamilyMemberItem) => void;
  updateFamilyMemberPermissions: (memberId: string, perms: Partial<FamilyMemberItem>) => void;

  // User Profile & Authentication
  currentUser: UserProfile;
  setCurrentUserRole: (role: UserRole) => void;

  // Real-time Device Location & Geolocation
  userLocation: { latitude: number; longitude: number } | null;
  refreshLocation: () => Promise<void>;

  logNewMeasurement: (vitalType: any, val: number, valSec?: number, notes?: string) => void;
  recordNewVisit: (placeName: string, category: any, address: string) => void;

  // Modals
  sosModalVisible: boolean;
  setSosModalVisible: (v: boolean) => void;
  doctorShareModalVisible: boolean;
  setDoctorShareModalVisible: (v: boolean) => void;
  aiAssistantModalVisible: boolean;
  setAiAssistantModalVisible: (v: boolean) => void;
  logVitalModalVisible: boolean;
  setLogVitalModalVisible: (v: boolean) => void;
  scannerModalVisible: boolean;
  setScannerModalVisible: (v: boolean) => void;
  scannerMode: "document" | "qr";
  setScannerMode: (m: "document" | "qr") => void;
  authModalVisible: boolean;
  setAuthModalVisible: (v: boolean) => void;
  reportModalVisible: boolean;
  setReportModalVisible: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeParentId, setActiveParentId] = useState<string>(INITIAL_FATHER_DATA.profile.id);
  const [seniorMode, setSeniorMode] = useState<boolean>(false);
  const [language, setLanguage] = useState<SupportedLanguage>("en");
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>("tabs");
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(true);

  // Per-parent data cache
  const [dataStore, setDataStore] = useState<Record<string, MockParentData>>({
    [INITIAL_FATHER_DATA.profile.id]: INITIAL_FATHER_DATA,
    [INITIAL_MOTHER_DATA.profile.id]: INITIAL_MOTHER_DATA,
  });

  const [familyMembers, setFamilyMembers] = useState<FamilyMemberItem[]>(INITIAL_FAMILY_MEMBERS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_CURRENT_USER);

  const [dosesTakenToday, setDosesTakenToday] = useState<Record<string, boolean>>({
    "dddddddd-dddd-dddd-dddd-dddddddddd01": true, // Telmisartan taken this morning
  });

  // Real GPS Device Location
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>({
    latitude: 28.4595,
    longitude: 77.0725,
  });

  // Modals state
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [doctorShareModalVisible, setDoctorShareModalVisible] = useState(false);
  const [aiAssistantModalVisible, setAiAssistantModalVisible] = useState(false);
  const [logVitalModalVisible, setLogVitalModalVisible] = useState(false);
  const [scannerModalVisible, setScannerModalVisible] = useState(false);
  const [scannerMode, setScannerMode] = useState<"document" | "qr">("document");
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const currentData = dataStore[activeParentId] || INITIAL_FATHER_DATA;

  const refreshLocation = async () => {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) return;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const cachedLocation = await Location.getLastKnownPositionAsync({
        maxAge: 5 * 60 * 1000,
        requiredAccuracy: 1000,
      });
      if (cachedLocation) {
        setUserLocation({
          latitude: cachedLocation.coords.latitude,
          longitude: cachedLocation.coords.longitude,
        });
      }

      try {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      } catch {
        // Keep the cached or parent-profile location when a live GPS fix is unavailable.
      }
    } catch {
      // Location is optional; map screens already fall back to the parent profile coordinates.
    }
  };

  // Background fetch to hydrate from live backend API if server is running
  useEffect(() => {
    let isMounted = true;
    refreshLocation();

    async function hydrateRemoteData() {
      try {
        const [remoteMeds, remoteVitals, remoteTasks, remoteExpenses] = await Promise.allSettled([
          apiClient.listMedicines(activeParentId),
          apiClient.listMeasurements(activeParentId),
          apiClient.listTasks(activeParentId),
          apiClient.listExpenses(activeParentId),
        ]);

        if (!isMounted) return;

        setDataStore((prev) => {
          const current = prev[activeParentId];
          if (!current) return prev;
          const updated = { ...current };

          if (remoteMeds.status === "fulfilled" && Array.isArray(remoteMeds.value) && remoteMeds.value.length > 0) {
            updated.medicines = remoteMeds.value;
          }
          if (remoteVitals.status === "fulfilled" && Array.isArray(remoteVitals.value) && remoteVitals.value.length > 0) {
            updated.measurements = remoteVitals.value;
          }
          if (remoteTasks.status === "fulfilled" && Array.isArray(remoteTasks.value) && remoteTasks.value.length > 0) {
            updated.tasks = remoteTasks.value;
          }
          if (remoteExpenses.status === "fulfilled" && Array.isArray(remoteExpenses.value) && remoteExpenses.value.length > 0) {
            updated.expenses = remoteExpenses.value;
          }
          return {
            ...prev,
            [activeParentId]: updated,
          };
        });
      } catch (err) {
        // Gracefully keep initial seeded demo state if offline
        console.log("Using cached offline state:", err);
      }
    }

    hydrateRemoteData();
    return () => {
      isMounted = false;
    };
  }, [activeParentId]);

  const toggleSeniorMode = () => setSeniorMode((prev) => !prev);

  const updateActiveParentProfile = (updated: Partial<ParentProfile>) => {
    setDataStore((prev) => {
      const current = prev[activeParentId];
      if (!current) return prev;
      return {
        ...prev,
        [activeParentId]: {
          ...current,
          profile: {
            ...current.profile,
            ...updated,
          },
        },
      };
    });

    apiClient.updateParentProfile(activeParentId, updated).catch((err) => {
      console.warn("Could not sync parent profile update to server:", err);
    });
  };

  const markDoseTaken = (medicineId: string) => {
    setDosesTakenToday((prev) => {
      const willBeTaken = !prev[medicineId];
      apiClient.recordDose(medicineId, willBeTaken ? "taken" : "missed").catch((err) => {
        console.warn("Could not sync dose record to server:", err);
      });
      return {
        ...prev,
        [medicineId]: willBeTaken,
      };
    });
  };

  const addDocument = (doc: MedicalDocument) => {
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        documents: [doc, ...prev[activeParentId].documents],
      },
    }));
  };

  const deleteDocument = (docId: string) => {
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        documents: prev[activeParentId].documents.filter((d) => d.id !== docId),
      },
    }));
  };

  const addAppointment = (app: Appointment) => {
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        appointments: [app, ...prev[activeParentId].appointments],
      },
    }));
  };

  const deleteAppointment = (appId: string) => {
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        appointments: prev[activeParentId].appointments.filter((a) => a.id !== appId),
      },
    }));
  };

  const addMedicine = (med: MedicineSchedule) => {
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        medicines: [med, ...prev[activeParentId].medicines],
      },
    }));
  };

  const deleteMedicine = (medId: string) => {
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        medicines: prev[activeParentId].medicines.filter((m) => m.id !== medId),
      },
    }));
  };

  // Care Tasks Management
  const addTask = (task: CareTask) => {
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        tasks: [task, ...prev[activeParentId].tasks],
      },
    }));

    apiClient.createTask(task).catch((err) => {
      console.warn("Could not sync task to server:", err);
    });
  };

  const toggleTaskCompleted = (taskId: string) => {
    setDataStore((prev) => {
      const currentTasks = prev[activeParentId].tasks;
      const updatedTasks = currentTasks.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === "completed" ? "pending" : "completed";
          apiClient.updateTask(taskId, { status: nextStatus }).catch((err) => {
            console.warn("Could not sync task status to server:", err);
          });
          return { ...t, status: nextStatus as any };
        }
        return t;
      });
      return {
        ...prev,
        [activeParentId]: {
          ...prev[activeParentId],
          tasks: updatedTasks,
        },
      };
    });
  };

  const deleteTask = (taskId: string) => {
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        tasks: prev[activeParentId].tasks.filter((t) => t.id !== taskId),
      },
    }));

    apiClient.deleteTask(taskId).catch((err) => {
      console.warn("Could not delete task on server:", err);
    });
  };

  // Expenses & Insurance Management
  const addExpense = (expense: HealthcareExpense) => {
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        expenses: [expense, ...prev[activeParentId].expenses],
      },
    }));

    apiClient.createExpense(expense).catch((err) => {
      console.warn("Could not sync expense to server:", err);
    });
  };

  const addInsurance = (policy: InsurancePolicy) => {
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        insurance: [policy, ...prev[activeParentId].insurance],
      },
    }));

    apiClient.createInsurance(policy).catch((err) => {
      console.warn("Could not sync insurance to server:", err);
    });
  };

  // Family Members & Caregiver Management
  const inviteFamilyMember = (member: FamilyMemberItem) => {
    setFamilyMembers((prev) => [member, ...prev]);
  };

  const updateFamilyMemberPermissions = (memberId: string, perms: Partial<FamilyMemberItem>) => {
    setFamilyMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, ...perms } : m))
    );
  };

  const setCurrentUserRole = (role: UserRole) => {
    setCurrentUser((prev) => ({ ...prev, role }));
  };

  const logNewMeasurement = (vitalType: any, val: number, valSec?: number, notes?: string) => {
    const newMeasurement: HealthMeasurement = {
      id: `vital_${Date.now()}`,
      parent_id: activeParentId,
      vital_type: vitalType,
      value_numeric: val,
      value_secondary: valSec,
      unit: vitalType === "blood_pressure" ? "mmHg" : vitalType === "blood_sugar" ? "mg/dL" : "bpm",
      recorded_at: "Just now",
      notes,
    };
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        measurements: [newMeasurement, ...prev[activeParentId].measurements],
      },
    }));

    apiClient
      .logMeasurement({
        parent_id: activeParentId,
        vital_type: vitalType,
        value_numeric: val,
        value_secondary: valSec,
        unit: newMeasurement.unit,
        notes,
      })
      .catch((err) => {
        console.warn("Could not sync measurement to server:", err);
      });
  };

  const recordNewVisit = (placeName: string, category: any, address: string) => {
    const newVisit: LocationVisit = {
      id: `vis_${Date.now()}`,
      parent_id: activeParentId,
      place_name: placeName,
      category,
      address,
      latitude: userLocation?.latitude || 28.4595,
      longitude: userLocation?.longitude || 77.0725,
      visited_at: "Today, confirmed",
      notes: "Checked in via ParentPulse",
    };
    setDataStore((prev) => ({
      ...prev,
      [activeParentId]: {
        ...prev[activeParentId],
        visits: [newVisit, ...prev[activeParentId].visits],
      },
    }));

    apiClient
      .recordLocationVisit(activeParentId, {
        place_name: placeName,
        category,
        address,
        latitude: userLocation?.latitude || 28.4595,
        longitude: userLocation?.longitude || 77.0725,
        notes: "Checked in via ParentPulse",
      })
      .catch((err) => {
        console.warn("Could not sync location visit to server:", err);
      });
  };

  const registerNewParentAndFamily = async (
    familyName: string,
    parentData: any
  ): Promise<ParentProfile> => {
    let createdFamilyId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    let newProfile: ParentProfile;

    try {
      // 1. Call Backend API to create Family
      const familyRes = await apiClient.createFamily(familyName);
      if (familyRes && familyRes.id) {
        createdFamilyId = familyRes.id;
      }
    } catch (e) {
      console.warn("Backend family creation fallback:", e);
    }

    try {
      // 2. Call Backend API to create Parent Profile
      const parentPayload = {
        ...parentData,
        family_id: createdFamilyId,
      };
      const parentRes = await apiClient.createParentProfile(parentPayload);
      if (parentRes && parentRes.id) {
        newProfile = parentRes;
      } else {
        throw new Error("No parent returned from API");
      }
    } catch (e) {
      console.warn("Backend parent profile creation fallback:", e);
      newProfile = {
        id: `parent_${Date.now()}`,
        family_id: createdFamilyId,
        full_name: parentData.full_name,
        date_of_birth: parentData.date_of_birth,
        gender: parentData.gender,
        blood_group: parentData.blood_group,
        preferred_language: parentData.preferred_language || "en",
        address: parentData.address,
        phone_number: parentData.phone_number,
        allergies: parentData.allergies || [],
        chronic_conditions: parentData.chronic_conditions || [],
        disabilities: parentData.disabilities || [],
        surgeries: parentData.surgeries || [],
        emergency_contacts: parentData.emergency_contacts || [],
        primary_doctors: parentData.primary_doctors || [],
        notes: parentData.notes,
      };
    }

    const newEntry: MockParentData = {
      profile: newProfile,
      medicines: [
        {
          id: `med_${Date.now()}_1`,
          parent_id: newProfile.id,
          name: "Daily Multivitamin & Omega-3",
          dosage: "1 capsule",
          form: "capsule",
          frequency_times_per_day: 1,
          schedule_times: ["09:00 AM"],
          instructions: "after_food",
          prescribing_doctor: parentData.primary_doctors?.[0]?.name || "Family Physician",
          reason: "Daily wellness & vitality",
          start_date: new Date().toISOString().split("T")[0],
          current_inventory: 30,
          refill_alert_threshold: 7,
          is_active: true,
        },
      ],
      appointments: [],
      documents: [],
      timeline: [
        {
          id: `time_${Date.now()}`,
          parent_id: newProfile.id,
          title: "Care Circle Initialized",
          description: `Family care coordinated for ${newProfile.full_name} (${familyName})`,
          event_type: "diagnosis",
          event_date: new Date().toISOString(),
        },
      ],
      measurements: [
        {
          id: `meas_${Date.now()}`,
          parent_id: newProfile.id,
          vital_type: "blood_pressure",
          value_numeric: 120,
          value_secondary: 80,
          unit: "mmHg",
          recorded_at: "Just now",
        },
        {
          id: `meas_${Date.now() + 1}`,
          parent_id: newProfile.id,
          vital_type: "blood_sugar",
          value_numeric: 105,
          unit: "mg/dL",
          recorded_at: "Fasting",
        },
      ],
      visits: [],
      tasks: [
        {
          id: `task_${Date.now()}`,
          parent_id: newProfile.id,
          family_id: newProfile.family_id,
          title: "Upload initial doctor prescription or test reports",
          description: "Use camera scanner to digitize recent records",
          priority: "high",
          status: "pending",
          due_date: "Tomorrow",
          assigned_to_name: currentUser.full_name,
          created_at: new Date().toISOString(),
        },
      ],
      expenses: [],
      insurance: [],
    };

    setDataStore((prev) => ({
      ...prev,
      [newProfile.id]: newEntry,
    }));

    setActiveParentId(newProfile.id);
    setHasCompletedOnboarding(true);
    setActiveScreen("tabs");

    return newProfile;
  };

  return (
    <AppContext.Provider
      value={{
        activeParent: currentData.profile,
        parentList: Object.values(dataStore).map((d) => d.profile),
        setActiveParentId,
        updateActiveParentProfile,
        seniorMode,
        toggleSeniorMode,
        language,
        setLanguage,
        activeScreen,
        setActiveScreen,
        hasCompletedOnboarding,
        setHasCompletedOnboarding,
        registerNewParentAndFamily,
        userLocation,
        refreshLocation,
        medicines: currentData.medicines,
        dosesTakenToday,
        markDoseTaken,
        addMedicine,
        deleteMedicine,
        appointments: currentData.appointments,
        addAppointment,
        deleteAppointment,
        documents: currentData.documents,
        addDocument,
        deleteDocument,
        timeline: currentData.timeline,
        measurements: currentData.measurements,
        visits: currentData.visits,
        tasks: currentData.tasks,
        addTask,
        toggleTaskCompleted,
        deleteTask,
        expenses: currentData.expenses,
        addExpense,
        insurance: currentData.insurance,
        addInsurance,
        familyMembers,
        inviteFamilyMember,
        updateFamilyMemberPermissions,
        currentUser,
        setCurrentUserRole,
        logNewMeasurement,
        recordNewVisit,
        sosModalVisible,
        setSosModalVisible,
        doctorShareModalVisible,
        setDoctorShareModalVisible,
        aiAssistantModalVisible,
        setAiAssistantModalVisible,
        logVitalModalVisible,
        setLogVitalModalVisible,
        scannerModalVisible,
        setScannerModalVisible,
        scannerMode,
        setScannerMode,
        authModalVisible,
        setAuthModalVisible,
        reportModalVisible,
        setReportModalVisible,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

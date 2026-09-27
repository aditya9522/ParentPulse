# backend/app/core/constants.py
from enum import Enum


class UserRole(str, Enum):
    PARENT = "parent"
    FAMILY_MEMBER = "family_member"
    CAREGIVER = "caregiver"
    DOCTOR = "doctor"
    ADMIN = "admin"


class DocumentType(str, Enum):
    PRESCRIPTION = "prescription"
    LAB_REPORT = "lab_report"
    RADIOLOGY = "radiology"
    DISCHARGE_SUMMARY = "discharge_summary"
    VACCINATION = "vaccination"
    INSURANCE = "insurance"
    HOSPITAL_BILL = "hospital_bill"
    OTHER = "other"


class DocumentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    EXTRACTED = "extracted"
    FAILED = "failed"


class TimelineEventType(str, Enum):
    DOCTOR_VISIT = "doctor_visit"
    DIAGNOSIS = "diagnosis"
    MEDICINE_STARTED = "medicine_started"
    MEDICINE_CHANGED = "medicine_changed"
    MEDICINE_STOPPED = "medicine_stopped"
    LAB_TEST = "lab_test"
    SURGERY = "surgery"
    HOSPITALIZATION = "hospitalization"
    VACCINATION = "vaccination"
    FOLLOW_UP = "follow_up"


class DoseStatus(str, Enum):
    SCHEDULED = "scheduled"
    TAKEN = "taken"
    MISSED = "missed"
    SKIPPED = "skipped"


class AppointmentStatus(str, Enum):
    UPCOMING = "upcoming"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"


class VitalType(str, Enum):
    BLOOD_PRESSURE = "blood_pressure"
    BLOOD_SUGAR = "blood_sugar"
    HEART_RATE = "heart_rate"
    WEIGHT = "weight"
    TEMPERATURE = "temperature"
    OXYGEN_SATURATION = "oxygen_saturation"


class PlaceCategory(str, Enum):
    DOCTOR = "doctor"
    CLINIC = "clinic"
    HOSPITAL = "hospital"
    PHARMACY = "pharmacy"
    LABORATORY = "laboratory"
    EMERGENCY = "emergency"


class ShareScope(str, Enum):
    SUMMARY_ONLY = "summary_only"
    RECENT_DOCUMENTS = "recent_documents"
    FULL_HISTORY = "full_history"
    SPECIFIC_DOCUMENTS = "specific_documents"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# Cache Key Namespaces
REDIS_KEY_MAPS_NEARBY = "maps:nearby:{geohash}:{category}:{radius}:{page}"
REDIS_KEY_MAPS_PLACE = "maps:place:{place_id}"
REDIS_KEY_MAPS_ROUTE = "maps:route:{origin_hash}:{destination_place_id}:{mode}"
REDIS_KEY_RATE_LIMIT = "rate_limit:{user_id}:{route}:{window}"
REDIS_KEY_IDEMPOTENCY = "idempotency:{user_id}:{request_key}"
REDIS_KEY_JOB_STATUS = "job:{job_id}:status"

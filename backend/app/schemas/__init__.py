# backend/app/schemas/__init__.py
from app.schemas.common import ApiResponse, ApiErrorResponse, PaginationMeta, ResponseMeta
from app.schemas.auth import EmailPasswordLoginRequest, GoogleLoginRequest, AuthTokenResponse
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.family import FamilyCreate, FamilyUpdate, FamilyResponse, FamilyMemberInvite, FamilyMemberResponse
from app.schemas.parent import ParentProfileCreate, ParentProfileUpdate, ParentProfileResponse
from app.schemas.caregiver import CaregiverCreate, CaregiverResponse
from app.schemas.doctor import DoctorCreate, DoctorResponse
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentResponse
from app.schemas.medicine import MedicineCreate, MedicineUpdate, MedicineResponse, DoseRecordRequest, DoseLogResponse
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.schemas.measurement import MeasurementCreate, MeasurementResponse
from app.schemas.timeline import TimelineEventCreate, TimelineEventUpdate, TimelineEventResponse
from app.schemas.map import NearbyPlacesQuery, PlaceSummary, DistanceCalculationRequest, DistanceCalculationResponse, GeocodeRequest, GeocodeResponse
from app.schemas.location import LocationVisitCreate, LocationVisitUpdate, LocationVisitResponse
from app.schemas.sharing import DoctorShareCreate, DoctorShareResponse, DoctorBriefResponse
from app.schemas.search import UniversalSearchQuery, UniversalSearchResponse, SearchResultItem
from app.schemas.ai import AIChatRequest, AIChatResponse, AISourceCitation, DocumentExtractionResult

__all__ = [
    "ApiResponse",
    "ApiErrorResponse",
    "PaginationMeta",
    "ResponseMeta",
    "EmailPasswordLoginRequest",
    "GoogleLoginRequest",
    "AuthTokenResponse",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "FamilyCreate",
    "FamilyUpdate",
    "FamilyResponse",
    "FamilyMemberInvite",
    "FamilyMemberResponse",
    "ParentProfileCreate",
    "ParentProfileUpdate",
    "ParentProfileResponse",
    "CaregiverCreate",
    "CaregiverResponse",
    "DoctorCreate",
    "DoctorResponse",
    "DocumentCreate",
    "DocumentUpdate",
    "DocumentResponse",
    "MedicineCreate",
    "MedicineUpdate",
    "MedicineResponse",
    "DoseRecordRequest",
    "DoseLogResponse",
    "AppointmentCreate",
    "AppointmentUpdate",
    "AppointmentResponse",
    "MeasurementCreate",
    "MeasurementResponse",
    "TimelineEventCreate",
    "TimelineEventUpdate",
    "TimelineEventResponse",
    "NearbyPlacesQuery",
    "PlaceSummary",
    "DistanceCalculationRequest",
    "DistanceCalculationResponse",
    "GeocodeRequest",
    "GeocodeResponse",
    "LocationVisitCreate",
    "LocationVisitUpdate",
    "LocationVisitResponse",
    "DoctorShareCreate",
    "DoctorShareResponse",
    "DoctorBriefResponse",
    "UniversalSearchQuery",
    "UniversalSearchResponse",
    "SearchResultItem",
    "AIChatRequest",
    "AIChatResponse",
    "AISourceCitation",
    "DocumentExtractionResult",
]

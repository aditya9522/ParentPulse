# backend/app/schemas/document.py
import uuid
from datetime import date, datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict
from app.core.constants import DocumentType, DocumentStatus


class DocumentCreate(BaseModel):
    parent_id: uuid.UUID
    family_id: uuid.UUID
    title: str
    document_type: DocumentType
    file_url: str
    storage_path: str
    file_size_bytes: int
    mime_type: str
    document_date: date
    doctor_name: Optional[str] = None
    hospital_name: Optional[str] = None


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    document_type: Optional[DocumentType] = None
    document_date: Optional[date] = None
    doctor_name: Optional[str] = None
    hospital_name: Optional[str] = None
    is_archived: Optional[bool] = None


class DocumentResponse(BaseModel):
    id: uuid.UUID
    parent_id: uuid.UUID
    family_id: uuid.UUID
    uploaded_by: uuid.UUID
    title: str
    document_type: str
    file_url: str
    file_size_bytes: int
    mime_type: str
    document_date: date
    status: str
    doctor_name: Optional[str] = None
    hospital_name: Optional[str] = None
    summary: Optional[str] = None
    extracted_tags: List[Any] = []
    extracted_fields: dict[str, Any] = {}
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

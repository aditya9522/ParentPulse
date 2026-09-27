# backend/app/schemas/ai.py
import uuid
from typing import List, Optional, Any
from pydantic import BaseModel


class AIChatRequest(BaseModel):
    parent_id: uuid.UUID
    query: str
    include_disclaimer: bool = True


class AISourceCitation(BaseModel):
    document_id: str
    title: str
    document_date: str
    snippet: str


class AIChatResponse(BaseModel):
    answer: str
    citations: List[AISourceCitation] = []
    confidence: float = 0.95
    disclaimer: str = (
        "ParentPulse organizes and summarizes your stored health records. "
        "It does not diagnose medical conditions, prescribe treatment, or replace professional medical advice."
    )


class DocumentExtractionResult(BaseModel):
    document_type: str
    doctor_name: Optional[str] = None
    hospital_name: Optional[str] = None
    document_date: Optional[str] = None
    extracted_fields: dict[str, Any] = {}
    summary: str
    suggested_timeline_events: List[dict[str, Any]] = []

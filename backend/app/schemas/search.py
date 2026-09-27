# backend/app/schemas/search.py
import uuid
from typing import Optional, List, Any
from pydantic import BaseModel


class UniversalSearchQuery(BaseModel):
    family_id: uuid.UUID
    parent_id: Optional[uuid.UUID] = None
    query: str
    types: Optional[List[str]] = None  # ["documents", "medicines", "appointments", "timeline"]


class SearchResultItem(BaseModel):
    type: str
    id: str
    title: str
    subtitle: str
    date: Optional[str] = None
    metadata: dict[str, Any] = {}


class UniversalSearchResponse(BaseModel):
    query: str
    results: List[SearchResultItem]
    total_matches: int

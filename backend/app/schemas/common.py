# backend/app/schemas/common.py
from typing import Generic, Optional, TypeVar, Any
from pydantic import BaseModel, Field

DataT = TypeVar("DataT")


class PaginationMeta(BaseModel):
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)
    total_items: int = 0
    total_pages: int = 0
    has_next: bool = False
    has_prev: bool = False


class ResponseMeta(BaseModel):
    request_id: str
    pagination: Optional[PaginationMeta] = None


class ApiResponse(BaseModel, Generic[DataT]):
    data: DataT
    meta: ResponseMeta


class ApiErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[dict[str, Any]] = None
    request_id: str


class ApiErrorResponse(BaseModel):
    error: ApiErrorDetail

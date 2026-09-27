# backend/app/api/v1/endpoints/documents.py
from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_user, get_db, get_parent_access_context
from app.models.user import User
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentResponse
from app.schemas.common import ApiResponse
from app.helpers.response_builder import build_response
from app.services.document_service import DocumentService
from app.services.storage_service import StorageService

router = APIRouter(prefix="/documents", tags=["Medical Documents"])


@router.post("", response_model=ApiResponse[DocumentResponse])
async def upload_document_record(
    data: DocumentCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = DocumentService(session)
    doc = await service.create_and_process_document(current_user.id, data)
    return build_response(DocumentResponse.model_validate(doc))


@router.get("/parent/{parent_id}", response_model=ApiResponse[List[DocumentResponse]])
async def list_parent_documents(
    parent_id: UUID,
    document_type: Optional[str] = Query(None),
    context=Depends(get_parent_access_context),
    session: AsyncSession = Depends(get_db),
):
    service = DocumentService(session)
    docs = await service.list_documents(parent_id, document_type)
    return build_response([DocumentResponse.model_validate(d) for d in docs])


@router.get("/{document_id}", response_model=ApiResponse[DocumentResponse])
async def get_document_details(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = DocumentService(session)
    doc = await service.get_document(document_id)
    return build_response(DocumentResponse.model_validate(doc))


@router.get("/{document_id}/download-url", response_model=ApiResponse[dict])
async def get_document_download_url(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = DocumentService(session)
    doc = await service.get_document(document_id)
    url = await StorageService.get_secure_download_url(doc.storage_path)
    return build_response({"download_url": url, "expires_in_seconds": 3600})


@router.patch("/{document_id}", response_model=ApiResponse[DocumentResponse])
async def update_document(
    document_id: UUID,
    data: DocumentUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = DocumentService(session)
    updated = await service.update_document(document_id, data)
    return build_response(DocumentResponse.model_validate(updated))


@router.delete("/{document_id}", response_model=ApiResponse[dict])
async def archive_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = DocumentService(session)
    await service.delete_document(document_id)
    return build_response({"status": "archived", "document_id": str(document_id)})

# backend/app/api/v1/endpoints/documents.py
from datetime import date
from uuid import UUID

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    Header,
    HTTPException,
    Query,
    UploadFile,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db, get_parent_access_context
from app.core.concurrency import enforce_record_version
from app.core.config import get_settings
from app.core.constants import DocumentType
from app.core.exceptions import AuthorizationError
from app.core.permissions import verify_parent_access
from app.db.session import AsyncSessionFactory
from app.helpers.response_builder import build_response
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.document import DocumentCreate, DocumentResponse, DocumentUpdate
from app.services.document_service import DocumentService
from app.services.storage_service import StorageService

router = APIRouter(prefix="/documents", tags=["Medical Documents"])

ALLOWED_DOCUMENT_TYPES = {
    "application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic",
}


async def process_document_job(document_id: UUID, content: bytes) -> None:
    async with AsyncSessionFactory() as session:
        try:
            await DocumentService(session).process_extraction(document_id, content)
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@router.post("/upload", response_model=ApiResponse[DocumentResponse], status_code=202)
async def upload_document(
    background_tasks: BackgroundTasks,
    parent_id: UUID = Form(...),
    family_id: UUID = Form(...),
    title: str = Form(..., min_length=1, max_length=255),
    document_type: DocumentType = Form(...),
    document_date: date = Form(...),
    doctor_name: str | None = Form(None),
    hospital_name: str | None = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    parent, member = await verify_parent_access(session, current_user.id, parent_id)
    if parent.family_id != family_id:
        raise AuthorizationError("The selected parent does not belong to this family.")
    if not member.can_upload_documents:
        raise AuthorizationError("Document upload permission is required.")

    mime_type = (file.content_type or "").lower()
    if mime_type not in ALLOWED_DOCUMENT_TYPES:
        raise HTTPException(status_code=415, detail="Upload a PDF, JPEG, PNG, WebP, or HEIC medical document.")
    settings = get_settings()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    content = await file.read(max_bytes + 1)
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded document is empty.")
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail=f"Document exceeds the {settings.max_upload_size_mb} MB limit.")

    storage_path = await StorageService.upload_document(
        family_id, parent_id, file.filename or "medical-document", content, mime_type,
    )
    data = DocumentCreate(
        parent_id=parent_id,
        family_id=family_id,
        title=title,
        document_type=document_type,
        file_url="",
        storage_path=storage_path,
        file_size_bytes=len(content),
        mime_type=mime_type,
        document_date=document_date,
        doctor_name=doctor_name,
        hospital_name=hospital_name,
    )
    doc = await DocumentService(session).create_and_process_document(current_user.id, data, content)
    background_tasks.add_task(process_document_job, doc.id, content)
    return build_response(DocumentResponse.model_validate(doc))


@router.get("/parent/{parent_id}", response_model=ApiResponse[list[DocumentResponse]])
async def list_parent_documents(
    parent_id: UUID,
    document_type: str | None = Query(None),
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
    await verify_parent_access(session, current_user.id, doc.parent_id)
    return build_response(DocumentResponse.model_validate(doc))


@router.get("/{document_id}/download-url", response_model=ApiResponse[dict])
async def get_document_download_url(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = DocumentService(session)
    doc = await service.get_document(document_id)
    await verify_parent_access(session, current_user.id, doc.parent_id)
    url = await StorageService.get_secure_download_url(doc.storage_path)
    return build_response({"download_url": url, "expires_in_seconds": 3600})


@router.post("/{document_id}/retry", response_model=ApiResponse[DocumentResponse], status_code=202)
async def retry_document_extraction(
    document_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = DocumentService(session)
    doc = await service.get_document(document_id)
    _, member = await verify_parent_access(session, current_user.id, doc.parent_id)
    if not member.can_upload_documents:
        raise AuthorizationError("Document management permission is required.")
    content = await StorageService.read_document(doc.storage_path)
    doc = await service.doc_repo.update(doc.id, status="pending", summary=None)
    background_tasks.add_task(process_document_job, document_id, content)
    return build_response(DocumentResponse.model_validate(doc))


@router.patch("/{document_id}", response_model=ApiResponse[DocumentResponse])
async def update_document(
    document_id: UUID,
    data: DocumentUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    record_version: str | None = Header(None, alias="X-Record-Version"),
    conflict_resolution: str | None = Header(None, alias="X-Conflict-Resolution"),
):
    service = DocumentService(session)
    doc = await service.get_document(document_id)
    _, member = await verify_parent_access(session, current_user.id, doc.parent_id)
    if not member.can_upload_documents:
        raise AuthorizationError("Document management permission is required.")
    enforce_record_version(doc.updated_at, record_version, conflict_resolution)
    updated = await service.update_document(document_id, data)
    return build_response(DocumentResponse.model_validate(updated))


@router.delete("/{document_id}", response_model=ApiResponse[dict])
async def archive_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    record_version: str | None = Header(None, alias="X-Record-Version"),
    conflict_resolution: str | None = Header(None, alias="X-Conflict-Resolution"),
):
    service = DocumentService(session)
    doc = await service.get_document(document_id)
    _, member = await verify_parent_access(session, current_user.id, doc.parent_id)
    if not member.can_upload_documents:
        raise AuthorizationError("Document management permission is required.")
    enforce_record_version(doc.updated_at, record_version, conflict_resolution)
    await service.delete_document(document_id)
    return build_response({"status": "archived", "document_id": str(document_id)})

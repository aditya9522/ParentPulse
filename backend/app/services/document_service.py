# backend/app/services/document_service.py
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.gemini import gemini_client
from app.clients.pinecone import pinecone_client
from app.core.exceptions import ResourceNotFoundError
from app.core.logging import logger
from app.crud.documents import DocumentRepository
from app.crud.timeline import TimelineRepository
from app.models.document import Document
from app.schemas.document import DocumentCreate, DocumentUpdate


class DocumentService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.doc_repo = DocumentRepository(session)
        self.timeline_repo = TimelineRepository(session)

    async def list_documents(
        self,
        parent_id: UUID,
        document_type: str | None = None,
    ) -> list[Document]:
        return await self.doc_repo.list_by_parent(parent_id, document_type)

    async def get_document(self, document_id: UUID) -> Document:
        doc = await self.doc_repo.get_by_id(document_id)
        if not doc:
            raise ResourceNotFoundError("Document", document_id)
        return doc

    async def create_and_process_document(
        self,
        uploaded_by: UUID,
        data: DocumentCreate,
        file_bytes: bytes | None = None,
    ) -> Document:
        doc = await self.doc_repo.create(
            parent_id=data.parent_id,
            family_id=data.family_id,
            uploaded_by=uploaded_by,
            title=data.title,
            document_type=data.document_type.value,
            file_url=data.file_url,
            storage_path=data.storage_path,
            file_size_bytes=data.file_size_bytes,
            mime_type=data.mime_type,
            document_date=data.document_date,
            doctor_name=data.doctor_name,
            hospital_name=data.hospital_name,
            status="pending",
        )

        return doc

    async def process_extraction(self, document_id: UUID, file_bytes: bytes | None = None) -> None:
        doc = await self.doc_repo.get_by_id(document_id)
        if not doc:
            return

        try:
            if not file_bytes:
                raise ValueError("Document content is unavailable for extraction")
            await self.doc_repo.update(doc.id, status="processing")
            data = await gemini_client.extract_medical_document(file_bytes, doc.mime_type, doc.title)
            raw_text = data.get("raw_text", "")
            if not raw_text:
                raise ValueError("No readable text was extracted from the document")

            # Update document with AI extracted results
            await self.doc_repo.update(
                doc.id,
                status="extracted",
                summary=data.get("summary"),
                extracted_fields=data.get("extracted_fields", {}),
                extracted_tags=list(dict.fromkeys([doc.document_type, *data.get("tags", [])])),
                raw_ocr_text=raw_text,
            )

            # Search indexing is independent of successful extraction. A provider
            # outage must not discard factual OCR that is already persisted.
            try:
                embedding = await gemini_client.create_embedding(raw_text)
                await pinecone_client.upsert_vector(
                    vector_id=f"doc_{doc.id}",
                    embedding=embedding,
                    metadata={
                        "family_id": str(doc.family_id),
                        "parent_id": str(doc.parent_id),
                        "document_id": str(doc.id),
                        "title": doc.title,
                        "date": str(doc.document_date),
                        "content": raw_text,
                    },
                )
            except Exception as exc:
                logger.error(f"Document search indexing failed for {document_id}: {exc}")

            # Auto-suggest timeline event if found
            for event in data.get("suggested_timeline_events", []):
                await self.timeline_repo.create(
                    parent_id=doc.parent_id,
                    family_id=doc.family_id,
                    title=event.get("title", f"Document: {doc.title}"),
                    description=event.get("description", "Uploaded document record"),
                    event_type=event.get("event_type", "doctor_visit"),
                    event_date=doc.created_at,
                    doctor_name=doc.doctor_name,
                    document_id=doc.id,
                )

        except Exception as exc:
            logger.error(f"Document extraction failed for {document_id}: {exc}")
            await self.doc_repo.update(doc.id, status="failed")

    async def update_document(self, document_id: UUID, data: DocumentUpdate) -> Document:
        update_dict = data.model_dump(exclude_unset=True)
        if update_dict.get("document_type"):
            update_dict["document_type"] = update_dict["document_type"].value
        doc = await self.doc_repo.update(document_id, **update_dict)
        if not doc:
            raise ResourceNotFoundError("Document", document_id)
        return doc

    async def delete_document(self, document_id: UUID) -> None:
        await self.doc_repo.update(document_id, is_archived=True)

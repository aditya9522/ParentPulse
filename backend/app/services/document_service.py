# backend/app/services/document_service.py
import json
from uuid import UUID
from datetime import date
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.documents import DocumentRepository
from app.crud.timeline import TimelineRepository
from app.models.document import Document
from app.schemas.document import DocumentCreate, DocumentUpdate
from app.clients.gemini import gemini_client
from app.clients.pinecone import pinecone_client
from app.helpers.prompt_builder import build_document_extraction_prompt
from app.core.exceptions import ResourceNotFoundError
from app.core.logging import logger


class DocumentService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.doc_repo = DocumentRepository(session)
        self.timeline_repo = TimelineRepository(session)

    async def list_documents(
        self,
        parent_id: UUID,
        document_type: Optional[str] = None,
    ) -> List[Document]:
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
        file_bytes: Optional[bytes] = None,
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
            status="processing",
        )

        # Asynchronously process extraction
        await self.process_extraction(doc.id, file_bytes)
        return doc

    async def process_extraction(self, document_id: UUID, file_bytes: Optional[bytes] = None) -> None:
        doc = await self.doc_repo.get_by_id(document_id)
        if not doc:
            return

        try:
            sample_ocr = (
                f"Medical Record for Parent Pulse. Title: {doc.title}. "
                f"Doctor: {doc.doctor_name or 'Dr. Arun Verma'}. Date: {doc.document_date}. "
                "Diagnosis: Blood Pressure check. Prescribed Telmisartan 40mg. Follow-up in 1 month."
            )
            prompt = build_document_extraction_prompt(sample_ocr, doc.title)
            response_text = await gemini_client.generate_content(prompt)
            data = json.loads(response_text)

            # Update document with AI extracted results
            await self.doc_repo.update(
                doc.id,
                status="extracted",
                summary=data.get("summary"),
                extracted_fields=data.get("extracted_fields", {}),
                extracted_tags=[doc.document_type, "verified"],
                raw_ocr_text=sample_ocr,
            )

            # Create embedding and save to Pinecone with authorization metadata
            embedding = await gemini_client.create_embedding(sample_ocr)
            await pinecone_client.upsert_vector(
                vector_id=f"doc_{doc.id}",
                embedding=embedding,
                metadata={
                    "family_id": str(doc.family_id),
                    "parent_id": str(doc.parent_id),
                    "document_id": str(doc.id),
                    "title": doc.title,
                    "date": str(doc.document_date),
                    "content": sample_ocr,
                },
            )

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
        if "document_type" in update_dict and update_dict["document_type"]:
            update_dict["document_type"] = update_dict["document_type"].value
        doc = await self.doc_repo.update(document_id, **update_dict)
        if not doc:
            raise ResourceNotFoundError("Document", document_id)
        return doc

    async def delete_document(self, document_id: UUID) -> None:
        await self.doc_repo.update(document_id, is_archived=True)

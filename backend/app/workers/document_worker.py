# backend/app/workers/document_worker.py
from uuid import UUID
from app.core.logging import logger


async def process_document_job(document_id: UUID) -> None:
    logger.info(f"Background worker started OCR and extraction for document: {document_id}")

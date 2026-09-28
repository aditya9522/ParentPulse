# backend/app/services/storage_service.py
import re
import uuid

from app.clients.supabase import (
    create_signed_storage_url,
    download_storage_object,
    upload_storage_object,
)


class StorageService:
    BUCKET = "medical-documents"

    @staticmethod
    async def upload_document(
        family_id: uuid.UUID,
        parent_id: uuid.UUID,
        filename: str,
        content: bytes,
        mime_type: str,
    ) -> str:
        safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", filename).strip("._") or "document"
        path = f"{family_id}/{parent_id}/{uuid.uuid4()}-{safe_name}"
        await upload_storage_object(StorageService.BUCKET, path, content, mime_type)
        return path

    @staticmethod
    async def get_secure_download_url(storage_path: str, bucket: str = BUCKET) -> str:
        return await create_signed_storage_url(bucket=bucket, path=storage_path)

    @staticmethod
    async def read_document(storage_path: str) -> bytes:
        return await download_storage_object(StorageService.BUCKET, storage_path)

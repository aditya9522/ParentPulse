# backend/app/services/storage_service.py
from app.clients.supabase import create_signed_storage_url


class StorageService:
    @staticmethod
    async def get_secure_download_url(storage_path: str, bucket: str = "medical-documents") -> str:
        return await create_signed_storage_url(bucket=bucket, path=storage_path)

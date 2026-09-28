# backend/app/clients/supabase.py
import asyncio

from app.core.config import get_settings
from app.core.logging import logger
from supabase import Client, create_client

_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    global _supabase_client
    if _supabase_client is None:
        settings = get_settings()
        try:
            _supabase_client = create_client(
                settings.supabase_url,
                settings.supabase_secret_key.get_secret_value(),
            )
        except Exception as exc:
            logger.error(f"Could not initialize Supabase client: {exc}")
            raise RuntimeError("Supabase storage is not configured") from exc
    return _supabase_client


async def create_signed_storage_url(bucket: str, path: str, expires_in: int = 3600) -> str:
    """
    Creates a time-limited signed URL for private medical document access.
    """
    client = get_supabase_client()
    res = client.storage.from_(bucket).create_signed_url(path, expires_in)
    return res.get("signedURL") or res.get("signedUrl", "")


async def upload_storage_object(bucket: str, path: str, content: bytes, mime_type: str) -> None:
    client = get_supabase_client()
    if client is None:
        raise RuntimeError("Supabase storage is not configured")

    def upload() -> None:
        client.storage.from_(bucket).upload(
            path=path,
            file=content,
            file_options={"content-type": mime_type, "upsert": "false"},
        )

    await asyncio.to_thread(upload)


async def download_storage_object(bucket: str, path: str) -> bytes:
    client = get_supabase_client()
    if client is None:
        raise RuntimeError("Supabase storage is not configured")
    return await asyncio.to_thread(client.storage.from_(bucket).download, path)

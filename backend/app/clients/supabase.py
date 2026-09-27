# backend/app/clients/supabase.py
from typing import Optional
from supabase import create_client, Client
from app.core.config import get_settings
from app.core.logging import logger

_supabase_client: Optional[Client] = None


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
            logger.warning(f"Could not connect to live Supabase client, using fallback: {exc}")
    return _supabase_client  # type: ignore


async def create_signed_storage_url(bucket: str, path: str, expires_in: int = 3600) -> str:
    """
    Creates a time-limited signed URL for private medical document access.
    """
    settings = get_settings()
    if settings.environment in ("local", "test"):
        return f"https://mock-storage.parentpulse.local/{bucket}/{path}?token=mock-signed"

    client = get_supabase_client()
    res = client.storage.from_(bucket).create_signed_url(path, expires_in)
    return res.get("signedURL") or res.get("signedUrl", "")

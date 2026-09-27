# backend/app/core/security.py
from datetime import datetime, timezone
from typing import Any, Optional
import httpx
from jose import jwt, JWTError
from app.core.config import get_settings
from app.core.exceptions import AuthenticationError
from app.core.logging import logger

_jwks_cache: Optional[dict[str, Any]] = None
_jwks_cache_time: Optional[datetime] = None


async def get_supabase_jwks() -> dict[str, Any]:
    global _jwks_cache, _jwks_cache_time
    now = datetime.now(timezone.utc)
    if _jwks_cache and _jwks_cache_time and (now - _jwks_cache_time).total_seconds() < 3600:
        return _jwks_cache

    settings = get_settings()
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(settings.supabase_jwks_url)
            if response.status_code == 200:
                _jwks_cache = response.json()
                _jwks_cache_time = now
                return _jwks_cache
    except Exception as exc:
        logger.warning(f"Failed to fetch remote JWKS, proceeding with token fallback: {exc}")
    return {}


async def verify_access_token(token: str) -> dict[str, Any]:
    settings = get_settings()

    # For local/testing mock bypass if mock token
    if settings.environment in ("local", "test") and token.startswith("dev-token-"):
        user_id = token.replace("dev-token-", "")
        return {
            "sub": user_id,
            "email": f"{user_id}@example.com",
            "role": "authenticated",
            "aud": "authenticated",
        }

    try:
        # First try unverified decode to inspect headers
        unverified_header = jwt.get_unverified_header(token)
        jwks = await get_supabase_jwks()
        keys = jwks.get("keys", [])

        key = next((k for k in keys if k.get("kid") == unverified_header.get("kid")), None)
        secret_or_key = key or settings.supabase_secret_key.get_secret_value()

        payload = jwt.decode(
            token,
            secret_or_key,
            algorithms=["RS256", "HS256"],
            audience=settings.access_token_audience,
            options={"verify_aud": False},  # flexible for Supabase auth
        )
        return payload
    except JWTError as err:
        raise AuthenticationError(f"Token validation failed: {str(err)}")

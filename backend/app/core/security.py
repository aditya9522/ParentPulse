# backend/app/core/security.py
from datetime import UTC, datetime
from typing import Any

import httpx
from jose import JWTError, jwt

from app.core.config import get_settings
from app.core.exceptions import AuthenticationError
from app.core.logging import logger

_jwks_cache: dict[str, Any] | None = None
_jwks_cache_time: datetime | None = None


async def get_supabase_jwks() -> dict[str, Any]:
    global _jwks_cache, _jwks_cache_time
    now = datetime.now(UTC)
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
        logger.warning(f"Failed to refresh remote JWKS; legacy HMAC validation may still apply: {exc}")
    return {}


async def verify_access_token(token: str) -> dict[str, Any]:
    settings = get_settings()

    try:
        # First try unverified decode to inspect headers
        unverified_header = jwt.get_unverified_header(token)
        jwks = await get_supabase_jwks()
        keys = jwks.get("keys", [])

        key = next((k for k in keys if k.get("kid") == unverified_header.get("kid")), None)
        secret_or_key = key or settings.supabase_secret_key.get_secret_value()
        algorithms = ["RS256"] if key else ["HS256"]

        payload = jwt.decode(
            token,
            secret_or_key,
            algorithms=algorithms,
            audience=settings.access_token_audience,
            options={"verify_aud": True},
        )
        return payload
    except JWTError as err:
        raise AuthenticationError(f"Token validation failed: {err!s}")

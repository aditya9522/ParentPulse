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
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning(f"Failed to refresh remote JWKS: {exc}")
    return {}


async def verify_access_token(token: str) -> dict[str, Any]:
    settings = get_settings()

    try:
        unverified_header = jwt.get_unverified_header(token)
        algorithm = unverified_header.get("alg")
        if algorithm not in {"ES256", "RS256", "HS256"}:
            raise AuthenticationError("Token uses an unsupported signing algorithm.")

        if algorithm == "HS256":
            return await _verify_legacy_token_with_auth_server(token)

        jwks = await get_supabase_jwks()
        keys = jwks.get("keys", [])
        key = next((k for k in keys if k.get("kid") == unverified_header.get("kid")), None)
        if not key or key.get("alg") != algorithm:
            raise AuthenticationError("Token signing key is unavailable. Please sign in again.")

        payload = jwt.decode(
            token,
            key,
            algorithms=[algorithm],
            audience=settings.access_token_audience,
            options={"verify_aud": True},
        )
        return payload
    except AuthenticationError:
        raise
    except JWTError as err:
        raise AuthenticationError(f"Token validation failed: {err!s}")


async def _verify_legacy_token_with_auth_server(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{settings.supabase_url.rstrip('/')}/auth/v1/user",
                headers={
                    "apikey": settings.supabase_publishable_key.get_secret_value(),
                    "Authorization": f"Bearer {token}",
                },
            )
    except httpx.HTTPError as exc:
        raise AuthenticationError("Authentication service is temporarily unavailable.") from exc

    if response.status_code != 200:
        raise AuthenticationError("Session is invalid or expired. Please sign in again.")

    user = response.json()
    payload = jwt.get_unverified_claims(token)
    if payload.get("sub") != user.get("id"):
        raise AuthenticationError("Token identity could not be verified.")
    return payload

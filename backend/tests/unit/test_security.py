from unittest.mock import AsyncMock

import pytest

from app.core import security
from app.core.exceptions import AuthenticationError


@pytest.mark.asyncio
async def test_verify_access_token_uses_matching_asymmetric_algorithm(monkeypatch):
    signing_key = {"kid": "current-key", "alg": "ES256", "kty": "EC"}
    monkeypatch.setattr(security.jwt, "get_unverified_header", lambda _: {"kid": "current-key", "alg": "ES256"})
    monkeypatch.setattr(security, "get_supabase_jwks", AsyncMock(return_value={"keys": [signing_key]}))

    captured = {}

    def decode(token, key, **kwargs):
        captured.update(token=token, key=key, **kwargs)
        return {"sub": "40a10f31-ad9b-45a9-8536-e8df46330f5f"}

    monkeypatch.setattr(security.jwt, "decode", decode)

    payload = await security.verify_access_token("signed-token")

    assert payload["sub"] == "40a10f31-ad9b-45a9-8536-e8df46330f5f"
    assert captured["key"] == signing_key
    assert captured["algorithms"] == ["ES256"]
    assert captured["options"] == {"verify_aud": True}


@pytest.mark.asyncio
async def test_verify_access_token_validates_legacy_hmac_with_auth_server(monkeypatch):
    legacy_payload = {"sub": "40a10f31-ad9b-45a9-8536-e8df46330f5f"}
    verifier = AsyncMock(return_value=legacy_payload)
    monkeypatch.setattr(security.jwt, "get_unverified_header", lambda _: {"alg": "HS256"})
    monkeypatch.setattr(security, "_verify_legacy_token_with_auth_server", verifier)

    assert await security.verify_access_token("legacy-token") == legacy_payload
    verifier.assert_awaited_once_with("legacy-token")


@pytest.mark.asyncio
async def test_verify_access_token_rejects_algorithm_mismatch(monkeypatch):
    monkeypatch.setattr(security.jwt, "get_unverified_header", lambda _: {"kid": "current-key", "alg": "RS256"})
    monkeypatch.setattr(
        security,
        "get_supabase_jwks",
        AsyncMock(return_value={"keys": [{"kid": "current-key", "alg": "ES256"}]}),
    )

    with pytest.raises(AuthenticationError, match="signing key"):
        await security.verify_access_token("wrong-algorithm-token")

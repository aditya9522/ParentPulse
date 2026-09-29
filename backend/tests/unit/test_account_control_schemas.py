import uuid
from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.core.exceptions import AuthenticationError
from app.models.user import User
from app.schemas.account_control import DeleteAccountRequest
from app.services.account_control_service import verify_google_identity


def test_password_deletion_requires_password():
    with pytest.raises(ValidationError):
        DeleteAccountRequest(
            credential_type="password",
            confirmation="DELETE MY PARENTPULSE ACCOUNT",
        )


def test_google_deletion_requires_fresh_identity_token():
    with pytest.raises(ValidationError):
        DeleteAccountRequest(
            credential_type="google",
            confirmation="DELETE MY PARENTPULSE ACCOUNT",
        )


def test_google_deletion_accepts_provider_token():
    request = DeleteAccountRequest(
        credential_type="google",
        google_id_token="x" * 100,
        confirmation="DELETE MY PARENTPULSE ACCOUNT",
    )
    assert request.password is None


@pytest.mark.asyncio
async def test_google_verification_must_match_current_supabase_user(monkeypatch):
    current_user = User(
        id=uuid.uuid4(),
        email="person@example.com",
        full_name="Person",
        preferred_language="en",
    )

    class FakeAuth:
        def sign_in_with_id_token(self, _credentials):
            return SimpleNamespace(user=SimpleNamespace(id=uuid.uuid4()))

    monkeypatch.setattr(
        "app.services.account_control_service.create_client",
        lambda *_args: SimpleNamespace(auth=FakeAuth()),
    )

    with pytest.raises(AuthenticationError, match="currently signed in"):
        await verify_google_identity(current_user, "token")

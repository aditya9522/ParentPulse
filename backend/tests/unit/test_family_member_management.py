from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.core.exceptions import AuthorizationError, ConflictError
from app.schemas.family import FamilyMemberInvite, FamilyMemberUpdate
from app.services import family_service
from app.services.family_service import FamilyService


def test_member_update_requires_a_change():
    with pytest.raises(ValidationError, match="At least one member field"):
        FamilyMemberUpdate()


def test_member_update_rejects_unknown_role():
    with pytest.raises(ValidationError):
        FamilyMemberUpdate(role="owner")


def test_member_invite_validates_email_and_role():
    with pytest.raises(ValidationError):
        FamilyMemberInvite(email="not-an-email", relationship="Parent")
    with pytest.raises(ValidationError):
        FamilyMemberInvite(email="care@example.com", relationship="Parent", role="owner")


@pytest.mark.asyncio
async def test_duplicate_member_invite_returns_conflict():
    actor_id = uuid4()
    user = SimpleNamespace(id=uuid4())
    service = FamilyService(AsyncMock())
    service.user_repo = SimpleNamespace(get_by_email=AsyncMock(return_value=user))
    service.family_repo = SimpleNamespace(get_member_by_user=AsyncMock(return_value=object()))

    with pytest.raises(ConflictError, match="already a member"):
        await service.invite_member(
            uuid4(),
            FamilyMemberInvite(email="care@example.com", relationship="Parent"),
            actor_id,
        )


@pytest.mark.asyncio
async def test_owner_access_cannot_be_changed(monkeypatch):
    owner_id = uuid4()
    family = SimpleNamespace(id=uuid4(), created_by=owner_id)
    member = SimpleNamespace(id=uuid4(), user_id=owner_id)
    service = FamilyService(AsyncMock())
    service.family_repo = SimpleNamespace(get_member_with_user=AsyncMock(return_value=member))

    with pytest.raises(AuthorizationError, match="owner's access"):
        await service.update_member(
            family,
            member.id,
            FamilyMemberUpdate(can_manage_medicines=False),
            owner_id,
        )


@pytest.mark.asyncio
async def test_member_update_is_scoped_and_audited(monkeypatch):
    owner_id = uuid4()
    family = SimpleNamespace(id=uuid4(), created_by=owner_id)
    member = SimpleNamespace(
        id=uuid4(),
        user_id=uuid4(),
        relationship_name="Caregiver",
        role="caregiver",
        can_manage_medicines=True,
    )
    repository = SimpleNamespace(get_member_with_user=AsyncMock(return_value=member))
    session = AsyncMock()
    audit = SimpleNamespace(log_event=AsyncMock())
    monkeypatch.setattr(family_service, "AuditService", MagicMock(return_value=audit))
    service = FamilyService(session)
    service.family_repo = repository

    updated = await service.update_member(
        family,
        member.id,
        FamilyMemberUpdate(relationship="Local nurse", can_manage_medicines=False),
        owner_id,
    )

    assert updated.relationship_name == "Local nurse"
    assert updated.can_manage_medicines is False
    repository.get_member_with_user.assert_awaited_with(family.id, member.id)
    audit.log_event.assert_awaited_once()


@pytest.mark.asyncio
async def test_member_removal_preserves_identity_and_writes_audit(monkeypatch):
    owner_id = uuid4()
    family = SimpleNamespace(id=uuid4(), created_by=owner_id)
    member = SimpleNamespace(id=uuid4(), user_id=uuid4())
    session = AsyncMock()
    repository = SimpleNamespace(get_member_with_user=AsyncMock(return_value=member))
    audit = SimpleNamespace(log_event=AsyncMock())
    monkeypatch.setattr(family_service, "AuditService", MagicMock(return_value=audit))
    service = FamilyService(session)
    service.family_repo = repository

    await service.remove_member(family, member.id, owner_id)

    session.delete.assert_awaited_once_with(member)
    audit.log_event.assert_awaited_once()

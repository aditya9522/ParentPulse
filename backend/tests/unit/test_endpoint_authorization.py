from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.api.v1.endpoints import caregivers, families, locations, tasks, timeline
from app.core.exceptions import AuthorizationError
from app.schemas.task import TaskUpdate


@pytest.mark.asyncio
async def test_timeline_create_requires_parent_access(monkeypatch):
    verifier = AsyncMock(side_effect=AuthorizationError())
    monkeypatch.setattr(timeline, "verify_parent_access", verifier)

    with pytest.raises(AuthorizationError):
        await timeline.create_timeline_event(
            data=SimpleNamespace(parent_id=uuid4()),
            current_user=SimpleNamespace(id=uuid4()),
            session=AsyncMock(),
        )

    verifier.assert_awaited_once()


@pytest.mark.asyncio
async def test_caregiver_assignment_requires_family_owner(monkeypatch):
    family_id = uuid4()
    monkeypatch.setattr(
        caregivers,
        "verify_parent_access",
        AsyncMock(return_value=(SimpleNamespace(family_id=family_id), MagicMock())),
    )
    owner_check = AsyncMock(side_effect=AuthorizationError("Only the family owner can assign caregivers."))
    monkeypatch.setattr(caregivers, "verify_family_owner", owner_check)

    with pytest.raises(AuthorizationError, match="family owner"):
        await caregivers.assign_caregiver(
            data=SimpleNamespace(parent_id=uuid4(), user_id=uuid4()),
            current_user=SimpleNamespace(id=uuid4()),
            session=AsyncMock(),
        )

    owner_check.assert_awaited_once()


@pytest.mark.asyncio
async def test_location_create_rejects_parent_path_mismatch():
    authorized_parent_id = uuid4()
    member = SimpleNamespace(can_view_location_history=True)

    with pytest.raises(AuthorizationError, match="does not match"):
        await locations.record_parent_visit(
            parent_id=authorized_parent_id,
            data=SimpleNamespace(parent_id=uuid4()),
            context=(SimpleNamespace(family_id=uuid4()), member),
            current_user=SimpleNamespace(id=uuid4()),
            session=AsyncMock(),
        )


@pytest.mark.asyncio
async def test_task_update_checks_access_before_mutating(monkeypatch):
    task = SimpleNamespace(id=uuid4(), parent_id=uuid4(), family_id=uuid4(), status="pending", updated_at=None)
    result = MagicMock()
    result.scalar_one_or_none.return_value = task
    session = AsyncMock()
    session.execute.return_value = result
    monkeypatch.setattr(tasks, "verify_parent_access", AsyncMock(side_effect=AuthorizationError()))

    with pytest.raises(AuthorizationError):
        await tasks.update_task(
            task_id=task.id,
            data=TaskUpdate(status="completed"),
            current_user=SimpleNamespace(id=uuid4()),
            session=session,
            record_version=None,
            conflict_resolution=None,
        )

    assert task.status == "pending"


@pytest.mark.asyncio
async def test_member_update_requires_family_owner(monkeypatch):
    owner_check = AsyncMock(side_effect=AuthorizationError("Only the family owner can manage members."))
    monkeypatch.setattr(families, "verify_family_owner", owner_check)

    with pytest.raises(AuthorizationError, match="family owner"):
        await families.update_family_member(
            family_id=uuid4(),
            member_id=uuid4(),
            data=SimpleNamespace(),
            current_user=SimpleNamespace(id=uuid4()),
            session=AsyncMock(),
        )

    owner_check.assert_awaited_once()


@pytest.mark.asyncio
async def test_member_removal_requires_family_owner(monkeypatch):
    owner_check = AsyncMock(side_effect=AuthorizationError("Only the family owner can manage members."))
    monkeypatch.setattr(families, "verify_family_owner", owner_check)

    with pytest.raises(AuthorizationError, match="family owner"):
        await families.remove_family_member(
            family_id=uuid4(),
            member_id=uuid4(),
            current_user=SimpleNamespace(id=uuid4()),
            session=AsyncMock(),
        )

    owner_check.assert_awaited_once()

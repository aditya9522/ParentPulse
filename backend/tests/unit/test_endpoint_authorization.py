from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
from datetime import datetime, timezone

import pytest

from app.api.v1.endpoints import caregivers, doctors, families, locations, parents, search, tasks, timeline
from app.core.constants import UserRole
from app.core.exceptions import AuthorizationError
from app.core.permissions import verify_parent_access
from app.schemas.task import TaskUpdate
from app.schemas.search import UniversalSearchQuery


@pytest.mark.asyncio
@pytest.mark.parametrize("role", list(UserRole))
async def test_every_supported_member_role_can_read_parent_care_data(role):
    user_id = uuid4()
    family_id = uuid4()
    parent = SimpleNamespace(id=uuid4(), family_id=family_id)
    member = SimpleNamespace(user_id=user_id, family_id=family_id, role=role.value)
    parent_result = MagicMock()
    parent_result.scalar_one_or_none.return_value = parent
    member_result = MagicMock()
    member_result.scalar_one_or_none.return_value = member
    session = AsyncMock()
    session.execute.side_effect = [parent_result, member_result]

    resolved_parent, resolved_member = await verify_parent_access(session, user_id, parent.id)

    assert resolved_parent is parent
    assert resolved_member is member


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
async def test_timeline_update_requires_parent_access(monkeypatch):
    event_id = uuid4()
    parent_id = uuid4()
    mock_event = SimpleNamespace(id=event_id, parent_id=parent_id)
    session = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_event
    session.execute.return_value = mock_result

    verifier = AsyncMock(side_effect=AuthorizationError())
    monkeypatch.setattr(timeline, "verify_parent_access", verifier)

    with pytest.raises(AuthorizationError):
        await timeline.update_timeline_event(
            event_id=event_id,
            data=SimpleNamespace(document_id=None, title="New Title"),
            current_user=SimpleNamespace(id=uuid4()),
            session=session,
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


@pytest.mark.asyncio
async def test_health_record_search_requires_parent_access(monkeypatch):
    verifier = AsyncMock(side_effect=AuthorizationError())
    monkeypatch.setattr(search, "verify_parent_access", verifier)

    with pytest.raises(AuthorizationError):
        await search.search_health_records(
            query_body=UniversalSearchQuery(
                query="blood pressure",
                family_id=uuid4(),
                parent_id=uuid4(),
            ),
            current_user=SimpleNamespace(id=uuid4()),
            session=AsyncMock(),
        )

    verifier.assert_awaited_once()


@pytest.mark.asyncio
async def test_parent_creation_requires_family_owner(monkeypatch):
    owner_check = AsyncMock(side_effect=AuthorizationError("Only the family owner can add parents."))
    monkeypatch.setattr(parents, "verify_family_owner", owner_check)
    data = SimpleNamespace(family_id=uuid4())

    with pytest.raises(AuthorizationError, match="family owner"):
        await parents.create_parent_profile(
            data=data,
            current_user=SimpleNamespace(id=uuid4()),
            session=AsyncMock(),
        )

    owner_check.assert_awaited_once()


@pytest.mark.asyncio
async def test_submitted_doctor_is_not_self_verified():
    session = MagicMock()

    async def flush():
        submitted = session.add.call_args.args[0]
        submitted.id = uuid4()
        submitted.created_at = datetime.now(timezone.utc)

    session.flush = AsyncMock(side_effect=flush)
    data = SimpleNamespace(
        name="Dr Example",
        specialty="General Medicine",
        hospital_or_clinic="Example Clinic",
        phone_number="1234567890",
        email="doctor@example.com",
        address="Example address",
    )

    await doctors.register_doctor(
        data=data,
        current_user=SimpleNamespace(id=uuid4()),
        session=session,
    )

    submitted = session.add.call_args.args[0]
    assert submitted.is_verified is False

from datetime import UTC, datetime, timedelta

import pytest

from app.core.concurrency import enforce_record_version
from app.core.exceptions import ConflictError, ParentPulseException


def test_matching_record_version_is_accepted():
    current = datetime(2026, 9, 28, 10, 30, tzinfo=UTC)
    enforce_record_version(current, current.isoformat(), None)


def test_stale_record_version_returns_structured_conflict():
    current = datetime(2026, 9, 28, 10, 30, tzinfo=UTC)
    stale = current - timedelta(minutes=5)

    with pytest.raises(ConflictError) as raised:
        enforce_record_version(current, stale.isoformat(), None)

    assert raised.value.status_code == 409
    assert raised.value.details["current_version"] == current.isoformat()


def test_explicit_authenticated_overwrite_accepts_stale_version():
    current = datetime(2026, 9, 28, 10, 30, tzinfo=UTC)
    enforce_record_version(current, (current - timedelta(days=1)).isoformat(), "overwrite")


def test_invalid_record_version_is_rejected():
    with pytest.raises(ParentPulseException) as raised:
        enforce_record_version(datetime.now(UTC), "not-a-version", None)

    assert raised.value.code == "INVALID_RECORD_VERSION"

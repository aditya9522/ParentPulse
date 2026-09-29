from datetime import datetime

from app.core.exceptions import ConflictError, ParentPulseException


def enforce_record_version(
    current_version: datetime,
    expected_version: str | None,
    conflict_resolution: str | None,
) -> None:
    if not expected_version or conflict_resolution == "overwrite":
        return
    try:
        expected = datetime.fromisoformat(expected_version)
    except ValueError as exc:
        raise ParentPulseException(
            code="INVALID_RECORD_VERSION",
            message="The record version is invalid. Reload the latest data and try again.",
            status_code=400,
        ) from exc

    if expected != current_version:
        raise ConflictError(
            "This record changed on another device after you opened it.",
            details={
                "expected_version": expected.isoformat(),
                "current_version": current_version.isoformat(),
                "resolution": "Review the latest server version or explicitly overwrite it.",
            },
        )

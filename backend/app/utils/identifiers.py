# backend/app/utils/identifiers.py
import uuid


def generate_uuid() -> uuid.UUID:
    return uuid.uuid4()


def is_valid_uuid(val: str) -> bool:
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, AttributeError):
        return False

# backend/app/utils/validators.py
import re

PHONE_REGEX = re.compile(r"^\+?[1-9]\d{7,14}$")


def is_valid_phone(phone: str) -> bool:
    cleaned = re.sub(r"[\s\-\(\)]", "", phone)
    return bool(PHONE_REGEX.match(cleaned))


def is_valid_blood_group(bg: str) -> bool:
    valid_groups = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}
    return bg.upper().strip() in valid_groups

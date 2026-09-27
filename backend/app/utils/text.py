# backend/app/utils/text.py
import re


def truncate_text(text: str, max_length: int = 150) -> str:
    if len(text) <= max_length:
        return text
    return text[:max_length].rstrip() + "..."


def clean_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()

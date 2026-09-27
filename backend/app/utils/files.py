# backend/app/utils/files.py
import os
import re

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp", ".heic"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
}


def sanitize_filename(filename: str) -> str:
    base, ext = os.path.splitext(filename)
    clean_base = re.sub(r"[^a-zA-Z0-9_-]", "_", base)
    return f"{clean_base[:50]}{ext.lower()}"


def validate_file_upload(filename: str, mime_type: str, size_bytes: int, max_size_mb: int = 20) -> None:
    _, ext = os.path.splitext(filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File extension '{ext}' is not supported. Allowed: {ALLOWED_EXTENSIONS}")

    if mime_type.lower() not in ALLOWED_MIME_TYPES:
        raise ValueError(f"MIME type '{mime_type}' is not supported.")

    max_bytes = max_size_mb * 1024 * 1024
    if size_bytes > max_bytes:
        raise ValueError(f"File size exceeds maximum allowable limit of {max_size_mb} MB.")

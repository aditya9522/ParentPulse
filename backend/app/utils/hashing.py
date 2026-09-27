# backend/app/utils/hashing.py
import hashlib
import secrets


def hash_string_sha256(val: str) -> str:
    return hashlib.sha256(val.encode("utf-8")).hexdigest()


def generate_secure_token(length: int = 32) -> str:
    return secrets.token_urlsafe(length)

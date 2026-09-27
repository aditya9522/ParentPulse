# backend/app/core/config.py
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ParentPulse API"
    environment: Literal["local", "test", "staging", "production"] = "local"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:8081",
        "http://localhost:19006",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8081",
    ]

    supabase_url: str = "https://mock.supabase.co"
    supabase_publishable_key: SecretStr = SecretStr("sb_publishable_mock")
    supabase_secret_key: SecretStr = SecretStr("sb_secret_mock")
    supabase_jwks_url: str = "https://mock.supabase.co/auth/v1/.well-known/jwks.json"
    supabase_db_url: SecretStr = SecretStr("postgresql+asyncpg://postgres:postgrespassword@localhost:5432/parentpulse")

    upstash_redis_rest_url: str = "https://mock.upstash.io"
    upstash_redis_rest_token: SecretStr = SecretStr("mock_token")

    pinecone_api_key: SecretStr = SecretStr("mock_pinecone_key")
    pinecone_index_name: str = "parentpulse-documents"
    pinecone_namespace: str = "parentpulse"

    gemini_api_key: SecretStr = SecretStr("mock_gemini_key")
    gemini_model: str = "gemini-1.5-pro"
    embedding_model: str = "text-embedding-004"

    google_maps_api_key: SecretStr = SecretStr("mock_maps_key")

    access_token_audience: str = "authenticated"
    request_timeout_seconds: float = 20.0
    cache_default_ttl_seconds: int = 300
    max_upload_size_mb: int = 20

    model_config = SettingsConfigDict(
        env_file=(
            Path(__file__).resolve().parent.parent.parent / ".env",
            ".env",
        ),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()

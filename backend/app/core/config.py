# backend/app/core/config.py
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ParentPulse API"
    environment: Literal["local", "test", "staging", "production"] = "local"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8081",
        "http://localhost:19006",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8081",
    ]

    supabase_url: str = ""
    supabase_publishable_key: SecretStr = SecretStr("")
    supabase_secret_key: SecretStr = SecretStr("")
    supabase_jwks_url: str = ""
    supabase_db_url: SecretStr = SecretStr("postgresql+asyncpg://postgres:postgrespassword@localhost:5432/parentpulse")

    upstash_redis_rest_url: str = ""
    upstash_redis_rest_token: SecretStr = SecretStr("")

    pinecone_api_key: SecretStr = SecretStr("")
    pinecone_index_name: str = "parentpulse-documents"
    pinecone_namespace: str = "parentpulse"

    gemini_api_key: SecretStr = SecretStr("")
    gemini_model: str = "gemini-1.5-pro"
    embedding_model: str = "text-embedding-004"

    google_maps_api_key: SecretStr = SecretStr("")

    access_token_audience: str = "authenticated"
    request_timeout_seconds: float = 20.0
    cache_default_ttl_seconds: int = 300
    max_upload_size_mb: int = 20

    @field_validator("debug", mode="before")
    @classmethod
    def normalize_debug_mode(cls, value: object) -> object:
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"release", "production"}:
                return False
            if normalized in {"debug", "development"}:
                return True
        return value

    @model_validator(mode="after")
    def require_production_providers(self) -> "Settings":
        if self.environment not in {"staging", "production"}:
            return self
        required = {
            "SUPABASE_URL": self.supabase_url,
            "SUPABASE_PUBLISHABLE_KEY": self.supabase_publishable_key.get_secret_value(),
            "SUPABASE_SECRET_KEY": self.supabase_secret_key.get_secret_value(),
            "SUPABASE_JWKS_URL": self.supabase_jwks_url,
            "SUPABASE_DB_URL": self.supabase_db_url.get_secret_value(),
            "GEMINI_API_KEY": self.gemini_api_key.get_secret_value(),
            "PINECONE_API_KEY": self.pinecone_api_key.get_secret_value(),
            "GOOGLE_MAPS_API_KEY": self.google_maps_api_key.get_secret_value(),
        }
        invalid = [name for name, value in required.items() if not value or "mock" in value or "replace_me" in value]
        if invalid:
            raise ValueError(f"Production provider configuration is missing: {', '.join(invalid)}")
        if not self.supabase_url.startswith("https://"):
            raise ValueError("SUPABASE_URL must use HTTPS outside local development")
        return self

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

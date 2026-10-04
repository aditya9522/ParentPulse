# backend/tests/unit/test_config.py
import pytest
from pydantic import SecretStr
from app.core.config import Settings, get_settings


def test_settings_load():
    settings = get_settings()
    assert settings.app_name == "ParentPulse API"
    assert settings.api_v1_prefix == "/api/v1"
    assert settings.cache_default_ttl_seconds > 0


def test_production_env_validation_missing_keys():
    with pytest.raises(ValueError, match="Production provider configuration is missing"):
        Settings(
            environment="production",
            supabase_url="",
            supabase_publishable_key=SecretStr(""),
            supabase_secret_key=SecretStr(""),
        )


def test_production_env_validation_mock_keys():
    with pytest.raises(ValueError, match="Production provider configuration is missing"):
        Settings(
            environment="production",
            supabase_url="https://example.supabase.co",
            supabase_publishable_key=SecretStr("mock_key"),
            supabase_secret_key=SecretStr("secret"),
            supabase_jwks_url="https://example.supabase.co/.well-known/jwks.json",
            supabase_db_url=SecretStr("postgresql+asyncpg://postgres:pass@localhost:5432/db"),
            gemini_api_key=SecretStr("gemini_key"),
            pinecone_api_key=SecretStr("pinecone_key"),
            google_maps_api_key=SecretStr("maps_key"),
        )


def test_production_env_validation_requires_https_supabase():
    with pytest.raises(ValueError, match="SUPABASE_URL must use HTTPS outside local development"):
        Settings(
            environment="production",
            supabase_url="http://example.supabase.co",
            supabase_publishable_key=SecretStr("pub_key_valid"),
            supabase_secret_key=SecretStr("secret_key_valid"),
            supabase_jwks_url="https://example.supabase.co/.well-known/jwks.json",
            supabase_db_url=SecretStr("postgresql+asyncpg://postgres:pass@localhost:5432/db"),
            gemini_api_key=SecretStr("gemini_key"),
            pinecone_api_key=SecretStr("pinecone_key"),
            google_maps_api_key=SecretStr("maps_key"),
        )


def test_production_env_validation_success():
    prod_settings = Settings(
        environment="production",
        supabase_url="https://example.supabase.co",
        supabase_publishable_key=SecretStr("pub_key_12345"),
        supabase_secret_key=SecretStr("secret_key_12345"),
        supabase_jwks_url="https://example.supabase.co/.well-known/jwks.json",
        supabase_db_url=SecretStr("postgresql+asyncpg://postgres:pass@localhost:5432/db"),
        gemini_api_key=SecretStr("gemini_live_key"),
        pinecone_api_key=SecretStr("pinecone_live_key"),
        google_maps_api_key=SecretStr("maps_live_key"),
    )
    assert prod_settings.environment == "production"
    assert prod_settings.supabase_url == "https://example.supabase.co"


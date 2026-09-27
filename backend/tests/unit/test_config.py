# backend/tests/unit/test_config.py
from app.core.config import get_settings


def test_settings_load():
    settings = get_settings()
    assert settings.app_name == "ParentPulse API"
    assert settings.api_v1_prefix == "/api/v1"
    assert settings.cache_default_ttl_seconds > 0

# backend/tests/api/test_health_and_auth.py
import uuid
import pytest
from app.main import app
from app.api.dependencies import get_current_user
from app.models.user import User


@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_admin_health_endpoint(client):
    response = await client.get("/api/v1/admin/health")
    assert response.status_code == 200
    json_data = response.json()
    assert "data" in json_data
    assert json_data["data"]["status"] == "healthy"
    assert "meta" in json_data
    assert "request_id" in json_data["meta"]


@pytest.mark.asyncio
async def test_maps_nearby_mock(client):
    mock_user = User(
        id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
        email="test@example.com",
        full_name="Test User",
        preferred_language="en",
    )
    app.dependency_overrides[get_current_user] = lambda: mock_user
    try:
        response = await client.get(
            "/api/v1/maps/nearby",
            params={"latitude": 28.4595, "longitude": 77.0725, "category": "hospital"},
            headers={"Authorization": "Bearer dev-token-11111111-1111-1111-1111-111111111111"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert len(data["data"]) > 0
        assert "place_id" in data["data"][0]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_ai_chat_endpoint(client, monkeypatch):
    mock_user = User(
        id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
        email="test@example.com",
        full_name="Test User",
        preferred_language="en",
    )
    app.dependency_overrides[get_current_user] = lambda: mock_user

    async def mock_verify(session, user_id, parent_id):
        return None

    from app.api.v1.endpoints import ai as ai_endpoint
    monkeypatch.setattr(ai_endpoint, "verify_parent_access", mock_verify)

    from app.schemas.ai import AIChatResponse
    async def mock_answer(self, parent_id, query):
        return AIChatResponse(answer="Mock response for elder health", citations=[])

    from app.services.rag_service import RAGService
    monkeypatch.setattr(RAGService, "answer_health_query", mock_answer)

    try:
        response = await client.post(
            "/api/v1/ai/chat",
            json={
                "parent_id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
                "query": "What are my father's medications?",
            },
            headers={"Authorization": "Bearer dev-token-11111111-1111-1111-1111-111111111111"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "answer" in data["data"]
        assert "Mock response" in data["data"]["answer"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)



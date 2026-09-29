from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route

from app.middleware import idempotency


@pytest.mark.asyncio
async def test_idempotent_write_fails_closed_when_safety_store_is_unavailable(monkeypatch):
    endpoint_called = False

    async def mutation(_: Request):
        nonlocal endpoint_called
        endpoint_called = True
        return JSONResponse({"data": {"created": True}})

    class BrokenSessionFactory:
        async def __aenter__(self):
            raise RuntimeError("database unavailable")

        async def __aexit__(self, *_):
            return False

    monkeypatch.setattr(
        idempotency,
        "verify_access_token",
        AsyncMock(return_value={"sub": str(uuid4())}),
    )
    monkeypatch.setattr(idempotency, "AsyncSessionFactory", BrokenSessionFactory)

    app = Starlette(routes=[Route("/mutation", mutation, methods=["POST"])])
    app.add_middleware(idempotency.IdempotencyMiddleware)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/mutation",
            json={"value": 1},
            headers={"Authorization": "Bearer signed", "Idempotency-Key": "change-1"},
        )

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "SYNC_SAFETY_UNAVAILABLE"
    assert endpoint_called is False

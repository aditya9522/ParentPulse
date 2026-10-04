from types import SimpleNamespace

import pytest
from pydantic import SecretStr

from app.clients.google_maps import GoogleMapsClient
from app.core.constants import PlaceCategory
from app.core.exceptions import ProviderError


class StubResponse:
    def __init__(self, status_code: int, payload: dict):
        self.status_code = status_code
        self._payload = payload

    def json(self) -> dict:
        return self._payload


class StubAsyncClient:
    def __init__(self, response: StubResponse, request: dict):
        self.response = response
        self.request = request

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return None

    async def post(self, url: str, *, headers: dict | None = None, json: dict | None = None, data: dict | None = None):
        self.request.update(url=url, headers=headers, json=json, data=data)
        return self.response


@pytest.mark.asyncio
async def test_nearby_search_uses_places_api_new(monkeypatch):
    request: dict = {}
    response = StubResponse(
        200,
        {
            "places": [
                {
                    "id": "place-1",
                    "displayName": {"text": "City Hospital"},
                    "formattedAddress": "Main Road",
                    "location": {"latitude": 22.7, "longitude": 75.8},
                    "rating": 4.4,
                    "userRatingCount": 125,
                }
            ]
        },
    )
    monkeypatch.setattr(
        "app.clients.google_maps.httpx.AsyncClient",
        lambda **_kwargs: StubAsyncClient(response, request),
    )
    client = GoogleMapsClient()
    client.settings = SimpleNamespace(google_maps_api_key=SecretStr("valid-test-key"))

    places = await client.search_nearby(22.7, 75.8, PlaceCategory.HOSPITAL, 10_000)

    assert request["url"] == "https://places.googleapis.com/v1/places:searchNearby"
    assert request["json"]["includedTypes"] == ["hospital"]
    assert "places.displayName" in request["headers"]["X-Goog-FieldMask"]
    assert places[0].name == "City Hospital"
    assert places[0].user_ratings_total == 125


@pytest.mark.asyncio
async def test_nearby_search_falls_back_to_osm_when_google_rejected(monkeypatch):
    osm_payload = {
        "elements": [
            {
                "id": 9999,
                "lat": 22.76,
                "lon": 75.87,
                "tags": {
                    "name": "Community Hospital",
                    "amenity": "hospital",
                    "addr:street": "MG Road",
                },
            }
        ]
    }
    calls = []

    class MockAsyncClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def post(self, url: str, **kwargs):
            calls.append(url)
            if "googleapis" in url:
                return StubResponse(403, {"error": {"status": "PERMISSION_DENIED"}})
            return StubResponse(200, osm_payload)

    monkeypatch.setattr(
        "app.clients.google_maps.httpx.AsyncClient",
        lambda **_kwargs: MockAsyncClient(),
    )
    client = GoogleMapsClient()
    client.settings = SimpleNamespace(google_maps_api_key=SecretStr("valid-test-key"))

    places = await client.search_nearby(22.76, 75.87, PlaceCategory.HOSPITAL, 10_000)
    assert len(places) == 1
    assert places[0].name == "Community Hospital"
    assert places[0].place_id.startswith("osm_")

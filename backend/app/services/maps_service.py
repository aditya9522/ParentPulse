# backend/app/services/maps_service.py
from typing import List, Optional
from app.clients.google_maps import google_maps_client
from app.clients.upstash import cache_get, cache_set
from app.schemas.map import PlaceSummary, PlaceCategory, DistanceCalculationResponse, GeocodeResponse


class MapsService:
    @staticmethod
    async def search_nearby(
        latitude: float,
        longitude: float,
        category: PlaceCategory,
        radius_meters: int = 5000,
    ) -> List[PlaceSummary]:
        cache_key = f"maps:nearby:{round(latitude, 3)}:{round(longitude, 3)}:{category.value}:{radius_meters}"
        cached = await cache_get(cache_key)
        if cached:
            return [PlaceSummary(**item) for item in cached]

        places = await google_maps_client.search_nearby(
            latitude=latitude,
            longitude=longitude,
            category=category,
            radius_meters=radius_meters,
        )
        await cache_set(cache_key, [p.model_dump() for p in places], ttl_seconds=600)
        return places

    @staticmethod
    async def get_distance_and_route(
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        mode: str = "driving",
    ) -> DistanceCalculationResponse:
        cache_key = f"maps:route:{round(origin_lat, 3)}_{round(origin_lng, 3)}:{round(dest_lat, 3)}_{round(dest_lng, 3)}:{mode}"
        cached = await cache_get(cache_key)
        if cached:
            return DistanceCalculationResponse(**cached)

        data = await google_maps_client.calculate_distance(origin_lat, origin_lng, dest_lat, dest_lng, mode)
        res = DistanceCalculationResponse(
            distance_meters=data.get("distance_meters", 0),
            distance_text=data.get("distance_text", "0 km"),
            duration_seconds=data.get("duration_seconds", 0),
            duration_text=data.get("duration_text", "0 mins"),
        )
        await cache_set(cache_key, res.model_dump(), ttl_seconds=600)
        return res

    @staticmethod
    async def geocode_address(address: str) -> GeocodeResponse:
        # Geocode mock fallback or client
        return GeocodeResponse(
            formatted_address=address,
            latitude=28.4595,
            longitude=77.0725,
            place_id="geocode_sample_01",
        )

# backend/app/clients/google_maps.py
from typing import Any

import httpx

from app.core.config import get_settings
from app.core.exceptions import ProviderError
from app.core.logging import logger
from app.schemas.map import PlaceCategory, PlaceSummary


class GoogleMapsClient:
    def __init__(self):
        self.settings = get_settings()

    async def search_nearby(
        self,
        latitude: float,
        longitude: float,
        category: PlaceCategory,
        radius_meters: int = 5000,
    ) -> list[PlaceSummary]:
        api_key = self.settings.google_maps_api_key.get_secret_value()

        if api_key and not api_key.startswith("mock") and not api_key.startswith("your-"):
            try:
                url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
                params = {
                    "location": f"{latitude},{longitude}",
                    "radius": radius_meters,
                    "type": self._map_category_to_google_type(category),
                    "key": api_key,
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(url, params=params)
                    data = resp.json()
                    status = data.get("status")
                    if status in ("OK", "ZERO_RESULTS"):
                        results = []
                        for item in data.get("results", []):
                            loc = item.get("geometry", {}).get("location", {})
                            results.append(
                                PlaceSummary(
                                    place_id=item.get("place_id", ""),
                                    name=item.get("name", ""),
                                    category=category,
                                    address=item.get("vicinity", ""),
                                    latitude=loc.get("lat", latitude),
                                    longitude=loc.get("lng", longitude),
                                    rating=item.get("rating"),
                                    user_ratings_total=item.get("user_ratings_total"),
                                    is_open_now=item.get("opening_hours", {}).get("open_now"),
                                )
                            )
                        return results
                    else:
                        logger.warning(f"Google Maps Places status: {status}, error: {data.get('error_message')}")
            except Exception as exc:
                logger.error(f"Error querying Google Maps API: {exc}")
                raise ProviderError("Google Maps", "Nearby healthcare search is temporarily unavailable.") from exc
        raise ProviderError("Google Maps", "Nearby healthcare search is not configured.")

    async def calculate_distance(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        mode: str = "driving",
    ) -> dict[str, Any]:
        api_key = self.settings.google_maps_api_key.get_secret_value()
        if api_key and not api_key.startswith("mock") and not api_key.startswith("your-"):
            try:
                url = "https://maps.googleapis.com/maps/api/distancematrix/json"
                params = {
                    "origins": f"{origin_lat},{origin_lng}",
                    "destinations": f"{dest_lat},{dest_lng}",
                    "mode": mode,
                    "key": api_key,
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(url, params=params)
                    data = resp.json()
                    if data.get("status") == "OK":
                        rows = data.get("rows", [{}])
                        if rows:
                            elem = rows[0].get("elements", [{}])[0]
                            if elem.get("status") == "OK":
                                return {
                                    "distance_meters": elem.get("distance", {}).get("value", 0),
                                    "distance_text": elem.get("distance", {}).get("text", "Unknown"),
                                    "duration_seconds": elem.get("duration", {}).get("value", 0),
                                    "duration_text": elem.get("duration", {}).get("text", "Unknown"),
                                }
            except Exception as exc:
                logger.error(f"Google Maps Distance Matrix error: {exc}")
                raise ProviderError("Google Maps", "Route calculation is temporarily unavailable.") from exc
        raise ProviderError("Google Maps", "Route calculation is not configured.")

    async def geocode(self, address: str) -> dict[str, Any]:
        api_key = self.settings.google_maps_api_key.get_secret_value()
        if not api_key or api_key.startswith(("mock", "your-")):
            raise ProviderError("Google Maps", "Address search is not configured.")
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get("https://maps.googleapis.com/maps/api/geocode/json", params={"address": address, "key": api_key})
                response.raise_for_status()
                data = response.json()
            if data.get("status") != "OK" or not data.get("results"):
                raise ProviderError("Google Maps", "No matching address was found.")
            result = data["results"][0]
            location = result["geometry"]["location"]
            return {"formatted_address": result["formatted_address"], "latitude": location["lat"], "longitude": location["lng"], "place_id": result["place_id"]}
        except ProviderError:
            raise
        except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
            logger.error(f"Google Maps geocoding error: {exc}")
            raise ProviderError("Google Maps", "Address search is temporarily unavailable.") from exc

    def _map_category_to_google_type(self, category: PlaceCategory) -> str:
        mapping = {
            PlaceCategory.HOSPITAL: "hospital",
            PlaceCategory.PHARMACY: "pharmacy",
            PlaceCategory.DOCTOR: "doctor",
            PlaceCategory.CLINIC: "health",
            PlaceCategory.LABORATORY: "health",
            PlaceCategory.EMERGENCY: "hospital",
        }
        return mapping.get(category, "health")



google_maps_client = GoogleMapsClient()

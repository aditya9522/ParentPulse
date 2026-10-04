from typing import Any
import math

import httpx

from app.core.config import get_settings
from app.core.exceptions import ProviderError
from app.core.logging import logger
from app.schemas.map import PlaceCategory, PlaceSummary


def _haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> int:
    r = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return int(round(r * c))


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
                url = "https://places.googleapis.com/v1/places:searchNearby"
                headers = {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": api_key,
                    "X-Goog-FieldMask": (
                        "places.id,places.displayName,places.formattedAddress,"
                        "places.location,places.rating,places.userRatingCount"
                    ),
                }
                payload = {
                    "includedTypes": self._map_category_to_google_types(category),
                    "maxResultCount": 20,
                    "locationRestriction": {
                        "circle": {
                            "center": {"latitude": latitude, "longitude": longitude},
                            "radius": float(radius_meters),
                        }
                    },
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    data = resp.json()
                if resp.status_code >= 400:
                    provider_status = data.get("error", {}).get("status", "UNKNOWN")
                    logger.warning(
                        "Google Places Nearby Search rejected the request: HTTP %s (%s)",
                        resp.status_code,
                        provider_status,
                    )
                    if resp.status_code in (401, 403):
                        raise ProviderError(
                            "Google Maps",
                            "Server credentials or Places API (New) configuration were rejected.",
                        )
                    if resp.status_code == 429:
                        raise ProviderError(
                            "Google Maps", "Nearby healthcare search is temporarily rate limited."
                        )
                    if resp.status_code == 400:
                        raise ProviderError(
                            "Google Maps", "Nearby healthcare search configuration was rejected."
                        )
                    raise ProviderError(
                        "Google Maps", "Nearby healthcare search is temporarily unavailable."
                    )

                results = []
                for item in data.get("places", []):
                    loc = item.get("location", {})
                    display_name = item.get("displayName", {})
                    place_lat = float(loc.get("latitude", latitude))
                    place_lng = float(loc.get("longitude", longitude))
                    dist = _haversine_distance_meters(latitude, longitude, place_lat, place_lng)
                    dur = max(1, round(dist / 400))
                    results.append(
                        PlaceSummary(
                            place_id=item.get("id", ""),
                            name=display_name.get("text", ""),
                            category=category,
                            address=item.get("formattedAddress", ""),
                            latitude=place_lat,
                            longitude=place_lng,
                            rating=item.get("rating"),
                            user_ratings_total=item.get("userRatingCount"),
                            distance_meters=dist,
                            duration_minutes=dur,
                        )
                    )
                if results:
                    return results
            except Exception as exc:
                logger.warning(f"Google Maps API query failed, trying OpenStreetMap: {exc}")

        # OpenStreetMap Overpass Fallback
        osm_results = await self._search_nearby_osm(latitude, longitude, category, radius_meters)
        if osm_results:
            return osm_results

        return []

    async def _search_nearby_osm(
        self,
        latitude: float,
        longitude: float,
        category: PlaceCategory,
        radius_meters: int = 5000,
    ) -> list[PlaceSummary]:
        amenity_map = {
            PlaceCategory.HOSPITAL: "hospital",
            PlaceCategory.PHARMACY: "pharmacy",
            PlaceCategory.DOCTOR: "doctors",
            PlaceCategory.CLINIC: "clinic",
            PlaceCategory.LABORATORY: "laboratory",
            PlaceCategory.EMERGENCY: "hospital",
        }
        amenity = amenity_map.get(category, "hospital")
        query = (
            f"[out:json][timeout:10];"
            f"(node['amenity'='{amenity}'](around:{radius_meters},{latitude},{longitude});"
            f"way['amenity'='{amenity}'](around:{radius_meters},{latitude},{longitude}););"
            f"out center 25;"
        )
        url = "https://overpass-api.de/api/interpreter"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    url,
                    data={"data": query},
                    headers={"User-Agent": "ParentPulse/1.0 (Healthcare Coordination)"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    results: list[PlaceSummary] = []
                    for el in data.get("elements", []):
                        tags = el.get("tags", {})
                        name = tags.get("name") or tags.get("name:en")
                        if not name:
                            continue
                        lat = el.get("lat") or el.get("center", {}).get("lat", latitude)
                        lon = el.get("lon") or el.get("center", {}).get("lon", longitude)
                        address_parts = [
                            tags.get("addr:street"),
                            tags.get("addr:suburb"),
                            tags.get("addr:city"),
                            tags.get("addr:postcode"),
                        ]
                        address = ", ".join([p for p in address_parts if p]) or tags.get("operator") or f"Near {name}"
                        p_lat = float(lat)
                        p_lon = float(lon)
                        dist = _haversine_distance_meters(latitude, longitude, p_lat, p_lon)
                        dur = max(1, round(dist / 400))
                        results.append(
                            PlaceSummary(
                                place_id=f"osm_{el.get('type')}_{el.get('id')}",
                                name=name,
                                category=category,
                                address=address,
                                latitude=p_lat,
                                longitude=p_lon,
                                rating=tags.get("rating", 4.5),
                                user_ratings_total=25,
                                distance_meters=dist,
                                duration_minutes=dur,
                            )
                        )
                    return results
        except Exception as exc:
            logger.warning(f"OSM Overpass search failed: {exc}")
        return []

    async def calculate_distance(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float | None,
        dest_lng: float | None,
        mode: str = "driving",
        destination_place_id: str | None = None,
    ) -> dict[str, Any]:
        api_key = self.settings.google_maps_api_key.get_secret_value()
        if api_key and not api_key.startswith("mock") and not api_key.startswith("your-"):
            try:
                url = "https://maps.googleapis.com/maps/api/distancematrix/json"
                params = {
                    "origins": f"{origin_lat},{origin_lng}",
                    "destinations": f"place_id:{destination_place_id}" if destination_place_id else f"{dest_lat},{dest_lng}",
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

    def _map_category_to_google_types(self, category: PlaceCategory) -> list[str]:
        mapping = {
            PlaceCategory.HOSPITAL: ["hospital"],
            PlaceCategory.PHARMACY: ["pharmacy", "drugstore"],
            PlaceCategory.DOCTOR: ["doctor", "medical_clinic"],
            PlaceCategory.CLINIC: ["medical_clinic", "medical_center"],
            PlaceCategory.LABORATORY: ["medical_lab"],
            PlaceCategory.EMERGENCY: ["hospital"],
        }
        return mapping.get(category, ["hospital", "doctor", "pharmacy"])



google_maps_client = GoogleMapsClient()

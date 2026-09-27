# backend/app/schemas/map.py
from typing import Optional, List
from pydantic import BaseModel
from app.core.constants import PlaceCategory


class NearbyPlacesQuery(BaseModel):
    latitude: float
    longitude: float
    category: PlaceCategory
    radius_meters: int = 5000
    page_token: Optional[str] = None


class PlaceSummary(BaseModel):
    place_id: str
    name: str
    category: PlaceCategory
    address: str
    latitude: float
    longitude: float
    phone_number: Optional[str] = None
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None
    is_open_now: Optional[bool] = None
    distance_meters: Optional[int] = None
    duration_minutes: Optional[int] = None


class DistanceCalculationRequest(BaseModel):
    origin_latitude: float
    origin_longitude: float
    destination_place_id: Optional[str] = None
    destination_latitude: Optional[float] = None
    destination_longitude: Optional[float] = None
    mode: str = "driving"  # driving, walking, transit


class DistanceCalculationResponse(BaseModel):
    distance_meters: int
    distance_text: str
    duration_seconds: int
    duration_text: str


class GeocodeRequest(BaseModel):
    address: str


class GeocodeResponse(BaseModel):
    formatted_address: str
    latitude: float
    longitude: float
    place_id: str

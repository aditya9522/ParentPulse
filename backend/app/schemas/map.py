# backend/app/schemas/map.py
from typing import Literal, Optional
from pydantic import BaseModel, Field, model_validator
from app.core.constants import PlaceCategory


class NearbyPlacesQuery(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    category: PlaceCategory
    radius_meters: int = Field(default=5000, ge=100, le=50000)
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
    origin_latitude: float = Field(ge=-90, le=90)
    origin_longitude: float = Field(ge=-180, le=180)
    destination_place_id: Optional[str] = None
    destination_latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    destination_longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    mode: Literal["driving", "walking", "transit"] = "driving"

    @model_validator(mode="after")
    def require_destination(self):
        has_place = bool(self.destination_place_id and self.destination_place_id.strip())
        has_latitude = self.destination_latitude is not None
        has_longitude = self.destination_longitude is not None
        if has_latitude != has_longitude:
            raise ValueError("Destination latitude and longitude must be provided together.")
        if not has_place and not (has_latitude and has_longitude):
            raise ValueError("Provide a destination place ID or destination coordinates.")
        return self


class DistanceCalculationResponse(BaseModel):
    distance_meters: int
    distance_text: str
    duration_seconds: int
    duration_text: str


class GeocodeRequest(BaseModel):
    address: str = Field(min_length=3, max_length=500)


class GeocodeResponse(BaseModel):
    formatted_address: str
    latitude: float
    longitude: float
    place_id: str

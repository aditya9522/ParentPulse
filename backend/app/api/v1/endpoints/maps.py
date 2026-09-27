# backend/app/api/v1/endpoints/maps.py
from typing import List
from fastapi import APIRouter, Depends, Query
from app.api.dependencies import get_current_user, get_optional_current_user
from app.models.user import User
from app.schemas.map import (
    PlaceSummary,
    PlaceCategory,
    DistanceCalculationRequest,
    DistanceCalculationResponse,
    GeocodeRequest,
    GeocodeResponse,
)
from app.schemas.common import ApiResponse
from app.helpers.response_builder import build_response
from app.services.maps_service import MapsService

router = APIRouter(prefix="/maps", tags=["Google Maps & Nearby Healthcare"])


@router.get("/nearby", response_model=ApiResponse[List[PlaceSummary]])
async def search_nearby_healthcare(
    latitude: float = Query(..., description="Latitude of search center"),
    longitude: float = Query(..., description="Longitude of search center"),
    category: PlaceCategory = Query(PlaceCategory.HOSPITAL, description="Category of healthcare place"),
    radius_meters: int = Query(5000, le=50000, description="Search radius in meters"),
    current_user: User | None = Depends(get_optional_current_user),
):
    places = await MapsService.search_nearby(latitude, longitude, category, radius_meters)
    return build_response(places)


@router.post("/distance", response_model=ApiResponse[DistanceCalculationResponse])
async def calculate_distance(
    data: DistanceCalculationRequest,
    current_user: User | None = Depends(get_optional_current_user),
):
    dest_lat = data.destination_latitude or 28.4595
    dest_lng = data.destination_longitude or 77.0725
    result = await MapsService.get_distance_and_route(
        data.origin_latitude,
        data.origin_longitude,
        dest_lat,
        dest_lng,
        data.mode,
    )
    return build_response(result)


@router.post("/geocode", response_model=ApiResponse[GeocodeResponse])
async def geocode_address(
    data: GeocodeRequest,
    current_user: User = Depends(get_current_user),
):
    result = await MapsService.geocode_address(data.address)
    return build_response(result)

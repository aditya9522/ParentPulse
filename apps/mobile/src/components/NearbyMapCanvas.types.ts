import type { CameraRef } from "@maplibre/maplibre-react-native";
import type { RefObject } from "react";
import type { HealthcarePlace } from "../types";

export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

export interface NearbyMapCanvasProps {
  isHindi: boolean;
  unavailableReason?: "expo-go" | "native-error";
  cameraRef: RefObject<CameraRef | null>;
  mapInstance: number;
  center: MapCoordinate;
  zoom: number;
  parentLocation?: MapCoordinate;
  deviceLocation?: MapCoordinate;
  places: HealthcarePlace[];
  markerColor: string;
  selectedPlaceId: string | null;
  onSelectPlace: (place: HealthcarePlace) => void;
  onRegionDidChange: (center: [number, number], zoom: number, userInteraction: boolean) => void;
  onMapReady: () => void;
  onMapError: () => void;
  onPressBlank: () => void;
  onOpenExternalMap: () => void;
}

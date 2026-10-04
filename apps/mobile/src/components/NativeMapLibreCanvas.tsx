import React from "react";
import { Text, View } from "react-native";
import { Camera, Map as MapLibreMap, Marker } from "@maplibre/maplibre-react-native";
import { MapPin } from "lucide-react-native";
import { Colors, Shadows } from "../theme";
import type { NearbyMapCanvasProps } from "./NearbyMapCanvas.types";

const DEFAULT_MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const MAP_STYLE_URL = process.env.EXPO_PUBLIC_MAP_STYLE_URL?.trim() || DEFAULT_MAP_STYLE_URL;

const NativeMapLibreCanvas: React.FC<NearbyMapCanvasProps> = ({
  cameraRef,
  mapInstance,
  center,
  zoom,
  parentLocation,
  deviceLocation,
  places,
  markerColor,
  selectedPlaceId,
  onSelectPlace,
  onRegionDidChange,
  onMapReady,
  onMapError,
  onPressBlank,
}) => (
  <MapLibreMap
    key={mapInstance}
    style={{ flex: 1 }}
    mapStyle={MAP_STYLE_URL}
    androidView="texture"
    attribution
    attributionPosition={{ top: 8, right: 8 }}
    onDidFinishLoadingMap={onMapReady}
    onDidFinishLoadingStyle={onMapReady}
    onDidFinishRenderingMapFully={onMapReady}
    onDidFailLoadingMap={onMapError}
    onRegionDidChange={(event) => {
      const { center: nextCenter, zoom: nextZoom, userInteraction } = event.nativeEvent;
      onRegionDidChange(nextCenter, nextZoom, userInteraction);
    }}
    onPress={onPressBlank}
  >
    <Camera
      ref={cameraRef}
      initialViewState={{ center: [center.longitude, center.latitude], zoom }}
      minZoom={3}
      maxZoom={20}
    />
    {parentLocation && (
      <Marker
        id="parent-location"
        lngLat={[parentLocation.longitude, parentLocation.latitude]}
        anchor="bottom"
      >
        <View style={styles.parentMarker}>
          <Text style={styles.parentMarkerText}>P</Text>
        </View>
      </Marker>
    )}
    {deviceLocation && (
      <Marker
        id="current-location"
        lngLat={[deviceLocation.longitude, deviceLocation.latitude]}
        anchor="center"
      >
        <View style={styles.currentLocationMarker}>
          <View style={styles.currentLocationMarkerCore} />
        </View>
      </Marker>
    )}
    {places.map((place) => {
      const markerId = place.place_id || `${place.name}:${place.latitude}:${place.longitude}`;
      return (
        <Marker
          key={markerId}
          id={markerId}
          lngLat={[place.longitude, place.latitude]}
          anchor="bottom"
          onPress={() => onSelectPlace(place)}
        >
          <View style={[styles.placeMarker, selectedPlaceId === place.place_id && styles.placeMarkerSelected]}>
            <MapPin size={17} color="#FFFFFF" fill={markerColor} />
          </View>
        </Marker>
      );
    })}
  </MapLibreMap>
);

export default NativeMapLibreCanvas;

const styles = {
  parentMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: Colors.emergency,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    ...Shadows.card,
  },
  parentMarkerText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800" as const,
  },
  currentLocationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(37, 99, 235, 0.2)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  currentLocationMarkerCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#2563EB",
  },
  placeMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    ...Shadows.card,
  },
  placeMarkerSelected: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 1.08 }],
  },
};

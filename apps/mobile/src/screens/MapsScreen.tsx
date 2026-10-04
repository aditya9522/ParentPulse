// apps/mobile/src/screens/MapsScreen.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator,
  Animated,
  PanResponder,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppAlert as Alert } from "../services/appAlert";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import {
  Hospital,
  Pill,
  FlaskConical,
  Stethoscope,
  MapPin,
  Navigation,
  Clock,
  Star,
  CheckCircle2,
  LocateFixed,
  Compass,
  ArrowUpRight,
  History,
  ZoomIn,
  ZoomOut,
  ChevronUp,
  SlidersHorizontal,
  Search,
  Check,
  X,
  RefreshCw,
  Trash2,
} from "lucide-react-native";
import type { CameraRef } from "@maplibre/maplibre-react-native";
import { NearbyMapCanvas } from "../components/NearbyMapCanvas";
import { useApp } from "../context/AppContext";
import { HealthcarePlace, PlaceCategory, LocationVisit } from "../types";
import { Colors, Typography, Spacing, Shadows, Glass, BorderRadius, createThemedStyles } from "../theme";
import { GlassView } from "../components/GlassView";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { apiClient } from "../api/client";
import { isExpoGo } from "../services/runtimeEnvironment";

function computeHaversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const MapsScreen: React.FC = () => {

  const { activeParent, visits, recordNewVisit, deleteVisit, userLocation, seniorMode, language } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory>("hospital");
  const [viewMode, setViewMode] = useState<"nearby" | "visits">("nearby");
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(10);
  const [visitToDelete, setVisitToDelete] = useState<LocationVisit | null>(null);

  const initialLat = userLocation?.latitude ?? activeParent.latitude ?? 20.5937;
  const initialLng = userLocation?.longitude ?? activeParent.longitude ?? 78.9629;
  const [centerCoords, setCenterCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [manualSearchLocation, setManualSearchLocation] = useState<{
    parentId: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [lastLocatedCoordinates, setLastLocatedCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [zoom, setZoom] = useState<number>(14);
  const cameraRef = useRef<CameraRef>(null);
  const currentParentIdRef = useRef(activeParent.id);
  const hasManuallyMovedMapRef = useRef(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);
  const [mapInstance, setMapInstance] = useState(0);
  const [unsearchedMapParentId, setUnsearchedMapParentId] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<HealthcarePlace[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [searchRequestId, setSearchRequestId] = useState(0);

  const insets = useSafeAreaInsets();
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);

  // 3-Tier Drawer state: "expanded" (78%) | "half" (46%) | "collapsed" (docked pill)
  const [sheetState, setSheetState] = useState<"expanded" | "half" | "collapsed">("half");
  const sheetStateRef = useRef<"expanded" | "half" | "collapsed">("half");
  sheetStateRef.current = sheetState;

  // Bidirectional swipe animation for top notch and drawer
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onMoveShouldSetPanResponderCapture: (_, gs) => Math.abs(gs.dy) > 8 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => {
        // Upward gestures change the drawer's snap point; they must not drag the
        // entire surface beyond the top edge while it is being expanded.
        sheetTranslateY.setValue(Math.max(0, gs.dy));
      },
      onPanResponderRelease: (_, gs) => {
        const current = sheetStateRef.current;
        if (gs.dy < -40 || gs.vy < -0.35) {
          // Swiping UP: expands half -> expanded
          try {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch { }
          Animated.spring(sheetTranslateY, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }).start();
          if (current === "half" || current === "collapsed") {
            setSheetState("expanded");
          }
        } else if (gs.dy > 40 || gs.vy > 0.35) {
          // Swiping DOWN: shrinks expanded -> half, or half -> collapsed
          try {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch { }
          if (current === "expanded") {
            Animated.spring(sheetTranslateY, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }).start();
            setSheetState("half");
          } else {
            Animated.timing(sheetTranslateY, {
              toValue: 400,
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              setSheetState("collapsed");
              sheetTranslateY.setValue(0);
            });
          }
        } else {
          // Snap back
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            friction: 7,
            tension: 50,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const isHindi = language === "hi";

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(style);
      }
    } catch { }
  };

  const categories = [
    {
      id: "hospital" as PlaceCategory,
      label: "Hospitals",
      hindiLabel: "अस्पताल",
      icon: Hospital,
      color: Colors.emergency,
      bg: "#FEE2E2",
    },
    {
      id: "pharmacy" as PlaceCategory,
      label: "Pharmacies",
      hindiLabel: "दवा की दुकानें",
      icon: Pill,
      color: Colors.primary,
      bg: Colors.primaryLight,
    },
    {
      id: "laboratory" as PlaceCategory,
      label: "Diagnostic Labs",
      hindiLabel: "जांच प्रयोगशालाएं",
      icon: FlaskConical,
      color: "#7C3AED",
      bg: "#F3E8FF",
    },
    {
      id: "doctor" as PlaceCategory,
      label: "Specialist Clinics",
      hindiLabel: "विशेषज्ञ क्लिनिक",
      icon: Stethoscope,
      color: "#0284C7",
      bg: "#E0F2FE",
    },
  ];

  const activeCat = categories.find((c) => c.id === selectedCategory) || categories[0];
  const ActiveCategoryIcon = activeCat.icon;

  useEffect(() => {
    const latitude = userLocation?.latitude ?? activeParent.latitude;
    const longitude = userLocation?.longitude ?? activeParent.longitude;
    if (latitude == null || longitude == null) return;
    const parentChanged = currentParentIdRef.current !== activeParent.id;
    currentParentIdRef.current = activeParent.id;
    if (parentChanged) hasManuallyMovedMapRef.current = false;
    if (hasManuallyMovedMapRef.current && !parentChanged) return;
    cameraRef.current?.easeTo({ center: [longitude, latitude], zoom: 14, duration: 500 });
  }, [activeParent.id, activeParent.latitude, activeParent.longitude, userLocation?.latitude, userLocation?.longitude]);

  const searchCenter = manualSearchLocation?.parentId === activeParent.id
    ? { lat: manualSearchLocation.latitude, lng: manualSearchLocation.longitude }
    : {
      lat: userLocation?.latitude ?? activeParent.latitude ?? initialLat,
      lng: userLocation?.longitude ?? activeParent.longitude ?? initialLng,
    };
  const hasSearchCoordinates = manualSearchLocation?.parentId === activeParent.id ||
    ((userLocation?.latitude ?? activeParent.latitude) != null &&
      (userLocation?.longitude ?? activeParent.longitude) != null);
  const currentPlacesLoading = hasSearchCoordinates && placesLoading;

  useEffect(() => {
    if (!hasSearchCoordinates) return;
    let active = true;
    const timer = setTimeout(() => {
      if (!active) return;
      setPlacesLoading(true);
      setPlacesError(null);
      void apiClient.getNearbyHealthcare(searchCenter.lat, searchCenter.lng, selectedCategory, maxDistanceKm * 1000)
        .then((places) => { if (active) setNearbyPlaces(places); })
        .catch((error) => { if (active) { setNearbyPlaces([]); setPlacesError(error instanceof Error ? error.message : "Nearby search is unavailable."); } })
        .finally(() => { if (active) setPlacesLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [hasSearchCoordinates, maxDistanceKm, searchCenter.lat, searchCenter.lng, searchRequestId, selectedCategory]);

  const currentPlaces = hasSearchCoordinates ? nearbyPlaces : [];
  const currentPlacesError = hasSearchCoordinates ? placesError : "Enable location access or add coordinates to the parent profile.";

  const handleLocateMe = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const nextCenter = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setLastLocatedCoordinates({ latitude: nextCenter.lat, longitude: nextCenter.lng });
        setManualSearchLocation({ parentId: activeParent.id, latitude: nextCenter.lat, longitude: nextCenter.lng });
        setCenterCoords(nextCenter);
        hasManuallyMovedMapRef.current = false;
        setUnsearchedMapParentId(null);
        setZoom(15);
        cameraRef.current?.easeTo({ center: [nextCenter.lng, nextCenter.lat], zoom: 15, duration: 650 });
      } else {
        Alert.alert("Location permission needed", "Allow location access to find healthcare near you, or add a location to the parent profile.");
      }
    } catch (error) {
      Alert.alert("Couldn’t get your location", error instanceof Error ? error.message : "Try again or add a location to the parent profile.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleZoom = (delta: number) => {
    triggerHaptic();
    const nextZoom = Math.max(3, Math.min(20, zoom + delta));
    setZoom(nextZoom);
    cameraRef.current?.zoomTo(nextZoom, { duration: 250 });
  };

  const handleSelectPlaceOnMap = (place: HealthcarePlace) => {
    triggerHaptic();
    setSelectedPlaceId(place.place_id);
    const nextCenter = { lat: place.latitude, lng: place.longitude };
    setCenterCoords(nextCenter);
    setZoom(16);
    cameraRef.current?.easeTo({ center: [nextCenter.lng, nextCenter.lat], zoom: 16, duration: 500 });
  };

  const openGoogleDirections = (place: HealthcarePlace) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
    void Linking.openURL(url).catch(() => Alert.alert("Couldn’t open directions", "Check that a browser or maps app is available."));
  };

  const searchThisArea = () => {
    triggerHaptic();
    setManualSearchLocation({ parentId: activeParent.id, latitude: centerCoords.lat, longitude: centerCoords.lng });
    setUnsearchedMapParentId(null);
    setSearchRequestId((current) => current + 1);
  };

  const openMapInBrowser = () => {
    const url = `https://www.openstreetmap.org/?mlat=${centerCoords.lat}&mlon=${centerCoords.lng}#map=${Math.round(zoom)}/${centerCoords.lat}/${centerCoords.lng}`;
    void Linking.openURL(url).catch(() => Alert.alert("Couldn’t open map", "Try again or use the nearby places list."));
  };

  const handleCheckInVisit = (place: HealthcarePlace) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    recordNewVisit(place.name, place.category, place.address);
    Alert.alert(
      isHindi ? "📍 विज़िट दर्ज की गई!" : "📍 Visit Confirmed!",
      isHindi
        ? `${activeParent.full_name} के लिए ${place.name} की विज़िट दर्ज की गई और फ़ैमिली टाइमलाइन में सिंक हो गई।`
        : `Recorded healthcare visit to ${place.name} for ${activeParent.full_name}. Synced to family timeline and map history.`
    );
  };

  const currentDeviceCoordinates = userLocation ?? lastLocatedCoordinates;
  const hasInteractiveNativeMap = Platform.OS !== "web" && !isExpoGo;

  useEffect(() => {
    if (!hasInteractiveNativeMap || viewMode !== "nearby" || mapReady || mapLoadError) return;
    const timeout = setTimeout(() => setMapLoadError(true), 15000);
    return () => clearTimeout(timeout);
  }, [hasInteractiveNativeMap, mapInstance, mapLoadError, mapReady, viewMode]);

  return (
    <View style={styles.container}>
      {/* View Switcher: Nearby Discovery vs Parent Visit History */}
      <View style={styles.viewToggleContainer}>
        <View style={styles.viewToggleRow}>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === "nearby" && styles.viewToggleBtnActive]}
            onPress={() => {
              triggerHaptic();
              setViewMode("nearby");
            }}
            activeOpacity={0.85}
          >
            <Compass
              size={15}
              color={viewMode === "nearby" ? Colors.primaryDark : Colors.textMuted}
            />
            <Text style={[styles.viewToggleText, viewMode === "nearby" && styles.viewToggleTextActive]}>
              {isHindi ? "आसपास की स्वास्थ्य सेवाएं" : "Nearby Healthcare"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === "visits" && styles.viewToggleBtnActive]}
            onPress={() => {
              triggerHaptic();
              setViewMode("visits");
            }}
            activeOpacity={0.85}
          >
            <History
              size={15}
              color={viewMode === "visits" ? Colors.primaryDark : Colors.textMuted}
            />
            <Text style={[styles.viewToggleText, viewMode === "visits" && styles.viewToggleTextActive]}>
              {isHindi ? `विज़िट इतिहास (${visits.length})` : `Visit Log (${visits.length})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === "nearby" ? (
        <View style={styles.fullScreenMapWrapper}>
          <NearbyMapCanvas
            isHindi={isHindi}
            cameraRef={cameraRef}
            mapInstance={mapInstance}
            center={{ latitude: initialLat, longitude: initialLng }}
            zoom={zoom}
            parentLocation={activeParent.latitude != null && activeParent.longitude != null
              ? { latitude: activeParent.latitude, longitude: activeParent.longitude }
              : undefined}
            deviceLocation={currentDeviceCoordinates ?? undefined}
            places={currentPlaces}
            markerColor={activeCat.color}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={handleSelectPlaceOnMap}
            onRegionDidChange={(center, nextZoom, userInteraction) => {
              setCenterCoords({ lat: center[1], lng: center[0] });
              setZoom(nextZoom);
              if (userInteraction) {
                hasManuallyMovedMapRef.current = true;
                setUnsearchedMapParentId(activeParent.id);
              }
            }}
            onMapReady={() => {
              setMapReady(true);
              setMapLoadError(false);
            }}
            onMapError={() => {
              setMapReady(false);
              setMapLoadError(true);
            }}
            onPressBlank={() => setSelectedPlaceId(null)}
            onOpenExternalMap={openMapInBrowser}
          />

          {hasInteractiveNativeMap && !mapReady && !mapLoadError && (
            <View style={styles.mapStatusBadge} pointerEvents="none">
              <ActivityIndicator color={Colors.primary} size="small" />
              <Text style={styles.mapStatusText}>{isHindi ? "मानचित्र लोड हो रहा है…" : "Loading map…"}</Text>
            </View>
          )}
          {hasInteractiveNativeMap && mapLoadError && (
            <View style={styles.mapFailureCard}>
              <Text style={styles.mapFailureTitle}>{isHindi ? "मानचित्र लोड नहीं हो सका" : "Map tiles couldn’t load"}</Text>
              <Text style={styles.mapFailureText}>
                {isHindi
                  ? "इंटरनेट कनेक्शन जांचें और फिर प्रयास करें। आस-पास के केंद्र सूची में उपलब्ध हैं।"
                  : "Check your connection and try again. Nearby places remain available in the list."}
              </Text>
              <TouchableOpacity
                style={styles.mapRetryButton}
                onPress={() => {
                  setMapLoadError(false);
                  setMapReady(false);
                  setMapInstance((current) => current + 1);
                }}
                activeOpacity={0.85}
              >
                <RefreshCw size={15} color="#FFFFFF" />
                <Text style={styles.mapRetryButtonText}>{isHindi ? "फिर प्रयास करें" : "Retry map"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mapExternalButton}
                onPress={openMapInBrowser}
                activeOpacity={0.85}
              >
                <ArrowUpRight size={15} color={Colors.primaryDark} />
                <Text style={styles.mapExternalButtonText}>
                  {isHindi ? "बाहरी मानचित्र खोलें" : "Open external map"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Floating Top Layer: Single Applied Filter Pill */}
          <View style={styles.floatingTopLayer} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.appliedFilterPill}
              onPress={() => {
                triggerHaptic();
                setFilterMenuVisible(true);
              }}
              activeOpacity={0.85}
              accessibilityLabel="Change nearby healthcare filter"
            >
              <GlassView variant="pill" style={styles.appliedFilterGlass}>
                <View style={styles.appliedFilterInner}>
                  <View style={[styles.appliedFilterIconCircle, { backgroundColor: activeCat.color }]}>
                    <ActiveCategoryIcon size={13} color="#FFFFFF" />
                  </View>
                  <Text style={styles.appliedFilterTitle}>
                    {isHindi ? activeCat.hindiLabel : activeCat.label}
                  </Text>
                  <View style={styles.appliedFilterDot} />
                  <Text style={styles.appliedFilterRadius}>
                    {"< " + maxDistanceKm + " km"}
                  </Text>
                  <SlidersHorizontal size={12} color={Colors.primaryDark} style={{ marginLeft: 2 }} />
                </View>
              </GlassView>
            </TouchableOpacity>
          </View>

          {hasInteractiveNativeMap && unsearchedMapParentId === activeParent.id && hasSearchCoordinates && (
            <TouchableOpacity style={styles.searchThisAreaButton} onPress={searchThisArea} activeOpacity={0.88}>
              {currentPlacesLoading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Search size={15} color="#FFFFFF" />}
              <Text style={styles.searchThisAreaText}>
                {currentPlacesLoading
                  ? (isHindi ? "आस-पास खोज रहे हैं…" : "Searching nearby…")
                  : (isHindi ? "इस क्षेत्र में खोजें" : "Search this area")}
              </Text>
            </TouchableOpacity>
          )}

          {/* Interactive map controls */}
          {hasInteractiveNativeMap && <View style={styles.mapControlsDock}>
            <TouchableOpacity
              style={[styles.mapCtrlBtn, styles.mapCtrlBtnFilter]}
              onPress={() => {
                triggerHaptic();
                setFilterMenuVisible(true);
              }}
              activeOpacity={0.8}
              accessibilityLabel="Nearby healthcare filters"
            >
              <SlidersHorizontal size={18} color={Colors.primaryDark} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.mapCtrlBtn} onPress={() => handleZoom(1)} activeOpacity={0.8}>
              <ZoomIn size={18} color={Colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.mapCtrlBtn} onPress={() => handleZoom(-1)} activeOpacity={0.8}>
              <ZoomOut size={18} color={Colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.mapCtrlBtn} onPress={handleLocateMe} activeOpacity={0.8}>
              {isLocating ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <LocateFixed size={18} color={Colors.primaryDark} />
              )}
            </TouchableOpacity>
          </View>}

          {/* Floating Live GPS Parent Badge */}
          <View style={styles.parentGpsHud}>
            <MapPin size={13} color="#FFFFFF" />
            <Text style={styles.parentGpsText} numberOfLines={1}>
              Care map · {activeParent.full_name}
            </Text>
          </View>

          {/* Bottom Sliding Drawer or Minimized Floating Dock */}
          {sheetState === "collapsed" ? (
            <TouchableOpacity
              style={[styles.sheetCollapsedPill, { bottom: (insets.bottom || 16) + 82 }]}
              onPress={() => {
                triggerHaptic();
                setSheetState("half");
              }}
              activeOpacity={0.88}
              accessibilityLabel="Expand nearby healthcare places drawer"
            >
              <GlassView variant="pill" style={styles.sheetCollapsedGlass}>
                <View style={styles.sheetCollapsedInner}>
                  <View style={styles.sheetCollapsedIconCircle}>
                    <MapPin size={14} color="#FFFFFF" />
                  </View>
                  <Text style={styles.sheetCollapsedText} numberOfLines={1}>
                    {currentPlaces.length} {isHindi ? "केंद्र नज़दीक • सूची देखने के लिए टैप करें" : "Healthcare places nearby · Tap to view"}
                  </Text>
                  <View style={styles.sheetCollapsedArrow}>
                    <ChevronUp size={16} color={Colors.primaryDark} />
                  </View>
                </View>
              </GlassView>
            </TouchableOpacity>
          ) : (
            <Animated.View
              style={[
                styles.bottomSheetContainer,
                sheetState === "expanded" && styles.bottomSheetContainerExpanded,
                { transform: [{ translateY: sheetTranslateY }] },
              ]}
            >
              {/* Swipe Drag Header: User can swipe up or down */}
              <View {...sheetPanResponder.panHandlers}>
                <View style={styles.sheetHandleTouch}>
                  <View style={styles.sheetHandleBar} />
                </View>

                <View style={styles.sheetHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetTitle}>
                      {currentPlaces.length} {isHindi ? "नज़दीकी केंद्र उपलब्ध" : "Healthcare places nearby"}
                    </Text>
                    <Text style={styles.sheetSub}>
                      {(isHindi ? activeCat.hindiLabel : activeCat.label)} • {"< " + maxDistanceKm + " km"}
                    </Text>
                  </View>
                </View>
              </View>

              <ScrollView
                style={styles.sheetPlacesScroll}
                contentContainerStyle={styles.sheetPlacesContent}
                showsVerticalScrollIndicator={false}
              >
                {currentPlacesLoading && currentPlaces.length === 0 && (
                  <View style={styles.placesState}>
                    <ActivityIndicator color={Colors.primary} />
                    <Text style={styles.placesStateText}>{isHindi ? "आस-पास स्वास्थ्य केंद्र खोजे जा रहे हैं…" : "Searching nearby healthcare…"}</Text>
                  </View>
                )}
                {!currentPlacesLoading && currentPlacesError && (
                  <View style={styles.placesState}>
                    <Text style={styles.placesStateText}>
                      {isHindi && !hasSearchCoordinates
                        ? "आस-पास के केंद्र खोजने के लिए स्थान अनुमति दें या प्रोफ़ाइल में स्थान जोड़ें।"
                        : currentPlacesError}
                    </Text>
                    <TouchableOpacity
                      style={styles.inlineRetryButton}
                      onPress={() => hasSearchCoordinates ? setSearchRequestId((current) => current + 1) : void handleLocateMe()}
                    >
                      <Text style={styles.inlineRetryButtonText}>
                        {hasSearchCoordinates
                          ? (isHindi ? "फिर प्रयास करें" : "Try again")
                          : (isHindi ? "मेरी जगह उपयोग करें" : "Use my location")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                {!currentPlacesLoading && !currentPlacesError && currentPlaces.length === 0 && (
                  <View style={styles.placesState}>
                    <Text style={styles.placesStateText}>
                      {isHindi ? "इस क्षेत्र में कोई स्वास्थ्य केंद्र नहीं मिला।" : "No matching healthcare places found in this area."}
                    </Text>
                    <TouchableOpacity style={styles.inlineRetryButton} onPress={() => setSearchRequestId((current) => current + 1)}>
                      <Text style={styles.inlineRetryButtonText}>{isHindi ? "फिर खोजें" : "Search again"}</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {currentPlaces.map((place) => {
                  const isSelected = selectedPlaceId === place.place_id;
                  // Prefer live GPS, then the search center (always valid when places are returned)
                  const originLat = userLocation?.latitude ?? searchCenter.lat ?? activeParent.latitude ?? initialLat;
                  const originLng = userLocation?.longitude ?? searchCenter.lng ?? activeParent.longitude ?? initialLng;
                  const distanceMeters =
                    place.distance_meters != null && place.distance_meters > 0
                      ? place.distance_meters
                      : place.latitude != null && place.longitude != null
                        ? computeHaversineMeters(originLat, originLng, place.latitude, place.longitude)
                        : null;

                  const distanceText =
                    distanceMeters != null
                      ? distanceMeters < 1000
                        ? `${distanceMeters} m`
                        : `${(distanceMeters / 1000).toFixed(1)} km`
                      : (isHindi ? "दूरी अज्ञात" : "Distance unavailable");

                  const durationMinutes =
                    place.duration_minutes != null && place.duration_minutes > 0
                      ? place.duration_minutes
                      : distanceMeters != null
                        ? Math.max(1, Math.round(distanceMeters / 400))
                        : null;

                  return (
                    <TouchableOpacity
                      key={place.place_id}
                      style={[styles.placeCard, isSelected && styles.placeCardSelected]}
                      onPress={() => handleSelectPlaceOnMap(place)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.placeCardTop}>
                        <View style={styles.placeInfoCol}>
                          <Text style={[styles.placeName, seniorMode && styles.seniorPlaceName]}>
                            {place.name}
                          </Text>
                          <Text style={styles.placeAddress} numberOfLines={2}>
                            {place.address}
                          </Text>
                        </View>
                        {place.rating && (
                          <View style={styles.ratingBadge}>
                            <Star size={12} color="#F59E0B" fill="#F59E0B" />
                            <Text style={styles.ratingText}>{place.rating}</Text>
                          </View>
                        )}
                      </View>

                      {/* Travel Stats & Actions */}
                      <View style={styles.placeCardBottom}>
                        <View style={styles.travelStatRow}>
                          <View style={styles.travelStat}>
                            <Navigation size={12} color={Colors.primaryDark} />
                            <Text style={styles.travelStatText}>
                              {distanceText}
                            </Text>
                          </View>
                          {durationMinutes != null && (
                            <View style={styles.travelStat}>
                              <Clock size={12} color={Colors.primaryDark} />
                              <Text style={styles.travelStatText}>
                                ~{durationMinutes} min
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.actionButtonsRow}>
                          <TouchableOpacity
                            style={styles.checkInBtn}
                            onPress={() => handleCheckInVisit(place)}
                            activeOpacity={0.8}
                          >
                            <CheckCircle2 size={13} color={Colors.primaryDark} />
                            <Text style={styles.checkInText}>
                              {isHindi ? "विज़िट दर्ज" : "Check-in"}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.directionsBtn}
                            onPress={() => openGoogleDirections(place)}
                            activeOpacity={0.8}
                          >
                            <ArrowUpRight size={14} color="#FFFFFF" />
                            <Text style={styles.directionsText}>
                              {isHindi ? "दिशा-निर्देश" : "Directions"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}
        </View>
      ) : (
        /* Visit History View */
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>
              {isHindi ? `${activeParent.full_name} का विज़िट इतिहास` : `Healthcare Visit Log for ${activeParent.full_name}`}
            </Text>
            <Text style={styles.historySub}>
              {isHindi
                ? "अस्पताल, क्लिनिक और लैब की दर्ज की गई पिछली विज़िट्स:"
                : "Timeline of verified healthcare visits with location timestamps:"}
            </Text>
          </View>

          {visits.length === 0 ? (
            <View style={styles.emptyHistoryState}>
              <View style={styles.emptyHistoryIconCircle}>
                <History size={28} color={Colors.primaryDark} />
              </View>
              <Text style={styles.emptyHistoryTitle}>
                {isHindi ? "कोई विज़िट दर्ज नहीं" : "No Healthcare Visits Logged"}
              </Text>
              <Text style={styles.emptyHistorySub}>
                {isHindi
                  ? "जब आप किसी अस्पताल या क्लिनिक में चेक-इन करते हैं, तो वह यहाँ दर्ज हो जाएगा।"
                  : "Healthcare visits recorded via 'Check-In' on nearby facilities will appear here with location & timestamps."}
              </Text>
            </View>
          ) : (
            visits.map((v) => (
              <View key={v.id} style={styles.visitCard}>
                <View style={styles.visitIconCircle}>
                  <MapPin size={18} color={Colors.primaryDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.visitName}>{v.place_name}</Text>
                  <Text style={styles.visitAddress}>{v.address}</Text>
                  <View style={styles.visitMetaRow}>
                    <Text style={styles.visitTime}>{v.visited_at}</Text>
                    <View style={styles.visitTag}>
                      <Text style={styles.visitTagText}>{v.category}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.visitDeleteBtn}
                  onPress={() => setVisitToDelete(v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Delete visit record"
                >
                  <Trash2 size={15} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Interactive Radius & Category Filter Modal */}
      <Modal
        visible={filterMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFilterMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.filterModalBackdrop}
          activeOpacity={1}
          onPress={() => setFilterMenuVisible(false)}
        >
          <View style={styles.filterModalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.filterModalHeader}>
              <View style={styles.filterModalIconCircle}>
                <SlidersHorizontal size={18} color={Colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.filterModalTitle}>
                  {isHindi ? "नज़दीकी केंद्र फ़िल्टर" : "Nearby Healthcare Filters"}
                </Text>
                <Text style={styles.filterModalSubtitle}>
                  {isHindi ? "दूरी और श्रेणी चुनें" : "Select search radius and facility category"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setFilterMenuVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Radius Options */}
            <Text style={styles.filterSectionLabel}>
              {isHindi ? "खोज दायरा (रेडियस)" : "Search Radius"}
            </Text>
            <View style={styles.radiusModalRow}>
              {[2, 5, 10, 25].map((km) => (
                <TouchableOpacity
                  key={km}
                  style={[styles.radiusModalChip, maxDistanceKm === km && styles.radiusModalChipActive]}
                  onPress={() => {
                    triggerHaptic();
                    setMaxDistanceKm(km);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.radiusModalChipText, maxDistanceKm === km && styles.radiusModalChipTextActive]}>
                    {km} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category Options */}
            <Text style={styles.filterSectionLabel}>
              {isHindi ? "केंद्र का प्रकार" : "Facility Category"}
            </Text>
            <View style={styles.categoryModalGrid}>
              {[
                { id: "hospital", label: isHindi ? "अस्पताल" : "Hospitals", icon: Hospital },
                { id: "pharmacy", label: isHindi ? "फ़ार्मेसी" : "Pharmacies", icon: Pill },
                { id: "laboratory", label: isHindi ? "लैब / जांच" : "Diagnostics", icon: FlaskConical },
                { id: "doctor", label: isHindi ? "क्लीनिक / डॉक्टर" : "Clinics", icon: Stethoscope },
                { id: "emergency", label: isHindi ? "आपातकालीन" : "Emergency Care", icon: Hospital },
              ].map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const CatIcon = cat.icon;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryModalItem, isSelected && styles.categoryModalItemActive]}
                    onPress={() => {
                      triggerHaptic();
                      setSelectedCategory(cat.id as PlaceCategory);
                      setFilterMenuVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <CatIcon size={16} color={isSelected ? Colors.primaryDark : Colors.textSecondary} />
                    <Text style={[styles.categoryModalText, isSelected && styles.categoryModalTextActive]}>
                      {cat.label}
                    </Text>
                    {isSelected && <Check size={14} color={Colors.primaryDark} style={{ marginLeft: "auto" }} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.filterApplyBtn}
              onPress={() => setFilterMenuVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.filterApplyBtnText}>
                {isHindi ? "लागू करें" : "Apply Filters"}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Confirmation Modal for Deleting Visit Record */}
      <ConfirmationModal
        visible={Boolean(visitToDelete)}
        title={isHindi ? "विज़िट रिकॉर्ड हटाएं?" : "Delete Visit Record?"}
        message={
          visitToDelete
            ? (isHindi
                ? `क्या आप वाकई "${visitToDelete.place_name}" का विज़िट रिकॉर्ड हटाना चाहते हैं?`
                : `Are you sure you want to delete the visit record for "${visitToDelete.place_name}"?`)
            : ""
        }
        confirmText={isHindi ? "हटाएं" : "Delete"}
        cancelText={isHindi ? "रद्द करें" : "Cancel"}
        isDestructive
        onConfirm={() => {
          if (visitToDelete) {
            deleteVisit(visitToDelete.id);
            setVisitToDelete(null);
          }
        }}
        onCancel={() => setVisitToDelete(null)}
      />
    </View>
  );
};

const styles = createThemedStyles({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingBottom: 50,
  },
  viewToggleContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  viewToggleRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.85)",
    padding: 3,
    borderRadius: 14,
    gap: 4,
  },
  viewToggleBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  viewToggleBtnActive: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 1)",
    ...Shadows.card,
  },
  viewToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  viewToggleTextActive: {
    color: Colors.primaryDark,
    fontWeight: "700",
  },
  fullScreenMapWrapper: {
    flex: 1,
    position: "relative",
    backgroundColor: "#1E293B",
  },
  mapStatusBadge: {
    position: "absolute",
    top: 106,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    zIndex: 14,
    ...Shadows.card,
  },
  mapStatusText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  mapFailureCard: {
    position: "absolute",
    top: "28%",
    left: 24,
    right: 24,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    borderRadius: 18,
    padding: Spacing.lg,
    zIndex: 30,
    ...Shadows.cardElevated,
  },
  mapFailureTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  mapFailureText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 5,
  },
  mapRetryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: Colors.primaryDark,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 12,
  },
  mapRetryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  mapExternalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 8,
  },
  mapExternalButtonText: {
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: "700",
  },
  floatingTopLayer: {
    position: "absolute",
    top: 10,
    left: 12,
    zIndex: 15,
  },
  appliedFilterPill: {
    borderRadius: 20,
    overflow: "hidden",
    ...Shadows.card,
  },
  appliedFilterGlass: {
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 1)",
  },
  appliedFilterInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 9,
    gap: 7,
  },
  appliedFilterIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  appliedFilterTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  appliedFilterDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
  },
  appliedFilterRadius: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  searchThisAreaButton: {
    position: "absolute",
    top: 108,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    zIndex: 18,
    ...Shadows.cardElevated,
  },
  searchThisAreaText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  mapControlsDock: {
    position: "absolute",
    right: 12,
    top: 68,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 16,
    padding: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 1)",
    ...Shadows.card,
    zIndex: 20,
  },
  mapCtrlBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  mapCtrlBtnFilter: {
    backgroundColor: Colors.primaryLight,
  },
  parentGpsHud: {
    position: "absolute",
    left: 12,
    top: 54,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    gap: 6,
    maxWidth: 210,
    zIndex: 15,
  },
  parentGpsText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  bottomSheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "46%",
    backgroundColor: "rgba(248, 250, 252, 0.96)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: 0,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 12,
    zIndex: 25,
  },
  bottomSheetContainerExpanded: {
    height: "100%",
  },
  sheetHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sheetCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(241, 245, 249, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
  },
  sheetIconActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.2)",
  },
  filterModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  filterModalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.cardElevated,
  },
  filterModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.md,
  },
  filterModalIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  filterModalTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  filterModalSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  filterSectionLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  radiusModalRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: Spacing.xs,
  },
  radiusModalChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radiusModalChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  radiusModalChipText: {
    fontSize: 12,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  radiusModalChipTextActive: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  categoryModalGrid: {
    gap: 6,
    marginBottom: Spacing.md,
  },
  categoryModalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryModalItemActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  categoryModalText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  categoryModalTextActive: {
    color: Colors.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  filterApplyBtn: {
    backgroundColor: Colors.primaryDark,
    borderRadius: BorderRadius.md,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xs,
  },
  filterApplyBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: Typography.weights.bold,
  },
  sheetCollapsedPill: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 82 : 72,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 60,
  },
  sheetCollapsedGlass: {
    borderRadius: 30,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.95)",
    ...Shadows.cardElevated,
  },
  sheetCollapsedInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
  sheetCollapsedIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetCollapsedText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  sheetCollapsedArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(13, 148, 136, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetHandleTouch: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 26,
    paddingVertical: 5,
  },
  sheetHandleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.borderStrong,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sheetTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  sheetSub: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "600",
    marginTop: 1,
  },
  expandToggleBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expandToggleText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  sheetPlacesScroll: {
    flex: 1,
  },
  sheetPlacesContent: {
    paddingTop: Spacing.xs,
    paddingBottom: 90,
    gap: 4,
  },
  placesState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    marginBottom: Spacing.md,
  },
  placesStateText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  inlineRetryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
  },
  inlineRetryButtonText: {
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: "700",
  },
  radiusChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  radiusChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  radiusChipTextActive: {
    color: Colors.primaryDark,
    fontWeight: "700",
  },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.85)",
    gap: 8,
  },
  catPillActive: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderColor: Colors.primary,
    ...Shadows.subtle,
  },
  catIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  catText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  catTextActive: {
    color: Colors.primaryDark,
    fontWeight: "700",
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  listCount: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0D9488",
  },
  placesList: {
    paddingHorizontal: Spacing.lg,
    gap: 6,
    paddingTop: Spacing.xs,
  },
  placeCard: {
    ...Glass.card,
    padding: Spacing.md,
    borderRadius: 18,
    marginBottom: 0,
  },
  placeCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  placeCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  placeInfoCol: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  placeName: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  seniorPlaceName: {
    fontSize: 18,
  },
  placeAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#B45309",
  },
  placeCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(226, 232, 240, 0.6)",
  },
  travelStatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  travelStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  travelStatText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkInBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  checkInText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
  },
  directionsText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  historyHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  historySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  visitCard: {
    ...Glass.card,
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: 16,
    gap: 12,
  },
  visitIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  visitName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  visitAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  visitMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  visitTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  visitTag: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  visitTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "capitalize",
  },
  visitDeleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.surfaceAlt,
    alignSelf: "center",
  },
  emptyHistoryState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: Spacing.xl,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyHistoryIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyHistoryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: "center",
  },
  emptyHistorySub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
});

// apps/mobile/src/screens/MapsScreen.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
  Animated,
  PanResponder,
} from "react-native";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import {
  Hospital,
  Pill,
  FlaskConical,
  Stethoscope,
  MapPin,
  Navigation,
  Phone,
  Clock,
  Star,
  ShieldCheck,
  CheckCircle2,
  LocateFixed,
  Compass,
  ArrowUpRight,
  History,
  Layers,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { HealthcarePlace, PlaceCategory } from "../types";
import { Colors, Typography, Spacing, Shadows, Gradients, Glass, BorderRadius } from "../theme";
import { GlassView } from "../components/GlassView";
import { apiClient } from "../api/client";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export const MapsScreen: React.FC = () => {
  const { activeParent, visits, recordNewVisit, userLocation, refreshLocation, seniorMode, language } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory>("hospital");
  const [viewMode, setViewMode] = useState<"nearby" | "visits">("nearby");
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(10);

  // Real-Time Google Maps State
  const initialLat = userLocation?.latitude ?? activeParent.latitude ?? 0;
  const initialLng = userLocation?.longitude ?? activeParent.longitude ?? 0;
  const [centerCoords, setCenterCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [zoom, setZoom] = useState<number>(14);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [mapImageLoading, setMapImageLoading] = useState<boolean>(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<HealthcarePlace[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);

  // 3-Tier Drawer state: "expanded" (72%) | "half" (44%) | "collapsed" (docked pill)
  const [sheetState, setSheetState] = useState<"expanded" | "half" | "collapsed">("half");

  // Swipe-to-dismiss animation for bottom sheet
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 6 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onMoveShouldSetPanResponderCapture: (_, gs) => gs.dy > 10 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) sheetTranslateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 50 || gs.vy > 0.4) {
          // A deliberate downward swipe always dismisses the map drawer.
          try {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          } catch {}
          Animated.timing(sheetTranslateY, {
            toValue: 400,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            setSheetState("collapsed");
            sheetTranslateY.setValue(0);
          });
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
    } catch {}
  };

  const categories = [
    {
      id: "hospital" as PlaceCategory,
      label: "Hospitals",
      hindiLabel: "à¤…à¤¸à¥à¤ªà¤¤à¤¾à¤²",
      icon: Hospital,
      color: Colors.emergency,
      bg: "#FEE2E2",
    },
    {
      id: "pharmacy" as PlaceCategory,
      label: "Pharmacies",
      hindiLabel: "à¤¦à¤µà¤¾ à¤•à¥€ à¤¦à¥à¤•à¤¾à¤¨à¥‡à¤‚",
      icon: Pill,
      color: Colors.primary,
      bg: Colors.primaryLight,
    },
    {
      id: "laboratory" as PlaceCategory,
      label: "Diagnostic Labs",
      hindiLabel: "à¤œà¤¾à¤‚à¤š à¤ªà¥à¤°à¤¯à¥‹à¤—à¤¶à¤¾à¤²à¤¾à¤à¤‚",
      icon: FlaskConical,
      color: "#7C3AED",
      bg: "#F3E8FF",
    },
    {
      id: "doctor" as PlaceCategory,
      label: "Specialist Clinics",
      hindiLabel: "à¤µà¤¿à¤¶à¥‡à¤·à¤œà¥à¤ž à¤•à¥à¤²à¤¿à¤¨à¤¿à¤•",
      icon: Stethoscope,
      color: "#0284C7",
      bg: "#E0F2FE",
    },
  ];

  useEffect(() => {
    const latitude = userLocation?.latitude ?? activeParent.latitude;
    const longitude = userLocation?.longitude ?? activeParent.longitude;
    if (latitude == null || longitude == null) {
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      if (!active) return;
      setPlacesLoading(true);
      setPlacesError(null);
      void apiClient.getNearbyHealthcare(latitude, longitude, selectedCategory, maxDistanceKm * 1000)
        .then((places) => { if (active) setNearbyPlaces(places); })
        .catch((error) => { if (active) { setNearbyPlaces([]); setPlacesError(error instanceof Error ? error.message : "Nearby search is unavailable."); } })
        .finally(() => { if (active) setPlacesLoading(false); });
    }, 0);
    return () => { active = false; clearTimeout(timer); };
  }, [activeParent.latitude, activeParent.longitude, maxDistanceKm, selectedCategory, userLocation?.latitude, userLocation?.longitude]);

  const hasSearchCoordinates = (userLocation?.latitude ?? activeParent.latitude) != null && (userLocation?.longitude ?? activeParent.longitude) != null;
  const currentPlaces = hasSearchCoordinates ? nearbyPlaces : [];
  const currentPlacesError = hasSearchCoordinates ? placesError : "Enable location access or add coordinates to the parent profile.";

  // Construct Real-Time Google Maps Static URL with Key and Markers
  const getGoogleMapUrl = () => {
    const center = `${centerCoords.lat},${centerCoords.lng}`;
    const parentMarker = activeParent.latitude != null && activeParent.longitude != null
      ? `&markers=color:red%7Clabel:P%7C${activeParent.latitude},${activeParent.longitude}`
      : "";
    const placeMarkers = currentPlaces
      .slice(0, 5)
      .map(
        (p) =>
          `&markers=color:blue%7Clabel:${p.category[0].toUpperCase()}%7C${p.latitude},${p.longitude}`
      )
      .join("");
    return `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=${zoom}&size=640x960&scale=2&maptype=${mapType}${parentMarker}${placeMarkers}&key=${GOOGLE_MAPS_API_KEY}`;
  };

  const handleLocateMe = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCenterCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        setZoom(15);
      } else {
        setCenterCoords({ lat: initialLat, lng: initialLng });
      }
    } catch {
      setCenterCoords({ lat: initialLat, lng: initialLng });
    } finally {
      setIsLocating(false);
    }
  };

  const handleZoom = (delta: number) => {
    triggerHaptic();
    setZoom((prev) => Math.max(10, Math.min(19, prev + delta)));
  };

  const handleToggleMapType = () => {
    triggerHaptic();
    setMapType((prev) => (prev === "roadmap" ? "satellite" : "roadmap"));
  };

  const handleSelectPlaceOnMap = (place: HealthcarePlace) => {
    triggerHaptic();
    setSelectedPlaceId(place.place_id);
    setCenterCoords({ lat: place.latitude, lng: place.longitude });
    setZoom(16);
  };

  const openGoogleDirections = (place: HealthcarePlace) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
    Linking.openURL(url);
  };

  const handleCheckInVisit = (place: HealthcarePlace) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    recordNewVisit(place.name, place.category, place.address);
    Alert.alert(
      isHindi ? "ðŸ“ à¤µà¤¿à¤œà¤¼à¤¿à¤Ÿ à¤¦à¤°à¥à¤œ à¤•à¥€ à¤—à¤ˆ!" : "ðŸ“ Visit Confirmed!",
      isHindi
        ? `${activeParent.full_name} à¤•à¥‡ à¤²à¤¿à¤ ${place.name} à¤•à¥€ à¤µà¤¿à¤œà¤¼à¤¿à¤Ÿ à¤¦à¤°à¥à¤œ à¤•à¥€ à¤—à¤ˆ à¤”à¤° à¤«à¤¼à¥ˆà¤®à¤¿à¤²à¥€ à¤Ÿà¤¾à¤‡à¤®à¤²à¤¾à¤‡à¤¨ à¤®à¥‡à¤‚ à¤¸à¤¿à¤‚à¤• à¤¹à¥‹ à¤—à¤ˆà¥¤`
        : `Recorded healthcare visit to ${place.name} for ${activeParent.full_name}. Synced to family timeline and map history.`
    );
  };

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
              {isHindi ? "à¤†à¤¸à¤ªà¤¾à¤¸ à¤•à¥€ à¤¸à¥à¤µà¤¾à¤¸à¥à¤¥à¥à¤¯ à¤¸à¥‡à¤µà¤¾à¤à¤‚" : "Nearby Healthcare"}
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
              {isHindi ? `à¤µà¤¿à¤œà¤¼à¤¿à¤Ÿ à¤‡à¤¤à¤¿à¤¹à¤¾à¤¸ (${visits.length})` : `Visit Log (${visits.length})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === "nearby" ? (
        <View style={styles.fullScreenMapWrapper}>
          {/* Live Full Screen Google Map Image */}
          <Image
            source={{ uri: getGoogleMapUrl() }}
            style={styles.fullScreenMapImage}
            resizeMode="cover"
            onLoadStart={() => setMapImageLoading(true)}
            onLoadEnd={() => setMapImageLoading(false)}
          />

          {/* Loading Indicator Overlay */}
          {mapImageLoading && (
            <View style={styles.mapLoadingOverlay}>
              <ActivityIndicator color={Colors.primary} size="small" />
            </View>
          )}

          {/* Floating Top Layers (Categories & Radius Filter) */}
          <View style={styles.floatingTopLayer}>
            {/* Category Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {categories.map((c) => {
                const IconComp = c.icon;
                const isSelected = selectedCategory === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.catPill, isSelected && styles.catPillActive]}
                    onPress={() => {
                      triggerHaptic();
                      setSelectedCategory(c.id);
                    }}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.catIconBox,
                        { backgroundColor: isSelected ? c.color : c.bg },
                      ]}
                    >
                      <IconComp size={15} color={isSelected ? "#FFFFFF" : c.color} />
                    </View>
                    <Text style={[styles.catText, isSelected && styles.catTextActive]}>
                      {isHindi ? c.hindiLabel : c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Distance Filter Chips */}
            <View style={styles.radiusRowFloating}>
              <Text style={styles.radiusLabelFloating}>{isHindi ? "à¤¦à¤¾à¤¯à¤°à¤¾:" : "Radius:"}</Text>
              {[2, 5, 10, 20].map((dist) => (
                <TouchableOpacity
                  key={dist}
                  style={[
                    styles.radiusChipFloating,
                    maxDistanceKm === dist && styles.radiusChipFloatingActive,
                  ]}
                  onPress={() => {
                    triggerHaptic();
                    setMaxDistanceKm(dist);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.radiusChipTextFloating,
                      maxDistanceKm === dist && styles.radiusChipTextFloatingActive,
                    ]}
                  >
                    {"< " + dist + " km"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Overlaid Interactive Controls Dock (Zoom, Satellite, Locate) */}
          <View style={styles.mapControlsDock}>
            <TouchableOpacity style={styles.mapCtrlBtn} onPress={() => handleZoom(1)} activeOpacity={0.8}>
              <ZoomIn size={18} color={Colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.mapCtrlBtn} onPress={() => handleZoom(-1)} activeOpacity={0.8}>
              <ZoomOut size={18} color={Colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mapCtrlBtn, mapType === "satellite" && styles.mapCtrlBtnActive]}
              onPress={handleToggleMapType}
              activeOpacity={0.8}
            >
              <Layers size={18} color={mapType === "satellite" ? Colors.primaryDark : Colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.mapCtrlBtn} onPress={handleLocateMe} activeOpacity={0.8}>
              {isLocating ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <LocateFixed size={18} color={Colors.primaryDark} />
              )}
            </TouchableOpacity>
          </View>

          {/* Floating Live GPS Parent Badge */}
          <View style={styles.parentGpsHud}>
            <View style={styles.pulseDot} />
            <Text style={styles.parentGpsText} numberOfLines={1}>
              {activeParent.full_name} · {activeParent.address}
            </Text>
          </View>

          {/* Bottom Sliding Drawer or Minimized Floating Dock */}
          {sheetState === "collapsed" ? (
            <TouchableOpacity
              style={styles.sheetCollapsedPill}
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
                    {currentPlaces.length} {isHindi ? "à¤•à¥‡à¤‚à¤¦à¥à¤° à¤¨à¤œà¤¼à¤¦à¥€à¤• â€¢ à¤¸à¥‚à¤šà¥€ à¤¦à¥‡à¤–à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤Ÿà¥ˆà¤ª à¤•à¤°à¥‡à¤‚" : "Healthcare places nearby · Tap to view"}
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
              {/* Swipe Drag Header (Supports Swiping Down to Dismiss/Minimize) */}
              <View {...sheetPanResponder.panHandlers} style={styles.sheetHandleTouch}>
                <View style={styles.sheetHandleBar} />
              </View>

              <View style={styles.sheetHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetTitle}>
                    {currentPlaces.length} {isHindi ? "à¤¨à¤œà¤¼à¤¦à¥€à¤•à¥€ à¤•à¥‡à¤‚à¤¦à¥à¤° à¤‰à¤ªà¤²à¤¬à¥à¤§" : "Healthcare places nearby"}
                  </Text>
                  <Text style={styles.sheetSub}>
                    {selectedCategory.toUpperCase()} â€¢ {maxDistanceKm}km radius
                  </Text>
                </View>

                <View style={styles.sheetHeaderActions}>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      setSheetState(sheetState === "expanded" ? "half" : "expanded");
                    }}
                    style={styles.expandToggleBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.expandToggleText}>
                      {sheetState === "expanded"
                        ? (isHindi ? "à¤›à¥‹à¤Ÿà¤¾ à¤•à¤°à¥‡à¤‚" : "Half")
                        : (isHindi ? "à¤µà¤¿à¤¸à¥à¤¤à¤¾à¤°" : "Expand")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic();
                      setSheetState("collapsed");
                    }}
                    style={styles.sheetCloseBtn}
                    activeOpacity={0.8}
                    accessibilityLabel="Close Drawer"
                  >
                    <ChevronDown size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                style={styles.sheetPlacesScroll}
                contentContainerStyle={{ paddingBottom: 95 }}
                showsVerticalScrollIndicator={false}
              >
              {placesLoading && <View style={styles.mapLoadingOverlay}><ActivityIndicator color={Colors.primary} /><Text style={styles.travelStatText}>Loading live Google Places results…</Text></View>}
              {!placesLoading && currentPlacesError && <View style={styles.mapLoadingOverlay}><Text style={styles.placeAddress}>{currentPlacesError}</Text></View>}
              {!placesLoading && !currentPlacesError && currentPlaces.length === 0 && <View style={styles.mapLoadingOverlay}><Text style={styles.placeAddress}>No matching healthcare places were returned for this area.</Text></View>}
              {currentPlaces.map((place) => {
                const isSelected = selectedPlaceId === place.place_id;
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
                            {place.distance_meters ? `${(place.distance_meters / 1000).toFixed(1)} km` : "Distance unavailable"}
                          </Text>
                        </View>
                        {place.duration_minutes != null && <View style={styles.travelStat}>
                          <Clock size={12} color={Colors.primaryDark} />
                          <Text style={styles.travelStatText}>
                            ~{place.duration_minutes} min
                          </Text>
                        </View>}
                      </View>

                      <View style={styles.actionButtonsRow}>
                        <TouchableOpacity
                          style={styles.checkInBtn}
                          onPress={() => handleCheckInVisit(place)}
                          activeOpacity={0.8}
                        >
                          <CheckCircle2 size={13} color={Colors.primaryDark} />
                          <Text style={styles.checkInText}>
                            {isHindi ? "à¤µà¤¿à¤œà¤¼à¤¿à¤Ÿ à¤¦à¤°à¥à¤œ" : "Check-in"}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.directionsBtn}
                          onPress={() => openGoogleDirections(place)}
                          activeOpacity={0.8}
                        >
                          <ArrowUpRight size={14} color="#FFFFFF" />
                          <Text style={styles.directionsText}>
                            {isHindi ? "à¤¦à¤¿à¤¶à¤¾-à¤¨à¤¿à¤°à¥à¤¦à¥‡à¤¶" : "Directions"}
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
              {isHindi ? `${activeParent.full_name} à¤•à¤¾ à¤µà¤¿à¤œà¤¼à¤¿à¤Ÿ à¤‡à¤¤à¤¿à¤¹à¤¾à¤¸` : `Healthcare Visit Log for ${activeParent.full_name}`}
            </Text>
            <Text style={styles.historySub}>
              {isHindi
                ? "à¤…à¤¸à¥à¤ªà¤¤à¤¾à¤², à¤•à¥à¤²à¤¿à¤¨à¤¿à¤• à¤”à¤° à¤²à¥ˆà¤¬ à¤•à¥€ à¤¦à¤°à¥à¤œ à¤•à¥€ à¤—à¤ˆ à¤ªà¤¿à¤›à¤²à¥€ à¤µà¤¿à¤œà¤¼à¤¿à¤Ÿà¥à¤¸:"
                : "Timeline of verified healthcare visits with location timestamps:"}
            </Text>
          </View>

          {visits.map((v) => (
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
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingBottom: 50,
  },
  viewToggleContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
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
  fullScreenMapImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 4,
  },
  mapLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  floatingTopLayer: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    zIndex: 15,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  radiusRowFloating: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingTop: 6,
    gap: 6,
  },
  radiusLabelFloating: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  radiusChipFloating: {
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.95)",
  },
  radiusChipFloatingActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  radiusChipTextFloating: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "700",
  },
  radiusChipTextFloatingActive: {
    color: "#FFFFFF",
  },
  mapControlsDock: {
    position: "absolute",
    right: 12,
    top: 85,
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
  mapCtrlBtnActive: {
    backgroundColor: Colors.primaryLight,
  },
  parentGpsHud: {
    position: "absolute",
    left: 12,
    top: 85,
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
    paddingTop: 8,
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
    height: "78%",
  },
  sheetHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(241, 245, 249, 0.9)",
    alignItems: "center",
    justifyContent: "center",
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
    minHeight: 38,
    paddingVertical: 9,
  },
  sheetHandleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#CBD5E1",
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
    gap: 12,
    paddingTop: Spacing.xs,
  },
  placeCard: {
    ...Glass.card,
    padding: Spacing.md,
    borderRadius: 18,
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
    paddingTop: Spacing.md,
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
});

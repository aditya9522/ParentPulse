import React from "react";
import { NearbyMapFallback } from "./NearbyMapFallback";
import type { NearbyMapCanvasProps } from "./NearbyMapCanvas.types";

import { isExpoGo } from "../services/runtimeEnvironment";

type NativeMapComponent = React.ComponentType<NearbyMapCanvasProps>;

let nativeMapComponent: NativeMapComponent | null | undefined;

const getNativeMapComponent = (): NativeMapComponent | null => {
  if (nativeMapComponent !== undefined) return nativeMapComponent;

  try {
    // Keep the native module out of the startup path. Existing development
    // clients may not contain MapLibre until they are rebuilt.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nativeMapComponent = require("./NativeMapLibreCanvas").default as NativeMapComponent;
  } catch (error) {
    console.error("Native map module is unavailable", error);
    nativeMapComponent = null;
  }

  return nativeMapComponent;
};

interface MapErrorBoundaryState {
  failed: boolean;
}

class MapErrorBoundary extends React.Component<NearbyMapCanvasProps, MapErrorBoundaryState> {
  state: MapErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): MapErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("Native map failed to render", error);
    this.props.onMapError();
  }

  render() {
    if (this.state.failed) {
      return <NearbyMapFallback {...this.props} unavailableReason="native-error" />;
    }

    const NativeMapLibreCanvas = getNativeMapComponent();
    if (!NativeMapLibreCanvas) {
      return <NearbyMapFallback {...this.props} unavailableReason="native-error" />;
    }

    return <NativeMapLibreCanvas {...this.props} />;
  }
}

export const NearbyMapCanvas: React.FC<NearbyMapCanvasProps> = (props) => {
  if (isExpoGo) {
    return <NearbyMapFallback {...props} unavailableReason="expo-go" />;
  }

  const NativeMapLibreCanvas = getNativeMapComponent();
  if (!NativeMapLibreCanvas) {
    return <NearbyMapFallback {...props} unavailableReason="native-error" />;
  }

  return <MapErrorBoundary key={props.mapInstance} {...props} />;
};

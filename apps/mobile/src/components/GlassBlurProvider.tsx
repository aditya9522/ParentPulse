import React, { createContext, useContext, useRef } from "react";
import { View } from "react-native";
import { BlurTargetView } from "expo-blur";

type BlurTargetRef = React.RefObject<View | null>;

const GlassBlurTargetContext = createContext<BlurTargetRef | null>(null);

export const useGlassBlurTarget = () => useContext(GlassBlurTargetContext);

export const GlassBlurProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const blurTarget = useRef<View | null>(null);

  return (
    <GlassBlurTargetContext.Provider value={blurTarget}>
      <BlurTargetView ref={blurTarget} style={{ flex: 1 }}>
        {children}
      </BlurTargetView>
    </GlassBlurTargetContext.Provider>
  );
};

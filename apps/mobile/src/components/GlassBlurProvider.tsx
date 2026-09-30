import React, { createContext, useContext, useRef } from "react";
import { View } from "react-native";

type BlurTargetRef = React.RefObject<View | null>;

const GlassBlurTargetContext = createContext<BlurTargetRef | null>(null);

export const useGlassBlurTarget = () => useContext(GlassBlurTargetContext);

export const GlassBlurProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const blurTarget = useRef<View | null>(null);

  return (
    <GlassBlurTargetContext.Provider value={blurTarget}>
      <View ref={blurTarget} style={{ flex: 1 }}>
        {children}
      </View>
    </GlassBlurTargetContext.Provider>
  );
};

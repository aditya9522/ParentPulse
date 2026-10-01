import { useApp } from "../context/AppContext";
import { LIGHT_COLORS, THEME_PALETTES } from "./index";

export type ThemeColors = typeof LIGHT_COLORS;

export function useStyles<T extends object>(
  makeStyles: (C: ThemeColors) => T,
): T {
  const { themeMode } = useApp();
  const palette = THEME_PALETTES[themeMode] || THEME_PALETTES.light;
  const C = palette.colors as ThemeColors;
  return makeStyles(C);
}

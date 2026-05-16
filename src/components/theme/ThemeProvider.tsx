"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { rgbEqual, type Rgb } from "@/lib/theme/colorUtils";
import {
  applySurfaceTheme,
  DEFAULT_SURFACE_THEME,
  loadSurfaceTheme,
  saveSurfaceTheme,
  type SurfaceThemeState,
} from "@/lib/theme/surfaceTheme";

type ThemeContextValue = {
  rgb: Rgb;
  isCustom: boolean;
  setColor: (rgb: Rgb) => void;
  reset: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SurfaceThemeState>(DEFAULT_SURFACE_THEME);

  useEffect(() => {
    const saved = loadSurfaceTheme();
    if (saved) {
      setState(saved);
      applySurfaceTheme(saved);
    }
  }, []);

  const setColor = useCallback((rgb: Rgb) => {
    setState((prev) => {
      if (prev.isCustom && rgbEqual(prev.rgb, rgb)) return prev;
      const next: SurfaceThemeState = { rgb, isCustom: true };
      applySurfaceTheme(next);
      saveSurfaceTheme(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_SURFACE_THEME);
    applySurfaceTheme(DEFAULT_SURFACE_THEME);
    saveSurfaceTheme(DEFAULT_SURFACE_THEME);
  }, []);

  const value = useMemo(
    () => ({
      rgb: state.rgb,
      isCustom: state.isCustom,
      setColor,
      reset,
    }),
    [state.rgb.r, state.rgb.g, state.rgb.b, state.isCustom, setColor, reset],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useSurfaceTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useSurfaceTheme must be used within ThemeProvider");
  }
  return ctx;
}

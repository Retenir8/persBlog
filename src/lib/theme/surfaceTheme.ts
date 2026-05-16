import { rgbToCss, type Rgb } from "./colorUtils";

export const SURFACE_THEME_STORAGE_KEY = "persblog-surface-theme";

export type SurfaceThemeState = {
  rgb: Rgb;
  isCustom: boolean;
};

export const DEFAULT_SURFACE_THEME: SurfaceThemeState = {
  rgb: { r: 255, g: 255, b: 255 },
  isCustom: false,
};

const SURFACE_CSS_VARS = [
  "--surface-accent",
  "--surface-0-bg",
  "--surface-1-bg",
  "--surface-2-bg",
  "--surface-3-bg",
  "--surface-field-bg",
  "--surface-chip-bg",
  "--surface-chip-border",
  "--surface-0-border",
  "--surface-1-border",
  "--surface-2-border",
  "--surface-3-border",
] as const;

export function applySurfaceTheme({ rgb, isCustom }: SurfaceThemeState) {
  const root = document.documentElement;
  if (!isCustom) {
    for (const key of SURFACE_CSS_VARS) {
      root.style.removeProperty(key);
    }
    root.removeAttribute("data-surface-custom");
    return;
  }

  root.style.setProperty("--surface-accent", rgbToCss(rgb));
  root.setAttribute("data-surface-custom", "true");
}

export function loadSurfaceTheme(): SurfaceThemeState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SURFACE_THEME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SurfaceThemeState;
    if (
      !parsed ||
      typeof parsed.isCustom !== "boolean" ||
      !parsed.rgb ||
      typeof parsed.rgb.r !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSurfaceTheme(state: SurfaceThemeState) {
  localStorage.setItem(SURFACE_THEME_STORAGE_KEY, JSON.stringify(state));
}

export const SURFACE_THEME_BOOTSTRAP_SCRIPT = `(function(){try{var k=${JSON.stringify(SURFACE_THEME_STORAGE_KEY)};var r=localStorage.getItem(k);if(!r)return;var p=JSON.parse(r);if(!p||!p.isCustom||!p.rgb)return;var a="rgb("+p.rgb.r+" "+p.rgb.g+" "+p.rgb.b+")";document.documentElement.style.setProperty("--surface-accent",a);document.documentElement.setAttribute("data-surface-custom","true");}catch(e){}})();`;

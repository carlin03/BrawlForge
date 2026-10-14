/**
 * Valores por defecto = comportamiento actual de BrawlForge (legacy).
 * Se usan cuando Supabase no tiene datos o los flags CMS están desactivados.
 */
import { MAIN_NAV } from "@/lib/nav-config";
import { DEFAULT_GLOBAL_WATERMARK } from "@/lib/data/card-theme-meta";
import type { ResolvedCmsConfig, ResolvedNavItem, ResolvedThemeTokens } from "./types";

export const CMS_CONFIG_VERSION = 1;

export const DEFAULT_THEME_TOKENS: ResolvedThemeTokens = {
  colors: {
    bg: "#fff9f1",
    surface: "#ffffff",
    panel: "#fff8ef",
    text: "#1c1410",
    muted: "#6b5e52",
    primary: "#c41e3a",
    secondary: "#b8870f",
    success: "#1f9d63",
    error: "#c41e3a",
    warning: "#e4b84a",
  },
  layout: {
    maxWidth: "1240px",
    navHeight: "52px",
    radius: "14px",
  },
};

export const DEFAULT_NAVIGATION: ResolvedNavItem[] = MAIN_NAV.map((item) => ({
  label: item.label,
  href: item.href,
  ...("accent" in item && item.accent ? { accent: item.accent } : {}),
}));

/** Producción: CMS activo por defecto (Strangler sigue con fallback legacy si falta data). */
export const DEFAULT_FEATURE_FLAGS: Record<string, boolean> = {
  "cms.resolver.enabled": true,
  "cms.nav.enabled": true,
  "cms.theme.enabled": true,
  "cms.home_builder.enabled": true,
  "cms.matches.enabled": true,
  "cms.catalog.primary": true,
  "cms.seo.enabled": true,
  "cms.cards.enabled": true,
  "cms.fantasy_config.enabled": true,
  "cms.predictions_config.enabled": true,
  "cms.media.enabled": true,
  "cms.automation.enabled": true,
};

export const DEFAULT_LEGACY_CONFIG: ResolvedCmsConfig = {
  version: CMS_CONFIG_VERSION,
  source: "legacy",
  flags: { ...DEFAULT_FEATURE_FLAGS },
  settings: {
    branding: {
      appName: "BrawlForge",
      tagline: "Fantasy & Predictions BSC",
      defaultLocale: "es",
    },
    seo: {
      title: "BrawlForge — Fantasy & Predictions BSC",
      description: "Fantasy, predicciones y seguimiento competitivo de Brawl Stars.",
      themeColor: "#0a0c12",
    },
    cardWatermark: { ...DEFAULT_GLOBAL_WATERMARK },
  },
  navigation: DEFAULT_NAVIGATION,
  theme: DEFAULT_THEME_TOKENS,
  modules: [],
};

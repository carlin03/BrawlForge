/**
 * Valores por defecto = comportamiento actual de BrawlForge (legacy).
 * Se usan cuando Supabase no tiene datos o los flags CMS están desactivados.
 */
import { MAIN_NAV } from "@/lib/nav-config";
import type { ResolvedCmsConfig, ResolvedNavItem, ResolvedThemeTokens } from "./types";

export const CMS_CONFIG_VERSION = 1;

export const DEFAULT_THEME_TOKENS: ResolvedThemeTokens = {
  colors: {
    bg: "#0a0c12",
    surface: "#131824",
    panel: "#181f2c",
    text: "#f8fafc",
    muted: "#9aa8bc",
    primary: "#0099ff",
    secondary: "#ffc82e",
    success: "#34d06a",
    error: "#ff1744",
    warning: "#ffc82e",
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
  },
  navigation: DEFAULT_NAVIGATION,
  theme: DEFAULT_THEME_TOKENS,
  modules: [],
};

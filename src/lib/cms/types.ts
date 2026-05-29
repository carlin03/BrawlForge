/** CMS Enterprise — tipos compartidos (Fase 0+) */

export type CmsFeatureFlagKey =
  | "cms.resolver.enabled"
  | "cms.nav.enabled"
  | "cms.theme.enabled"
  | "cms.home_builder.enabled"
  | "cms.matches.enabled"
  | "cms.catalog.primary"
  | "cms.seo.enabled"
  | "cms.cards.enabled"
  | "cms.fantasy_config.enabled"
  | "cms.predictions_config.enabled"
  | "cms.media.enabled"
  | "cms.automation.enabled";

export type NavAccent = "fantasy" | "predict";

export interface ResolvedNavItem {
  label: string;
  href: string;
  accent?: NavAccent;
}

export interface ThemeColorTokens {
  bg: string;
  surface: string;
  panel: string;
  text: string;
  muted: string;
  primary: string;
  secondary: string;
  success: string;
  error: string;
  warning: string;
}

export interface ThemeLayoutTokens {
  maxWidth: string;
  navHeight: string;
  radius: string;
}

export interface ResolvedThemeTokens {
  colors: ThemeColorTokens;
  layout: ThemeLayoutTokens;
}

export interface SiteBrandingSettings {
  appName: string;
  tagline: string;
  defaultLocale: string;
}

export interface SiteSeoSettings {
  title: string;
  description: string;
  themeColor: string;
}

export interface ResolvedSiteSettings {
  branding: SiteBrandingSettings;
  seo: SiteSeoSettings;
}

export interface CmsModuleInfo {
  id: string;
  label: string;
  phase: string;
  status: "active" | "planned" | "beta";
  description: string | null;
  sortOrder: number;
}

export interface ResolvedCmsConfig {
  version: number;
  source: "legacy" | "supabase" | "hybrid";
  flags: Record<string, boolean>;
  settings: ResolvedSiteSettings;
  navigation: ResolvedNavItem[];
  theme: ResolvedThemeTokens;
  modules: CmsModuleInfo[];
}

export interface CmsAuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  meta: Record<string, unknown>;
}

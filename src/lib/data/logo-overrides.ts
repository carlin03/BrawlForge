import raw from "./generated/logo-overrides.json";

export type LogoOverrideEntry = {
  url?: string;
  treatment?: string;
  /** URL manual (admin/Supabase): solo esa imagen, sin CDN ni locales. */
  customOnly?: boolean;
};

export type LogoOverridesFile = {
  teams: Record<string, LogoOverrideEntry>;
  tournaments: Record<string, { url?: string }>;
};

export const logoOverrides = raw as LogoOverridesFile;

export function teamLogoOverrideUrl(slug: string): string | undefined {
  return logoOverrides.teams[slug]?.url?.trim() || undefined;
}

export function tournamentLogoOverrideUrl(slug: string): string | undefined {
  return logoOverrides.tournaments[slug]?.url?.trim() || undefined;
}

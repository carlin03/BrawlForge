import raw from "./generated/logo-overrides.json";

export type LogoOverridesFile = {
  teams: Record<string, { url?: string; treatment?: string }>;
  tournaments: Record<string, { url?: string }>;
};

export const logoOverrides = raw as LogoOverridesFile;

export function teamLogoOverrideUrl(slug: string): string | undefined {
  return logoOverrides.teams[slug]?.url?.trim() || undefined;
}

export function tournamentLogoOverrideUrl(slug: string): string | undefined {
  return logoOverrides.tournaments[slug]?.url?.trim() || undefined;
}

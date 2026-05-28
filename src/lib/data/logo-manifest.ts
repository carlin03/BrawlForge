import manifest from "./generated/logo-manifest.json";

export const VERIFIED_TEAM_LOGO_SLUGS = new Set<string>(manifest.teamLocal);
export const VERIFIED_TOURNAMENT_LOGO_SLUGS = new Set<string>(manifest.tournamentLocal);

/** Logos reprocesados con tratamiento correcto — única fuente en UI */
export const PROCESSED_TEAM_LOGO_SLUGS = new Set<string>(
  (manifest as { processedTeamLogos?: string[] }).processedTeamLogos ??
    manifest.taiyoroLocal ??
    [],
);

export const LOGO_CACHE_VERSION = String(
  (manifest as { logoCacheVersion?: number }).logoCacheVersion ?? manifest.generatedAt ?? "1",
);

export function hasProcessedTeamLogo(slug: string): boolean {
  return PROCESSED_TEAM_LOGO_SLUGS.has(slug);
}

/** @deprecated usar hasProcessedTeamLogo */
export const TAIYORO_LOCAL_SLUGS = PROCESSED_TEAM_LOGO_SLUGS;

export function hasTaiyoroLocalLogo(slug: string): boolean {
  return hasProcessedTeamLogo(slug);
}

export function hasVerifiedLocalTeamLogo(slug: string): boolean {
  return hasProcessedTeamLogo(slug);
}

export function hasVerifiedLocalTournamentLogo(slug: string): boolean {
  return VERIFIED_TOURNAMENT_LOGO_SLUGS.has(slug);
}

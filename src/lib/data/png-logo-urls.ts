import {
  normalizeParticipantSlug,
  TEAM_ROSTER_ALIASES,
  resolveTournamentSlug,
  TOURNAMENT_SLUG_ALIASES,
} from "./catalog";
import { isValidLogoSlug } from "./logo-slugs";
import { BSC_DEFAULT_LOGO, BSC_TOURNAMENT_ALIASES } from "./bsc-tournaments";

import { teamLogoOverrideUrl, tournamentLogoOverrideUrl } from "./logo-overrides";

import type { LogoOverridesFile } from "./logo-overrides";



const BSC_LOCAL_LOGO = "/images/bsc-2026.png";

import { hasProcessedTeamLogo, LOGO_CACHE_VERSION } from "./logo-manifest";
import { isTeam2026 } from "./teams-2026";
import { buildUiRemoteLogoChain } from "./team-logo-urls";
import { toClientLogoSources } from "./logo-client-url";



export type LogoRuntimeConfig = {

  cacheVersion?: string;

  overrides?: LogoOverridesFile;

};



function bust(url: string, cacheVersion: string): string {

  const sep = url.includes("?") ? "&" : "?";

  return `${url}${sep}v=${encodeURIComponent(cacheVersion)}`;

}



export function resolveTeamLogoSlug(slug: string): string {

  const fromAlias = TEAM_ROSTER_ALIASES[slug];

  if (fromAlias) return fromAlias;

  const normalized = normalizeParticipantSlug(slug);

  if (normalized) return TEAM_ROSTER_ALIASES[normalized] ?? normalized;

  return slug;

}



function getTeamOverrideEntry(slug: string, cfg?: LogoRuntimeConfig) {
  return cfg?.overrides?.teams[slug] ?? (teamLogoOverrideUrl(slug) ? { url: teamLogoOverrideUrl(slug) } : undefined);
}

function getTeamOverride(slug: string, cfg?: LogoRuntimeConfig): string | undefined {
  const entry = getTeamOverrideEntry(slug, cfg);
  return entry?.url?.trim() || teamLogoOverrideUrl(slug);
}

function teamSlugCandidates(slug: string): string[] {
  const canonical = resolveTeamLogoSlug(slug);
  return [...new Set([slug, canonical])];
}

function tournamentSlugCandidates(slug: string): string[] {
  const resolved = resolveTournamentSlug(slug);
  const set = new Set([slug, resolved]);
  for (const [alias, canon] of Object.entries(BSC_TOURNAMENT_ALIASES)) {
    if ([slug, resolved].includes(alias) || [slug, resolved].includes(canon)) {
      set.add(alias);
      set.add(canon);
    }
  }
  for (const [alias, canon] of Object.entries(TOURNAMENT_SLUG_ALIASES)) {
    if ([slug, resolved].includes(alias) || [slug, resolved].includes(canon)) {
      set.add(alias);
      set.add(canon);
    }
  }
  return [...set];
}

function collectOverrideUrls(
  slugs: string[],
  getUrl: (s: string) => string | undefined,
  cacheVersion: string,
): string[] {
  const urls: string[] = [];
  for (const s of slugs) {
    const overrideUrl = getUrl(s);
    if (!overrideUrl) continue;
    const busted = bust(overrideUrl, cacheVersion);
    if (!urls.includes(busted)) urls.unshift(busted);
  }
  return urls;
}



function getTournamentOverride(slug: string, cfg?: LogoRuntimeConfig): string | undefined {

  const fromRuntime = cfg?.overrides?.tournaments[slug]?.url?.trim();

  if (fromRuntime) return fromRuntime;

  return tournamentLogoOverrideUrl(slug);

}



/** Misma fuente en Home, Equipos, Fantasy, partidos… */

/** Prioridad máxima: URL del catálogo admin (mismo orden en Vercel y localhost). */
export function prependTeamLogoSources(
  sources: string[],
  extraUrls: (string | null | undefined)[],
  cacheVersion: string,
): string[] {
  const out = [...sources];
  for (const raw of extraUrls) {
    const url = raw?.trim();
    if (!url) continue;
    const busted = bust(url, cacheVersion);
    if (!out.includes(busted)) out.unshift(busted);
  }
  return toClientLogoSources(out);
}

export function buildTeamLogoSources(slug: string, cfg?: LogoRuntimeConfig): string[] {
  if (!isValidLogoSlug(slug)) return [];

  const cacheVersion = cfg?.cacheVersion ?? LOGO_CACHE_VERSION;
  const candidates = teamSlugCandidates(slug);
  const overrideOnly = collectOverrideUrls(candidates, (s) => getTeamOverride(s, cfg), cacheVersion);
  if (overrideOnly.length) return toClientLogoSources(overrideOnly);

  const sources: string[] = [];
  for (const s of candidates) {
    for (const url of buildUiRemoteLogoChain(s)) {
      if (!sources.includes(url)) sources.push(url);
    }
  }
  return toClientLogoSources(sources);
}



export function teamLogoSources(slug: string): string[] {

  return buildTeamLogoSources(slug);

}



/** Torneos BSC: logo visible (local optimizado + CDN) */

export function buildTournamentLogoSources(slug: string, cfg?: LogoRuntimeConfig): string[] {
  const cacheVersion = cfg?.cacheVersion ?? LOGO_CACHE_VERSION;
  const candidates = tournamentSlugCandidates(slug);
  const overrideOnly = collectOverrideUrls(
    candidates,
    (s) => getTournamentOverride(s, cfg),
    cacheVersion,
  );
  if (overrideOnly.length) return toClientLogoSources(overrideOnly);

  const resolved = resolveTournamentSlug(slug);
  const isBsc = /^bsc-2026|^world-finals/i.test(resolved) || /^bsc-2026|^world-finals/i.test(slug);
  if (isBsc) {
    return toClientLogoSources([bust(BSC_LOCAL_LOGO, cacheVersion), BSC_DEFAULT_LOGO]);
  }

  return toClientLogoSources([BSC_DEFAULT_LOGO]);
}



export function tournamentLogoSources(slug: string): string[] {

  return buildTournamentLogoSources(slug);

}



export function hasTeamLogoSource(slug: string, cfg?: LogoRuntimeConfig): boolean {

  const canonical = resolveTeamLogoSlug(slug);

  return (

    buildTeamLogoSources(slug, cfg).length > 0 ||

    hasProcessedTeamLogo(canonical) ||

    hasProcessedTeamLogo(slug) ||

    isTeam2026(canonical)

  );

}



export const teamPngSources = teamLogoSources;

export const tournamentPngSources = tournamentLogoSources;


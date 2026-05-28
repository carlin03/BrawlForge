import { liquipediaCommonsUrl } from "./tournament-logos";
import { normalizeParticipantSlug, TEAM_ROSTER_ALIASES, resolveTournamentSlug, getTournamentLogoFile } from "./catalog";

import { isValidLogoSlug } from "./logo-slugs";

import { BSC_DEFAULT_LOGO } from "./bsc-tournaments";

import { teamLogoOverrideUrl, tournamentLogoOverrideUrl } from "./logo-overrides";

import type { LogoOverridesFile } from "./logo-overrides";



const BSC_LOCAL_LOGO = "/images/bsc-2026.png";

import {

  hasProcessedTeamLogo,

  hasVerifiedLocalTournamentLogo,

  LOGO_CACHE_VERSION,

} from "./logo-manifest";

import { isTeam2026 } from "./teams-2026";

import { buildRemoteLogoChain } from "./team-logo-urls";



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



function localTeamUrl(slug: string, cacheVersion: string): string {

  return bust(`/logos/teams/${slug}.png`, cacheVersion);

}



function getTeamOverride(slug: string, cfg?: LogoRuntimeConfig): string | undefined {

  const fromRuntime = cfg?.overrides?.teams[slug]?.url?.trim();

  if (fromRuntime) return fromRuntime;

  return teamLogoOverrideUrl(slug);

}



function getTournamentOverride(slug: string, cfg?: LogoRuntimeConfig): string | undefined {

  const fromRuntime = cfg?.overrides?.tournaments[slug]?.url?.trim();

  if (fromRuntime) return fromRuntime;

  return tournamentLogoOverrideUrl(slug);

}



/** Misma fuente en Home, Equipos, Fantasy, partidos… */

export function buildTeamLogoSources(slug: string, cfg?: LogoRuntimeConfig): string[] {

  if (!isValidLogoSlug(slug)) return [];



  const cacheVersion = cfg?.cacheVersion ?? LOGO_CACHE_VERSION;

  const canonical = resolveTeamLogoSlug(slug);

  const candidates = [...new Set([canonical, slug])];

  const sources: string[] = [];



  for (const s of candidates) {

    const overrideUrl = getTeamOverride(s, cfg);

    if (overrideUrl) {

      const busted = bust(overrideUrl, cacheVersion);

      if (!sources.includes(busted)) sources.push(busted);

    }

    if (hasProcessedTeamLogo(s)) {

      const local = localTeamUrl(s, cacheVersion);

      if (!sources.includes(local)) sources.unshift(local);

    }

  }



  for (const s of candidates) {

    for (const url of buildRemoteLogoChain(s)) {

      if (!sources.includes(url)) sources.push(url);

    }

  }

  return sources;

}



export function teamLogoSources(slug: string): string[] {

  return buildTeamLogoSources(slug);

}



/** Torneos BSC: logo visible (local optimizado + CDN) */

export function buildTournamentLogoSources(slug: string, cfg?: LogoRuntimeConfig): string[] {

  const cacheVersion = cfg?.cacheVersion ?? LOGO_CACHE_VERSION;

  const resolved = resolveTournamentSlug(slug);

  const isBsc = /^bsc-2026|^world-finals/i.test(resolved) || /^bsc-2026|^world-finals/i.test(slug);



  if (isBsc) {

    const sources = [bust(BSC_LOCAL_LOGO, cacheVersion), BSC_DEFAULT_LOGO];

    for (const s of [resolved, slug]) {

      const overrideUrl = getTournamentOverride(s, cfg);

      if (overrideUrl && !sources.includes(bust(overrideUrl, cacheVersion))) {

        sources.unshift(bust(overrideUrl, cacheVersion));

      }

      if (!hasVerifiedLocalTournamentLogo(s)) continue;

      const local = bust(`/logos/tournaments/${s}.png`, cacheVersion);

      if (!sources.includes(local)) sources.unshift(local);

    }

    return sources;

  }



  const slugs = [...new Set([resolved, slug])];

  const sources: string[] = [];



  for (const s of slugs) {

    const overrideUrl = getTournamentOverride(s, cfg);

    if (overrideUrl) {

      const busted = bust(overrideUrl, cacheVersion);

      if (!sources.includes(busted)) sources.unshift(busted);

    }

    if (hasVerifiedLocalTournamentLogo(s)) {

      const local = bust(`/logos/tournaments/${s}.png`, cacheVersion);

      if (!sources.includes(local)) sources.push(local);

    }

    const file = getTournamentLogoFile(s);

    if (file) {

      const commons = liquipediaCommonsUrl(file);

      if (commons && !sources.includes(commons)) sources.push(commons);

    }

  }



  if (sources.length === 0) sources.push(BSC_DEFAULT_LOGO);

  return sources;

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


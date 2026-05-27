import { getGeneratedTeams, TEAM_ROSTER_ALIASES } from "./catalog";
import { isValidLogoSlug } from "./logo-slugs";
import { buildRemoteLogoChain } from "./team-logo-urls";
import {
  buildTournamentRemoteLogoChain,
  getTournamentLogoApiPath,
  liquipediaCommonsUrl,
} from "./tournament-logos";
import { resolveTournamentSlug } from "./catalog";

export function resolveTeamLogoSlug(slug: string): string {
  return TEAM_ROSTER_ALIASES[slug] ?? slug;
}

function teamLogoFile(slug: string): string | null {
  const team = getGeneratedTeams().find((t) => t.slug === slug);
  return team?.logoFile ?? null;
}

export function buildTeamLogoSources(slug: string): string[] {
  if (!isValidLogoSlug(slug)) return [];

  const canonical = resolveTeamLogoSlug(slug);
  const slugs = [...new Set([slug, canonical])];
  const sources: string[] = [];

  for (const s of slugs) {
    const local = `/logos/teams/${s}.png`;
    if (!sources.includes(local)) sources.push(local);
  }

  for (const s of slugs) {
    const api = `/api/logos/teams/${encodeURIComponent(s)}`;
    if (!sources.includes(api)) sources.push(api);
  }

  for (const s of slugs) {
    const file = teamLogoFile(s);
    if (file) {
      const commons = liquipediaCommonsUrl(file);
      if (commons && !sources.includes(commons)) sources.push(commons);
    }
  }

  for (const s of slugs) {
    for (const url of buildRemoteLogoChain(s)) {
      if (!sources.includes(url)) sources.push(url);
    }
  }

  return sources;
}

export function buildTournamentLogoSources(slug: string): string[] {
  const sources = [`/logos/tournaments/${slug}.png`, getTournamentLogoApiPath(slug)];
  const resolved = resolveTournamentSlug(slug);
  if (resolved !== slug) {
    const alt = `/logos/tournaments/${resolved}.png`;
    if (!sources.includes(alt)) sources.push(alt);
  }
  const fallbackLocals = [
    "/logos/tournaments/bsc-2026-brawl-cup.png",
    "/logos/tournaments/world-finals-2026.png",
    "/logos/tournaments/brawl-cup-2025.png",
  ];
  for (const local of fallbackLocals) {
    if (!sources.includes(local)) sources.push(local);
  }
  for (const url of buildTournamentRemoteLogoChain(slug)) {
    if (!sources.includes(url)) sources.push(url);
  }
  return sources;
}

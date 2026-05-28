import { BSC_DEFAULT_LOGO } from "./bsc-tournaments";
import { getTournamentLogoFile, resolveTournamentSlug } from "./catalog";
import { getTournament } from "./matches";

/** Liquipedia commons CDN — mismo patrón que sync scripts */
export function liquipediaCommonsUrl(filename: string): string {
  const f = filename.trim().replace(/ /g, "_");
  if (!f) return "";
  return `https://liquipedia.net/commons/images/${f[0]}/${f.slice(0, 2)}/${f}`;
}

export function getTournamentLogoFilename(slug: string): string | null {
  const resolved = resolveTournamentSlug(slug);
  return (
    getTournamentLogoFile(resolved) ??
    getTournamentLogoFile(slug) ??
    getTournament(resolved)?.logoFile ??
    getTournament(slug)?.logoFile ??
    null
  );
}

/** Fuentes remotas para logo de torneo (sin duplicar local) */
export function buildTournamentRemoteLogoChain(slug: string): string[] {
  const sources: string[] = [];
  const resolved = resolveTournamentSlug(slug);
  const slugs = [...new Set([slug, resolved])];

  for (const s of slugs) {
    const file = getTournamentLogoFilename(s);
    if (file) {
      const commons = liquipediaCommonsUrl(file);
      if (commons && !sources.includes(commons)) sources.push(commons);
    }
  }

  if (/^bsc-2026|^brawl-stars-championship-2026/i.test(slug) && !sources.includes(BSC_DEFAULT_LOGO)) {
    sources.push(BSC_DEFAULT_LOGO);
  }

  return sources;
}

/** Primera URL remota del torneo (PNG en CDN Liquipedia / BSC). */
export function getTournamentLogoRemote(slug: string): string | undefined {
  return buildTournamentRemoteLogoChain(slug)[0];
}

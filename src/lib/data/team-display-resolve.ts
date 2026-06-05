import { isBracketPlaceholderSlug } from "./bracket-slot-display";
import { isHiddenTeamSlug } from "./blocked-team-slugs";
import { isPendingTeamSlug, parseMatchMeta } from "./match-meta";
import type { EsportsMatch } from "./esports-match-types";
import { getTeam } from "./teams";

function isValidSchedulableSlug(slug: string): boolean {
  const key = slug?.trim().toLowerCase();
  return !!key && !isHiddenTeamSlug(key);
}

/** Nombre legible desde slug (p. ej. only-realm → Only Realm). */
export function slugToDisplayName(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .split("-")
    .filter(Boolean)
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

export function getTeamDisplayName(slug: string, liquipediaName?: string | null): string {
  const key = slug.trim().toLowerCase();
  if (isPendingTeamSlug(key)) return liquipediaName?.trim() || "Por definir";
  return getTeam(key)?.name ?? liquipediaName?.trim() ?? slugToDisplayName(key);
}

export function isTeamInCatalog(slug: string): boolean {
  return !!getTeam(slug.trim().toLowerCase());
}

/** Equipo válido en calendario aunque no exista aún en el catálogo CMS. */
export function isSchedulableTeamSlug(slug: string): boolean {
  if (!isValidSchedulableSlug(slug)) return false;
  if (isPendingTeamSlug(slug)) return false;
  if (isBracketPlaceholderSlug(slug)) return false;
  return true;
}

export function isSchedulableMatch(m: EsportsMatch): boolean {
  return isSchedulableTeamSlug(m.teamASlug) && isSchedulableTeamSlug(m.teamBSlug);
}

export function resolveMatchTeamName(
  match: Pick<EsportsMatch, "teamASlug" | "teamBSlug" | "meta">,
  side: "A" | "B",
): string {
  const slug = side === "A" ? match.teamASlug : match.teamBSlug;
  const meta = parseMatchMeta(match.meta);
  const lpName = side === "A" ? meta.team_display?.a : meta.team_display?.b;
  return getTeamDisplayName(slug, lpName);
}

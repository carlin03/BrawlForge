/**
 * Equipos fantasma (slug "." / nombre "punto (.)") — nunca mostrar ni usar.
 */
const HIDDEN_SLUGS = new Set(["", ".", "punto", "tbd", "team"]);

const HIDDEN_NAME_PATTERNS = [
  /^\.+$/,
  /^punto\s*\(\s*\.\s*\)$/i,
  /^punto$/i,
  /^\(\s*\.\s*\)$/i,
];

export function normalizeTeamSlugKey(slug: string | null | undefined): string {
  return String(slug ?? "").trim().toLowerCase();
}

export function isHiddenTeamSlug(slug: string | null | undefined): boolean {
  const key = normalizeTeamSlugKey(slug);
  if (!key) return true;
  if (HIDDEN_SLUGS.has(key)) return true;
  if (/^\.+$/.test(key)) return true;
  return false;
}

export function isHiddenTeamName(name: string | null | undefined): boolean {
  const n = String(name ?? "").trim();
  if (!n) return false;
  const lower = n.toLowerCase();
  for (const re of HIDDEN_NAME_PATTERNS) {
    if (re.test(lower) || re.test(n)) return true;
  }
  return false;
}

export function isHiddenTeam(row: {
  slug?: string | null;
  name?: string | null;
}): boolean {
  return isHiddenTeamSlug(row.slug) || isHiddenTeamName(row.name);
}

export function filterVisibleTeams<T extends { slug: string; name?: string | null }>(rows: T[]): T[] {
  return rows.filter((r) => !isHiddenTeam(r));
}

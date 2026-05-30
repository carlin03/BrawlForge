/** Clave antiduplicados: torneo + equipos + día (UTC). */

export function matchDedupDay(iso: string): string {
  return iso.slice(0, 10);
}

export function normalizeTeamPair(teamA: string, teamB: string): [string, string] {
  const a = teamA.trim().toLowerCase();
  const b = teamB.trim().toLowerCase();
  return a < b ? [a, b] : [b, a];
}

export function matchDedupKey(tournamentSlug: string, teamA: string, teamB: string, day: string): string {
  const [a, b] = normalizeTeamPair(teamA, teamB);
  return `${tournamentSlug}|${a}|${b}|${day}`;
}

export type CatalogMatchRow = {
  id: string;
  tournament_slug: string;
  team_a_slug: string;
  team_b_slug: string;
  scheduled_at: string;
  status: string;
  stage: string | null;
  region: string | null;
  format: string | null;
  score_a: number;
  score_b: number;
  meta: Record<string, unknown>;
  published: boolean;
};

export function rowMatchesDedup(
  row: CatalogMatchRow,
  tournamentSlug: string,
  teamA: string,
  teamB: string,
  day: string,
): boolean {
  if (row.tournament_slug !== tournamentSlug) return false;
  if (matchDedupDay(row.scheduled_at) !== day) return false;
  const [wantA, wantB] = normalizeTeamPair(teamA, teamB);
  const [haveA, haveB] = normalizeTeamPair(row.team_a_slug, row.team_b_slug);
  return wantA === haveA && wantB === haveB;
}

export function findMatchByDedup(
  rows: CatalogMatchRow[],
  tournamentSlug: string,
  teamA: string,
  teamB: string,
  day: string,
): CatalogMatchRow | undefined {
  return rows.find((r) => rowMatchesDedup(r, tournamentSlug, teamA, teamB, day));
}

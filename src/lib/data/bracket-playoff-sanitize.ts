import type { EsportsMatch } from "./matches";
import { normalizePlayoffPool } from "./playoff-pool-normalize";
import { getMatchStageMeta } from "./match-stage-meta";

const SEMI_SLOTS: [string, string][] = [
  ["winner-qf-0", "winner-qf-1"],
  ["winner-qf-2", "winner-qf-3"],
];

function roundKey(m: EsportsMatch): string {
  return getMatchStageMeta(m.stage).roundKey;
}

function sortByDate(list: EsportsMatch[]): EsportsMatch[] {
  return [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/** Torneo con 4+ cuartos: semis/final solo slots winner-* (nunca spoilers de CMS). */
export function sanitizePlayoffBracketPool(pool: EsportsMatch[]): EsportsMatch[] {
  const byTour = new Map<string, EsportsMatch[]>();
  for (const m of normalizePlayoffPool(pool)) {
    const arr = byTour.get(m.tournamentSlug) ?? [];
    arr.push(m);
    byTour.set(m.tournamentSlug, arr);
  }

  const out = new Map(pool.map((m) => [m.id, m]));

  for (const matches of byTour.values()) {
    const quarters = sortByDate(matches.filter((m) => roundKey(m) === "quarter"));
    if (quarters.length < 4) continue;

    const semis = sortByDate(
      matches.filter((m) => roundKey(m) === "semi" || (/semifinal/i.test(m.stage) && !/grand/i.test(m.stage))),
    );
    semis.forEach((m, i) => {
      const slot = SEMI_SLOTS[i] ?? [`winner-qf-${i * 2}`, `winner-qf-${i * 2 + 1}`];
      out.set(m.id, { ...m, teamASlug: slot[0], teamBSlug: slot[1] });
    });

    const gf =
      matches.find((m) => roundKey(m) === "grand_final") ??
      matches.find(
        (m) => roundKey(m) === "final" && !/semi|quarter|cuartos/i.test(m.stage),
      );
    if (gf) {
      out.set(gf.id, { ...gf, teamASlug: "winner-sf-0", teamBSlug: "winner-sf-1" });
    }
  }

  return [...out.values()];
}

export function countTournamentQuarters(pool: EsportsMatch[], tournamentSlug: string): number {
  return pool.filter(
    (m) => m.tournamentSlug === tournamentSlug && roundKey(m) === "quarter",
  ).length;
}

/** BSC solo publicó cuartos (1–3): no mostrar semis/final con equipos en pick'em. */
export function shouldHideIncompletePlayoffRound(
  pool: EsportsMatch[],
  m: EsportsMatch,
): boolean {
  const rk = roundKey(m);
  if (rk !== "semi" && rk !== "final" && rk !== "grand_final") return false;
  const qCount = countTournamentQuarters(pool, m.tournamentSlug);
  if (qCount === 0) return false;
  return qCount < 4;
}

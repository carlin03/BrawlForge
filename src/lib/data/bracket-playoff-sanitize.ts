import { sortBracketRoundMatches } from "./bracket-order";
import { isBracketPlaceholderSlug } from "./bracket-slot-display";
import type { EsportsMatch } from "./matches";
import { canonicalTournamentSlug, normalizePlayoffPool } from "./playoff-pool-normalize";
import { getMatchStageMeta } from "./match-stage-meta";

const SEMI_SLOTS: [string, string][] = [
  ["winner-qf-0", "winner-qf-1"],
  ["winner-qf-2", "winner-qf-3"],
];

function roundKey(m: EsportsMatch): string {
  return getMatchStageMeta(m.stage).roundKey;
}

function tourKey(slug: string): string {
  return canonicalTournamentSlug(slug);
}

/** Torneo con 4+ cuartos: semis/final solo slots winner-* (nunca spoilers de CMS). */
export function sanitizePlayoffBracketPool(pool: EsportsMatch[]): EsportsMatch[] {
  const byTour = new Map<string, EsportsMatch[]>();
  for (const m of normalizePlayoffPool(pool)) {
    const key = tourKey(m.tournamentSlug);
    const arr = byTour.get(key) ?? [];
    arr.push(m);
    byTour.set(key, arr);
  }

  const out = new Map(pool.map((m) => [m.id, m]));

  for (const matches of byTour.values()) {
    const quarters = sortBracketRoundMatches(matches.filter((m) => roundKey(m) === "quarter"));
    if (quarters.length < 4) continue;

    const semis = sortBracketRoundMatches(
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
  const key = tourKey(tournamentSlug);
  return pool.filter((m) => tourKey(m.tournamentSlug) === key && roundKey(m) === "quarter").length;
}

function semiUsesBracketSlots(m: EsportsMatch): boolean {
  return isBracketPlaceholderSlug(m.teamASlug) || isBracketPlaceholderSlug(m.teamBSlug);
}

/** Oculta semis/final con spoilers si faltan cuartos y aún no hay slots winner-*. */
export function shouldHideIncompletePlayoffRound(
  pool: EsportsMatch[],
  m: EsportsMatch,
): boolean {
  const rk = roundKey(m);
  if (rk !== "semi" && rk !== "final" && rk !== "grand_final") return false;
  const qCount = countTournamentQuarters(pool, m.tournamentSlug);
  if (qCount === 0) return false;
  if (qCount >= 4) return false;
  if (semiUsesBracketSlots(m)) return false;
  return true;
}

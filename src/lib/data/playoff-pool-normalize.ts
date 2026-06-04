import { BSC_TOURNAMENT_ALIASES } from "./bsc-tournaments";
import { getEffectiveMatchStatus } from "./match-effective-status";
import type { EsportsMatch } from "./matches";
import { getMatchStageMeta } from "./match-stage-meta";

const MAX_QUARTERS = 4;
const MAX_SEMIS = 2;

/** Unifica alias (p. ej. s3-emea ↔ april-emea) para no partir el bracket en dos. */
export function canonicalTournamentSlug(slug: string): string {
  return BSC_TOURNAMENT_ALIASES[slug] ?? slug;
}

export function matchDedupeKey(m: EsportsMatch): string {
  const tour = canonicalTournamentSlug(m.tournamentSlug);
  const a = m.teamASlug;
  const b = m.teamBSlug;
  const pair = a < b ? `${a}|${b}` : `${b}|${a}`;
  const day = m.date?.slice(0, 10) ?? "";
  const rk = getMatchStageMeta(m.stage).roundKey;
  return `${tour}|${rk}|${pair}|${day}`;
}

function sortByDate(list: EsportsMatch[]): EsportsMatch[] {
  return [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function roundKey(m: EsportsMatch): string {
  return getMatchStageMeta(m.stage).roundKey;
}

function isPlayoffRound(rk: string): boolean {
  return rk === "quarter" || rk === "semi" || rk === "final" || rk === "grand_final";
}

/** Prefiere CMS/DB terminado o con marcador frente al seed BSC estático. */
export function pickBetterMatch(a: EsportsMatch, b: EsportsMatch): EsportsMatch {
  const sa = getEffectiveMatchStatus(a);
  const sb = getEffectiveMatchStatus(b);
  if (sa === "finished" && sb !== "finished") return a;
  if (sb === "finished" && sa !== "finished") return b;
  const scoreA = a.scoreA + a.scoreB;
  const scoreB = b.scoreA + b.scoreB;
  if (scoreA !== scoreB) return scoreA > scoreB ? a : b;
  return a.id.startsWith("mf26-") || a.id.startsWith("chal-") ? b : a;
}

function dedupeRound(matches: EsportsMatch[]): EsportsMatch[] {
  const byKey = new Map<string, EsportsMatch>();
  for (const m of matches) {
    const k = matchDedupeKey(m);
    const prev = byKey.get(k);
    byKey.set(k, prev ? pickBetterMatch(prev, m) : m);
  }
  return sortByDate([...byKey.values()]);
}

/**
 * Por torneo: máx. 4 cuartos, 2 semis, 1 gran final; dedupe CMS+BSC.
 * Evita “3 cuartos + 4 en fin” por datos duplicados o alias.
 */
export function normalizePlayoffPool(pool: EsportsMatch[]): EsportsMatch[] {
  const nonPlayoff: EsportsMatch[] = [];
  const playoffByTour = new Map<string, EsportsMatch[]>();

  for (const m of pool) {
    const rk = roundKey(m);
    if (!isPlayoffRound(rk)) {
      nonPlayoff.push(m);
      continue;
    }
    const canon = canonicalTournamentSlug(m.tournamentSlug);
    const list = playoffByTour.get(canon) ?? [];
    list.push({ ...m, tournamentSlug: canon });
    playoffByTour.set(canon, list);
  }

  const normalizedPlayoff: EsportsMatch[] = [];

  for (const [, matches] of playoffByTour) {
    const quarters = dedupeRound(matches.filter((m) => roundKey(m) === "quarter")).slice(0, MAX_QUARTERS);
    const semisRaw = dedupeRound(
      matches.filter(
        (m) =>
          roundKey(m) === "semi" ||
          (/semifinal/i.test(m.stage) && !/grand/i.test(m.stage)),
      ),
    );
    const gf =
      dedupeRound(matches.filter((m) => roundKey(m) === "grand_final"))[0] ??
      dedupeRound(
        matches.filter(
          (m) => roundKey(m) === "final" && !/semi|quarter|cuartos/i.test(m.stage),
        ),
      )[0];

    let semis = semisRaw.slice(0, MAX_SEMIS);
    if (quarters.length > 0 && quarters.length < MAX_QUARTERS) {
      semis = [];
    }

    normalizedPlayoff.push(...quarters, ...semis, ...(gf ? [gf] : []));
  }

  return [...nonPlayoff, ...normalizedPlayoff];
}

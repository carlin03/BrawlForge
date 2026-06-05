import { BSC_TOURNAMENT_ALIASES, isBscCircuitSlug } from "./bsc-tournaments";
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

/** Mismo cruce sin ronda (Liquipedia "Match" vs BSC "Quarterfinal"). */
export function matchContentKey(m: EsportsMatch): string {
  const tour = canonicalTournamentSlug(m.tournamentSlug);
  const a = m.teamASlug;
  const b = m.teamBSlug;
  const pair = a < b ? `${a}|${b}` : `${b}|${a}`;
  const day = m.date?.slice(0, 10) ?? "";
  return `${tour}|${pair}|${day}`;
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

function isFutureScheduled(m: EsportsMatch): boolean {
  const t = new Date(m.date).getTime();
  return !Number.isNaN(t) && t > Date.now();
}

/** Prefiere Liquipedia/CMS terminado; fusiona stage explícito del seed BSC. */
export function pickBetterMatch(a: EsportsMatch, b: EsportsMatch): EsportsMatch {
  const sa = getEffectiveMatchStatus(a);
  const sb = getEffectiveMatchStatus(b);
  const aFutureUp = sa === "upcoming" && isFutureScheduled(a);
  const bFutureUp = sb === "upcoming" && isFutureScheduled(b);
  if (aFutureUp && sb === "finished") return mergeStage(a, b);
  if (bFutureUp && sa === "finished") return mergeStage(b, a);
  if (sa === "finished" && sb !== "finished") return mergeStage(a, b);
  if (sb === "finished" && sa !== "finished") return mergeStage(b, a);
  const scoreA = a.scoreA + a.scoreB;
  const scoreB = b.scoreA + b.scoreB;
  if (scoreA !== scoreB) return scoreA > scoreB ? mergeStage(a, b) : mergeStage(b, a);

  const aLp = a.id.startsWith("lp-");
  const bLp = b.id.startsWith("lp-");
  if (aLp && !bLp) return mergeStage(a, b);
  if (bLp && !aLp) return mergeStage(b, a);

  const aSeed = a.id.startsWith("mf26-") || a.id.startsWith("chal-") || a.id.startsWith("bc26-");
  const bSeed = b.id.startsWith("mf26-") || b.id.startsWith("chal-") || b.id.startsWith("bc26-");
  if (aSeed && !bSeed) return mergeStage(b, a);
  if (bSeed && !aSeed) return mergeStage(a, b);
  return mergeStage(a, b);
}

function mergeStage(winner: EsportsMatch, other: EsportsMatch): EsportsMatch {
  const wRk = getMatchStageMeta(winner.stage).roundKey;
  const oRk = getMatchStageMeta(other.stage).roundKey;
  if (wRk === "other" && oRk !== "other") {
    return { ...winner, stage: other.stage };
  }
  return winner;
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

  for (const [canon, matches] of playoffByTour) {
    const strictBracket = isBscCircuitSlug(canon);
    const quartersAll = dedupeRound(matches.filter((m) => roundKey(m) === "quarter"));
    const quarters = strictBracket ? quartersAll.slice(0, MAX_QUARTERS) : quartersAll;
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

    const semis = strictBracket ? semisRaw.slice(0, MAX_SEMIS) : semisRaw;

    normalizedPlayoff.push(...quarters, ...semis, ...(gf ? [gf] : []));
  }

  return [...nonPlayoff, ...normalizedPlayoff];
}

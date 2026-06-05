import { poolMergeKey } from "./bracket-order";
import { getGeneratedMatches, normalizeParticipantSlug, type GeneratedMatch } from "./catalog";
import { isBscCircuitSlug } from "./bsc-tournaments";
import type { EsportsMatch } from "./esports-match-types";
import { pickBetterMatch } from "./playoff-pool-normalize";
import { isSchedulableMatch } from "./team-display-resolve";

const MONTH_TO_NUM: Record<string, string> = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
};

const MIN_LIQUIPEDIA_MATCH_YEAR = 2025;

/** Torneos Liquipedia fuera del circuito BSC curado (AGG, Challengers regionales, ligas SA…). */
export function isLiquipediaNonBscTournament(slug: string): boolean {
  const s = slug.trim().toLowerCase();
  if (!s || isBscCircuitSlug(s)) return false;
  if (/^bsc-2026|^world-finals-2026/.test(s)) return false;
  if (/^brawl-stars-championship-/.test(s)) return false;
  return true;
}

function isRecentLiquipediaMatchDate(date: string): boolean {
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) && year >= MIN_LIQUIPEDIA_MATCH_YEAR;
}

function tryMonthTokenDate(raw: string): string | null {
  const m = raw.match(/([A-Za-z]+)T(\d{1,2})[^,]*,T(\d{4})/i);
  if (!m) return null;
  const mon = MONTH_TO_NUM[m[1].toLowerCase()];
  if (!mon) return null;
  const day = m[2].padStart(2, "0");
  return `${m[3]}-${mon}-${day}T12:00:00.000Z`;
}

/** Normaliza fechas rotas del parser Liquipedia (T-T18:00TZ, MayT30,T2026Z…). */
export function normalizeLiquipediaMatchDate(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const fixed = s
      .replace(/T-T/gi, "T")
      .replace(/T(\d{2}:\d{2})Z$/i, "T$1:00Z")
      .replace(/TZ$/i, "Z");
    const t = Date.parse(fixed.endsWith("Z") ? fixed : `${fixed}Z`);
    if (!Number.isNaN(t)) return new Date(t).toISOString();
  }

  const isoDay = s.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoDay) return `${isoDay[1]}T12:00:00.000Z`;

  return tryMonthTokenDate(s);
}

function matchupDayKey(m: Pick<EsportsMatch, "teamASlug" | "teamBSlug" | "date">): string {
  const a = m.teamASlug;
  const b = m.teamBSlug;
  const pair = a < b ? `${a}|${b}` : `${b}|${a}`;
  const day = m.date?.slice(0, 10) ?? "";
  return `${pair}|${day}`;
}

/** Liquipedia suele dejar stage "Match" — inferir ronda por nombre del torneo. */
function inferLiquipediaStage(tournamentSlug: string, rawStage: string): string {
  const stage = (rawStage || "Match").trim();
  if (stage && stage.toLowerCase() !== "match" && stage.toLowerCase() !== "series") {
    return stage;
  }
  const s = tournamentSlug.toLowerCase();
  if (/group-stage|main-stage|swiss|round-robin|league-group/.test(s)) return "Group Stage";
  if (/grand-final|gran-final/.test(s)) return "Grand Final";
  if (/-finals?$|_finals?$/.test(s) && !/monthly|world|grand/.test(s)) return "Match";
  if (/quarter|ro16|round-of-16|playoffs/.test(s)) return "Quarterfinal";
  return stage || "Match";
}

function toLiquipediaId(m: GeneratedMatch, day: string): string {
  const base = m.id.startsWith("lp-") ? m.id : `lp-${m.id}`;
  if (base.includes(day)) return base.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  return `lp-${m.tournamentSlug}-${m.teamASlug}-vs-${m.teamBSlug}-${day}`.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

function resolveTeamSlug(raw: string): string | null {
  const n = normalizeParticipantSlug(raw);
  if (n) return n;
  const key = raw.trim().toLowerCase();
  if (!key || key === "tbd" || key === "team") return null;
  return key;
}

function buildLiquipediaMatch(m: GeneratedMatch, allowBsc: boolean): EsportsMatch | null {
  const isBsc = isBscCircuitSlug(m.tournamentSlug);
  if (isBsc && !allowBsc) return null;
  if (!isBsc && !isLiquipediaNonBscTournament(m.tournamentSlug)) return null;

  const teamASlug = resolveTeamSlug(m.teamASlug);
  const teamBSlug = resolveTeamSlug(m.teamBSlug);
  if (!teamASlug || !teamBSlug) return null;

  const date = normalizeLiquipediaMatchDate(m.date);
  if (!date || !isRecentLiquipediaMatchDate(date)) return null;

  const day = date.slice(0, 10);
  const match: EsportsMatch = {
    id: toLiquipediaId(m, day),
    teamASlug,
    teamBSlug,
    scoreA: m.scoreA ?? 0,
    scoreB: m.scoreB ?? 0,
    tournamentSlug: m.tournamentSlug,
    stage: inferLiquipediaStage(m.tournamentSlug, m.stage || "Match"),
    date,
    status: m.status,
    region: m.region,
    format: m.format || "Bo3",
    meta: { schedule_trust: "confirmed" },
  };

  return isSchedulableMatch(match) ? match : null;
}

export function generatedMatchToEsportsMatch(m: GeneratedMatch): EsportsMatch | null {
  return buildLiquipediaMatch(m, false);
}

export function generatedMatchToBscLiquipediaMatch(m: GeneratedMatch): EsportsMatch | null {
  return buildLiquipediaMatch(m, true);
}

function dedupeLiquipediaMatches(list: EsportsMatch[]): EsportsMatch[] {
  const byContent = new Map<string, EsportsMatch>();
  for (const m of list) {
    const key = poolMergeKey(m);
    const prev = byContent.get(key);
    byContent.set(key, prev ? pickBetterMatch(prev, m) : m);
  }
  return [...byContent.values()];
}

const LP_IMPORT_MIN_YEAR = 2025;
const LP_IMPORT_MAX_FUTURE_MS = 365 * 24 * 60 * 60 * 1000;

function isLiquipediaImportCandidate(m: GeneratedMatch, includeBsc: boolean): boolean {
  const isBsc = isBscCircuitSlug(m.tournamentSlug);
  if (isBsc && !includeBsc) return false;
  if (!isBsc && !isLiquipediaNonBscTournament(m.tournamentSlug)) return false;

  const year = Number((m.date ?? "").slice(0, 4));
  if (Number.isFinite(year) && year >= LP_IMPORT_MIN_YEAR) {
    if (m.status === "finished" && year < 2026 && m.scoreA === m.scoreB) return false;
    return true;
  }

  const normalized = normalizeLiquipediaMatchDate(m.date);
  if (!normalized) return false;
  const ts = Date.parse(normalized);
  if (Number.isNaN(ts)) return false;
  if (ts < Date.UTC(LP_IMPORT_MIN_YEAR, 0, 1)) return false;
  if (m.status === "upcoming" && ts > Date.now() + LP_IMPORT_MAX_FUTURE_MS) return false;
  if (m.status === "finished" && m.scoreA === m.scoreB && ts < Date.UTC(2026, 0, 1)) return false;
  return true;
}

let liquipediaNonBscCache: EsportsMatch[] | null = null;
let liquipediaBscCache: EsportsMatch[] | null = null;

function parseLiquipediaPool(
  includeBsc: boolean,
  mapper: (m: GeneratedMatch) => EsportsMatch | null,
): EsportsMatch[] {
  return dedupeLiquipediaMatches(
    getGeneratedMatches()
      .filter((m) => isLiquipediaImportCandidate(m, includeBsc))
      .map(mapper)
      .filter((m): m is EsportsMatch => m !== null),
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/** Cruces Liquipedia 2025–2026 fuera de BSC, sin TBD ni fechas inválidas. */
export function getLiquipediaNonBscMatches(): EsportsMatch[] {
  if (liquipediaNonBscCache) return liquipediaNonBscCache;
  liquipediaNonBscCache = parseLiquipediaPool(false, generatedMatchToEsportsMatch);
  return liquipediaNonBscCache;
}

/** Partidos BSC en Liquipedia que aún no están en el pool curado. */
export function getLiquipediaBscSupplementMatches(): EsportsMatch[] {
  if (liquipediaBscCache) return liquipediaBscCache;
  liquipediaBscCache = parseLiquipediaPool(true, generatedMatchToBscLiquipediaMatch).filter((m) =>
    isBscCircuitSlug(m.tournamentSlug),
  );
  return liquipediaBscCache;
}

/** Evita duplicar un cruce BSC ya presente el mismo día (p. ej. Challengers LP vs bsc-2026-challengers-*). */
export function shouldSkipNonBscDuplicate(
  incoming: EsportsMatch,
  existing: Iterable<EsportsMatch>,
): boolean {
  const key = matchupDayKey(incoming);
  for (const m of existing) {
    if (!isBscCircuitSlug(m.tournamentSlug)) continue;
    if (matchupDayKey(m) === key) return true;
  }
  return false;
}

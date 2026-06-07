import { isBscCircuitSlug } from "./bsc-tournaments";
import { parseMatchMeta } from "./match-meta";

export const LP_PLACEHOLDER_DAY = "2026-06-06";
const LP_PLACEHOLDER_DAYS = new Set(["2026-06-06", "2026-06-07"]);

const LP_UPCOMING_MAX_FUTURE_MS = 240 * 24 * 60 * 60 * 1000;
const LP_UPCOMING_PAST_GRACE_MS = 12 * 60 * 60 * 1000;

export function isPlaceholderLiquipediaDate(date: string | undefined): boolean {
  return LP_PLACEHOLDER_DAYS.has((date ?? "").slice(0, 10));
}

function okTeamSlug(slug: string): boolean {
  const k = slug.trim().toLowerCase();
  if (!k || k === "tbd" || k === "team" || k === "por-definir" || k.startsWith("winner-")) return false;
  return true;
}

/** Próximo Liquipedia con fecha validada (sin placeholder masivo). */
export function isValidLiquipediaUpcoming(m: {
  id?: string;
  tournamentSlug: string;
  teamASlug: string;
  teamBSlug: string;
  status: string;
  date: string;
  scoreA?: number;
  scoreB?: number;
  meta?: unknown;
}): boolean {
  if (m.status !== "upcoming") return false;
  if (!m.date?.trim()) return false;
  if (isPlaceholderLiquipediaDate(m.date)) return false;
  if (m.teamASlug === m.teamBSlug) return false;
  if (!okTeamSlug(m.teamASlug) || !okTeamSlug(m.teamBSlug)) return false;

  const ts = Date.parse(m.date);
  if (Number.isNaN(ts)) return false;
  const now = Date.now();
  if (ts < now - LP_UPCOMING_PAST_GRACE_MS) return false;
  if (ts > now + LP_UPCOMING_MAX_FUTURE_MS) return false;

  const year = Number(m.date.slice(0, 4));
  if (!Number.isFinite(year) || year < 2025) return false;

  const slug = m.tournamentSlug.trim().toLowerCase();
  if (/^brawl-stars-championship-/.test(slug)) return false;
  if (isBscCircuitSlug(m.tournamentSlug)) return false;

  const scoreA = m.scoreA ?? 0;
  const scoreB = m.scoreB ?? 0;
  if (scoreA > 0 || scoreB > 0) {
    if (scoreA !== scoreB) return false;
  }

  const meta = parseMatchMeta(m.meta);
  const hasLpNames = !!(meta.team_display?.a?.trim() && meta.team_display?.b?.trim());
  const isLpId = String(m.id ?? "").startsWith("lp-");
  return hasLpNames || isLpId;
}

/** Próximo publicable en home/calendario: circuito BSC 2026 con fecha real. */
export function isPublicBscUpcomingMatch(m: {
  tournamentSlug: string;
  status: string;
  date: string;
  meta?: unknown;
}): boolean {
  if (m.status !== "upcoming" && m.status !== "live") return false;
  if (!isBscCircuitSlug(m.tournamentSlug)) return false;
  if (isPlaceholderLiquipediaDate(m.date)) return false;
  return true;
}

/** Próximo visible: BSC oficial o Liquipedia validado. */
export function isPublicUpcomingMatch(m: {
  id?: string;
  tournamentSlug: string;
  teamASlug: string;
  teamBSlug: string;
  status: string;
  date: string;
  scoreA?: number;
  scoreB?: number;
  meta?: unknown;
}): boolean {
  if (m.status !== "upcoming" && m.status !== "live") return false;
  if (isPublicBscUpcomingMatch(m)) return true;
  return isValidLiquipediaUpcoming(m);
}

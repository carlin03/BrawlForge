import { BSC_UPCOMING_PREDICTION_MATCHES } from "./bsc-upcoming-predictions";
import { BSC_TOURNAMENT_ALIASES, bsc2026Tournaments } from "./bsc-tournaments";
import { getEffectiveMatchStatus } from "./match-effective-status";
import { isBracketPlaceholderSlug } from "./bracket-slot-display";
import { isPendingTeamSlug, parseMatchMeta, type MatchMeta } from "./match-meta";
import { canonicalTournamentSlug } from "./playoff-pool-normalize";
import { isDisplayableMatch } from "./pickem-eligibility";
import type { EsportsMatch } from "./esports-match-types";

function tournamentEndDate(slug: string): string | undefined {
  const canon = BSC_TOURNAMENT_ALIASES[slug] ?? slug;
  const t = bsc2026Tournaments.find((x) => x.slug === canon || x.slug === slug);
  return t?.endDate;
}

export type ScheduleTrust = "confirmed" | "template" | "generated";

/** Solo IDs del seed pick'em (jun/jul futuros, challengers inventados) — no mf26-mar/apr reales. */
const PICKEM_TEMPLATE_IDS = new Set(BSC_UPCOMING_PREDICTION_MATCHES.map((m) => m.id));

/** Partidos del seed BSC para pick'em — no son calendario oficial confirmado. */
export function isPickemTemplateId(id: string): boolean {
  return PICKEM_TEMPLATE_IDS.has(id);
}

export function isPickemTemplateMatch(m: EsportsMatch): boolean {
  const meta = parseMatchMeta(m.meta);
  if (meta.schedule_trust === "template") return true;
  if (meta.pickem_only === true) return true;
  return isPickemTemplateId(m.id);
}

export function isGeneratedBracketMatch(m: EsportsMatch): boolean {
  return parseMatchMeta(m.meta).schedule_trust === "generated";
}

/** Liquipedia / CMS manual / sync con resultado. */
export function isConfirmedScheduleMatch(m: EsportsMatch): boolean {
  if (isPickemTemplateMatch(m)) return false;
  const meta = parseMatchMeta(m.meta);
  if (meta.schedule_trust === "confirmed") return true;
  if (m.id.startsWith("lp-")) return true;
  if (meta.schedule_trust === "generated") return false;
  const status = getEffectiveMatchStatus(m);
  if (status === "finished" || status === "live") return true;
  if ((m.scoreA > 0 || m.scoreB > 0) && m.scoreA !== m.scoreB) return true;
  return false;
}

/** Torneo ya terminó pero el partido sigue en upcoming → fantasma de datos viejos. */
export function isStaleTournamentUpcoming(m: EsportsMatch): boolean {
  if (getEffectiveMatchStatus(m) !== "upcoming") return false;
  const endIso = tournamentEndDate(m.tournamentSlug);
  if (!endIso) return false;
  const end = new Date(`${endIso}T23:59:59Z`).getTime();
  if (Number.isNaN(end)) return false;
  return Date.now() > end + 24 * 60 * 60 * 1000;
}

/** Próximos/en vivo en calendario: confirmados + plantillas con dos equipos reales (cuartos MF). */
export function isPublicUpcomingCalendarMatch(m: EsportsMatch): boolean {
  if (isStaleTournamentUpcoming(m)) return false;
  if (isPendingTeamSlug(m.teamASlug) || isPendingTeamSlug(m.teamBSlug)) return false;
  if (isBracketPlaceholderSlug(m.teamASlug) || isBracketPlaceholderSlug(m.teamBSlug)) return false;
  if (!isDisplayableMatch(m)) return false;
  const status = getEffectiveMatchStatus(m);
  if (status !== "upcoming" && status !== "live") return false;
  if (isPublicScheduleMatch(m)) return true;
  return isPickemTemplateMatch(m);
}

/** Pool unificado para /matches (resultados confirmados + próximos con plantilla si aplica). */
export function buildPublicCalendarPool(basePool: EsportsMatch[]): EsportsMatch[] {
  const byId = new Map<string, EsportsMatch>();
  for (const m of basePool) {
    if (isPublicScheduleMatch(m) || isPublicUpcomingCalendarMatch(m)) {
      byId.set(m.id, m);
    }
  }
  for (const m of getActivePickemTemplates(basePool)) {
    if (!isPublicUpcomingCalendarMatch(m)) continue;
    byId.set(m.id, m);
  }
  return [...byId.values()].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

/**
 * Calendario público confirmado (resultados / historial): sin plantillas pick'em.
 */
export function isPublicScheduleMatch(m: EsportsMatch): boolean {
  if (isPickemTemplateMatch(m)) return false;
  if (isStaleTournamentUpcoming(m)) return false;
  if (isPendingTeamSlug(m.teamASlug) || isPendingTeamSlug(m.teamBSlug)) return false;
  if (isBracketPlaceholderSlug(m.teamASlug) || isBracketPlaceholderSlug(m.teamBSlug)) return false;
  return isDisplayableMatch(m);
}

function withTemplateMeta(m: EsportsMatch): EsportsMatch {
  const meta: MatchMeta = {
    ...parseMatchMeta(m.meta),
    schedule_trust: "template",
    pickem_only: true,
  };
  return { ...m, meta };
}

/** Plantillas pick'em (no mezclar en getMatchPool). */
export function getPickemTemplateMatches(): EsportsMatch[] {
  return BSC_UPCOMING_PREDICTION_MATCHES.map(withTemplateMeta);
}

/** Plantillas abiertas de torneos sin partidos reales abiertos en el pool. */
export function getActivePickemTemplates(pool: EsportsMatch[]): EsportsMatch[] {
  const openRealTours = new Set(
    pool
      .filter((m) => !isPickemTemplateMatch(m) && getEffectiveMatchStatus(m) === "upcoming")
      .map((m) => canonicalTournamentSlug(m.tournamentSlug)),
  );

  return getPickemTemplateMatches().filter((m) => {
    if (getEffectiveMatchStatus(m) !== "upcoming") return false;
    const canon = canonicalTournamentSlug(m.tournamentSlug);
    return !openRealTours.has(canon);
  });
}

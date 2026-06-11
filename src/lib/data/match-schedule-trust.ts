import { getOfficialUpcomingCalendarMatches } from "./bsc-calendar-upcoming";
import { BSC_UPCOMING_PREDICTION_MATCHES } from "./bsc-upcoming-predictions";
import { BSC_TOURNAMENT_ALIASES, bsc2026Tournaments } from "./bsc-tournaments";
import { getEffectiveMatchStatus } from "./match-effective-status";
import { isBracketPlaceholderSlug } from "./bracket-slot-display";
import { isPendingTeamSlug, parseMatchMeta, type MatchMeta } from "./match-meta";
import { enrichMatchForPool } from "./match-pool-enrich";
import { fixMislabeledWorldFinalsSlug } from "./tournament-slug-sanitize";
import { canonicalTournamentSlug } from "./playoff-pool-normalize";
import { isValidLiquipediaUpcoming } from "./match-publish-rules";
import { isCuratedPublicTournamentSlug } from "./curated-tournaments";
import { isSchedulableMatch } from "./team-display-resolve";
import { getMatchStageMeta } from "./match-stage-meta";
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
  if (meta.schedule_trust === "confirmed" || meta.pickem_only === false) return false;
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
  const status = getEffectiveMatchStatus(m);
  if (meta.schedule_trust === "confirmed") return true;
  if (m.id.startsWith("lp-") && status === "upcoming") return isValidLiquipediaUpcoming(m);
  if (m.id.startsWith("lp-") && (status === "finished" || status === "live")) return true;
  if (meta.schedule_trust === "generated") return false;
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

function allowsPlayoffPlaceholderTeams(m: EsportsMatch): boolean {
  const rk = getMatchStageMeta(m.stage).roundKey;
  return rk === "semi" || rk === "final" || rk === "grand_final";
}

/** Próximos/en vivo: calendario confirmado + slots de bracket (semis/final). */
export function isPublicUpcomingCalendarMatch(m: EsportsMatch): boolean {
  if (isPickemTemplateMatch(m)) return false;
  if (isStaleTournamentUpcoming(m)) return false;
  const meta = parseMatchMeta(m.meta);
  const confirmed = meta.schedule_trust === "confirmed";

  const hasBracketSlot =
    isBracketPlaceholderSlug(m.teamASlug) || isBracketPlaceholderSlug(m.teamBSlug);
  const bothTbd =
    isPendingTeamSlug(m.teamASlug) &&
    isPendingTeamSlug(m.teamBSlug) &&
    !hasBracketSlot;
  if (bothTbd) return false;

  const placeholderOk =
    confirmed && allowsPlayoffPlaceholderTeams(m) && hasBracketSlot;

  if (!placeholderOk) {
    if (hasBracketSlot) return false;
    if (!isSchedulableMatch(m)) return false;
  }

  const status = getEffectiveMatchStatus(m);
  if (status !== "upcoming" && status !== "live") return false;

  if (confirmed) return true;
  return isPublicScheduleMatch(m);
}

/** Pool unificado para /matches: resultados + próximos confirmados (Liquipedia/CMS). Sin seed pick'em. */
export function buildPublicCalendarPool(basePool: EsportsMatch[]): EsportsMatch[] {
  const pool = basePool.map(enrichMatchForPool).map(fixMislabeledWorldFinalsSlug);
  const byId = new Map<string, EsportsMatch>();

  for (const m of pool) {
    if (isPublicScheduleMatch(m)) {
      byId.set(m.id, m);
    }
  }

  for (const m of pool) {
    if (!isPublicUpcomingCalendarMatch(m)) continue;
    byId.set(m.id, m);
  }

  for (const m of getOfficialUpcomingCalendarMatches(pool)) {
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
  if (!isCuratedPublicTournamentSlug(m.tournamentSlug)) return false;
  if (isPendingTeamSlug(m.teamASlug) || isPendingTeamSlug(m.teamBSlug)) return false;
  if (isBracketPlaceholderSlug(m.teamASlug) || isBracketPlaceholderSlug(m.teamBSlug)) return false;
  return isSchedulableMatch(m);
}

function withTemplateMeta(m: EsportsMatch): EsportsMatch {
  const meta: MatchMeta = {
    ...parseMatchMeta(m.meta),
    schedule_trust: "template",
    pickem_only: true,
  };
  return enrichMatchForPool({ ...m, meta });
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

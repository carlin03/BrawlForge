import { BSC_UPCOMING_PREDICTION_MATCHES } from "./bsc-upcoming-predictions";
import { bsc2026Tournaments } from "./bsc-tournaments";
import { isBracketPlaceholderSlug } from "./bracket-slot-display";
import { getEffectiveMatchStatus } from "./match-effective-status";
import { isPendingTeamSlug, parseMatchMeta, type MatchMeta } from "./match-meta";
import { enrichMatchForPool } from "./match-pool-enrich";
import { canonicalTournamentSlug } from "./playoff-pool-normalize";
import type { EsportsMatch } from "./esports-match-types";

function tournamentIsOpen(slug: string): boolean {
  const canon = canonicalTournamentSlug(slug);
  const t = bsc2026Tournaments.find((x) => x.slug === canon || x.slug === slug);
  return t?.status === "upcoming" || t?.status === "live";
}

function withConfirmedCalendarMeta(m: EsportsMatch): EsportsMatch {
  const meta: MatchMeta = {
    ...parseMatchMeta(m.meta),
    schedule_trust: "confirmed",
    pickem_only: false,
  };
  return enrichMatchForPool({ ...m, meta });
}

function isFutureMatch(m: EsportsMatch): boolean {
  const t = new Date(m.date).getTime();
  return !Number.isNaN(t) && t > Date.now();
}

function teamSlotOk(slug: string): boolean {
  if (isBracketPlaceholderSlug(slug)) return true;
  if (isPendingTeamSlug(slug)) return false;
  return Boolean(slug?.trim());
}

/** Cruces publicados o slots de bracket (winner-qf-*) — no ambos TBD. */
function isCalendarSchedulable(m: EsportsMatch): boolean {
  return teamSlotOk(m.teamASlug) && teamSlotOk(m.teamBSlug);
}

/**
 * Calendario BSC próximo (Liquipedia / fechas oficiales MF).
 * No son plantillas pick'em: cruces con equipos y horario publicados.
 */
export function getOfficialUpcomingCalendarMatches(_pool: EsportsMatch[]): EsportsMatch[] {
  return BSC_UPCOMING_PREDICTION_MATCHES.filter((raw) => {
    if (!tournamentIsOpen(raw.tournamentSlug)) return false;
    if (!isFutureMatch(raw)) return false;
    if (!isCalendarSchedulable(raw)) return false;
    if (getEffectiveMatchStatus(raw) !== "upcoming") return false;
    return true;
  }).map(withConfirmedCalendarMeta);
}

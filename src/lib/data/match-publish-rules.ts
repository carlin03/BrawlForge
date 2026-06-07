import { isBscCircuitSlug } from "./bsc-tournaments";

export const LP_PLACEHOLDER_DAY = "2026-06-06";

export function isPlaceholderLiquipediaDate(date: string | undefined): boolean {
  return (date ?? "").slice(0, 10) === LP_PLACEHOLDER_DAY;
}

/** Próximo publicable en home/calendario: solo circuito BSC 2026 con fecha real. */
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

import { isBscCircuitSlug, BSC_TOURNAMENT_ALIASES } from "./bsc-tournaments";
import { TOURNAMENT_SLUG_ALIASES } from "./catalog";

/** Solo circuito BSC 2026 (~52 eventos) — sin Supremacy, BIGG, RVL, etc. */
export function isCuratedPublicTournamentSlug(slug: string): boolean {
  const s = slug.trim().toLowerCase();
  if (!s) return false;
  if (isBscCircuitSlug(s)) return true;
  if (s === "world-finals-2026") return true;
  if (/^brawl-stars-championship-2026/i.test(s)) return true;
  if (/^brawl-stars-challengers/i.test(s)) return true;
  for (const [canonical, alias] of Object.entries(TOURNAMENT_SLUG_ALIASES)) {
    if (s === alias.toLowerCase() && isBscCircuitSlug(canonical)) return true;
  }
  for (const [alias, canonical] of Object.entries(BSC_TOURNAMENT_ALIASES)) {
    if (s === alias.toLowerCase() && isBscCircuitSlug(canonical)) return true;
  }
  return false;
}

import type { Region } from "../types";

/**
 * Región BSC 2026 por equipo — prevalece sobre teams-2026.json (Liquipedia suele marcar EA como EMEA).
 */
export const BSC_2026_REGION_BY_SLUG: Record<string, Region> = {
  // EMEA
  hmble: "EMEA",
  "fut-esports": "EMEA",
  "sk-gaming": "EMEA",
  "team-heretics": "EMEA",
  "natus-vincere": "EMEA",
  "totem-esports": "EMEA",
  "novo-esports": "EMEA",
  big: "EMEA",
  "big-talents": "EMEA",
  cmm: "EMEA",
  "fut-esports-academy": "EMEA",
  kebap: "EMEA",
  metizport: "EMEA",
  madridmira: "EMEA",
  "revenant-xspark": "EMEA",

  // East Asia
  "crazy-raccoon": "EA",
  "zeta-division": "EA",
  reject: "EA",
  "skcalalas-ea": "EA",
  "rival-esports": "EA",
  "wwl-esports": "EA",
  "feasible-gaming": "EA",
  "frenzy-esports": "EA",
  fennel: "EA",
  insomnia: "EA",
  "ace-xero": "EA",
  "toxic-lotus": "EA",

  // North America
  "tribe-gaming": "NA",
  "only-realm": "NA",
  "stmn-esports": "NA",
  "team-elektros": "NA",
  "vatic-esports": "NA",
  elevate: "NA",
  "f-a-homeless": "NA",
  "vic-day": "NA",
  "legacy-esports": "NA",

  // South America
  loud: "SA",
  skcalalas: "SA",
  "new-heights-gaming": "SA",
  kaioperro: "SA",
  "eternal-esports": "SA",
  "alguem-segura": "SA",
  "olimpo-squad": "SA",
  "bounty-hunters-esports": "SA",
  "enosis-esports": "SA",
  "bc-gaming-sa": "SA",
  "level-esports": "SA",
  oddyssey: "SA",
  "acre-lovers": "SA",
  "f-a-zurita-gaming": "SA",
};

export function getBsc2026TeamRegion(slug: string): Region | undefined {
  return BSC_2026_REGION_BY_SLUG[slug.trim().toLowerCase()];
}

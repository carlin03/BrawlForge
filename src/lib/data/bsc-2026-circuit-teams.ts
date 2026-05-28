/**
 * Equipos con actividad en el circuito BSC 2026 oficial (ene–ago 2026).
 * Fuentes: PSI, Monthly Finals/Qualifiers, Brawl Cup, Challengers, leaderboards Liquipedia,
 * partidos curados (bsc-matches), fantasy participants, Escharts/Supercell cross-check.
 *
 * No incluye torneos amateur de Liquipedia fuera del circuito Blast/Supercell.
 */
import circuitJson from "./generated/bsc-2026-circuit-teams.json";
import { BSC_FANTASY_PARTICIPANTS } from "./bsc-fantasy-participants";

/** Plantilla curada — orgs con partidos en MF/MQ/PSI/Brawl Cup/Challengers 2026 */
export const BSC_2026_CIRCUIT_CURATED: string[] = [
  // ── Global / multi-región (Brawl Cup, WF, LCQ path) ──
  "hmble",
  "fut-esports",
  "tribe-gaming",
  "zeta-division",
  "crazy-raccoon",
  "only-realm",
  "bounty-hunters-esports",
  "ace-xero",
  "bc-gaming-sa",
  "eternal-esports",
  "revenant-xspark",
  "toxic-lotus",

  // ── EMEA ──
  "sk-gaming",
  "team-heretics",
  "natus-vincere",
  "totem-esports",
  "novo-esports",
  "metizport",
  "big",
  "big-talents",
  "kebap",
  "papara-supermassive",
  "oddyssey",
  "reject",
  "fut-esports-academy",

  // ── East Asia / CN ──
  "stmn-esports",
  "nova-esports",

  // ── North America ──
  "vatic-esports",
  "zoos-esports",
  "team-elektros",
  "enosis-esports",
  "kds-esports",
  "only-realm-na",
  "skcalalas",
  "skcalalas-na",

  // ── South America ──
  "loud",
  "skcalalas",
  "elevate",
  "oddyssey",
  "zurita-gang",
  "olimpo-squad",
  "acre-lovers",

  // ── India / cross-region ──
  "revenant-xspark",
];

function slugsFromFantasy(): string[] {
  const out = new Set<string>();
  for (const list of Object.values(BSC_FANTASY_PARTICIPANTS)) {
    for (const s of list) out.add(s);
  }
  return [...out];
}

function slugsFromDiscoveryJson(): string[] {
  const raw = circuitJson as { teamSlugs?: string[] };
  return Array.isArray(raw.teamSlugs) ? raw.teamSlugs : [];
}

/**
 * Slugs que existen en Liquipedia/catálogo histórico, pero no deben entrar como
 * club activo BSC 2026 si no aparecen en páginas oficiales 2026 actuales.
 */
export const BSC_2026_EXCLUDED_TEAM_SLUGS = new Set([
  "qlash",
  "spacestation-gaming",
]);

/** Slugs únicos del circuito BSC 2026 (curado + discovery Liquipedia + fantasy) */
export function getBsc2026CircuitTeamSlugs(): string[] {
  const out = new Set<string>();
  for (const s of BSC_2026_CIRCUIT_CURATED) {
    if (!BSC_2026_EXCLUDED_TEAM_SLUGS.has(s)) out.add(s);
  }
  for (const s of slugsFromFantasy()) {
    if (!BSC_2026_EXCLUDED_TEAM_SLUGS.has(s)) out.add(s);
  }
  for (const s of slugsFromDiscoveryJson()) {
    if (s !== "toc-team" && !BSC_2026_EXCLUDED_TEAM_SLUGS.has(s)) out.add(s);
  }
  return [...out].sort((a, b) => a.localeCompare(b));
}

export const BSC_2026_CIRCUIT_SLUGS = new Set(getBsc2026CircuitTeamSlugs());

/**
 * Equipos BSC 2026 — Tier B+ con actividad real (PSI, Preseason, MQ, MF, Brawl Cup).
 * Regiones y plantillas: bsc-2026-team-registry.ts + bsc-2026-rosters.ts
 */
export const BSC_2026_ACTIVE_TEAM_SLUGS: readonly string[] = [
  // EMEA
  "hmble",
  "fut-esports",
  "sk-gaming",
  "team-heretics",
  "natus-vincere",
  "totem-esports",
  "novo-esports",
  "big",
  "big-talents",
  "cmm",
  "fut-esports-academy",
  "kebap",
  "metizport",
  "madridmira",

  // East Asia
  "crazy-raccoon",
  "zeta-division",
  "reject",
  "skcalalas-ea",
  "rival-esports",
  "wwl-esports",
  "feasible-gaming",
  "frenzy-esports",
  "fennel",
  "insomnia",
  "ace-xero",
  "toxic-lotus",

  // North America
  "tribe-gaming",
  "only-realm",
  "stmn-esports",
  "team-elektros",
  "vatic-esports",
  "elevate",
  "f-a-homeless",
  "vic-day",
  "legacy-esports",

  // South America
  "loud",
  "skcalalas",
  "new-heights-gaming",
  "kaioperro",
  "eternal-esports",
  "alguem-segura",
  "olimpo-squad",
  "bounty-hunters-esports",
  "enosis-esports",
  "bc-gaming-sa",
  "level-esports",
  "oddyssey",
  "acre-lovers",
  "f-a-zurita-gaming",

  // Global / multi-región en Brawl Cup
  "revenant-xspark",
] as const;

/**
 * Fuera del circuito BSC 2026 — no listar en clubes, fantasy ni predicciones.
 */
export const BSC_2026_EXCLUDED_TEAM_SLUGS: readonly string[] = [
  "qlash",
  "qlash-spain",
  "qlash-latam",
  "papara-supermassive",
  "geng-esports",
  "cream-esports",
  "enterprise-esports",
  "alpha7-esports",
  "chasmac-gaming-br",
  "intz",
  "spacestation-gaming",
  "spacestation-gaming-brazil",
  "spacestation-gaming-sea",
  "nova-esports",
  "nova-esports-china",
  "only-realm-na",
  "skcalalas-na",
  "eternal-fire",
  "bc-gaming",
  "tribe-gaming-eu",
  "stmn-esports-eu",
  "kds-esports",
  "zoos-esports",
  "effort-result",
  "abc-ea-team",
  "zurita-gang",
] as const;

export const BSC_2026_ACTIVE_SLUG_SET = new Set<string>(BSC_2026_ACTIVE_TEAM_SLUGS);
export const BSC_2026_EXCLUDED_SLUG_SET = new Set<string>(BSC_2026_EXCLUDED_TEAM_SLUGS);

export function isBsc2026ExcludedTeam(slug: string): boolean {
  const n = slug.trim().toLowerCase();
  return BSC_2026_EXCLUDED_SLUG_SET.has(n);
}

export function isBsc2026ActiveTeam(slug: string): boolean {
  const n = slug.trim().toLowerCase();
  if (isBsc2026ExcludedTeam(n)) return false;
  return BSC_2026_ACTIVE_SLUG_SET.has(n);
}

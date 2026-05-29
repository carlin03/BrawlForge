/**
 * Equipos BSC 2026 — Tier B+ con actividad real (PSI, Preseason, MQ, MF, Brawl Cup).
 * Solo orgs que han jugado el circuito oficial 2026 (BSEN / Liquipedia).
 */
export const BSC_2026_ACTIVE_TEAM_SLUGS: readonly string[] = [
  "hmble",
  "fut-esports",
  "tribe-gaming",
  "zeta-division",
  "crazy-raccoon",
  "only-realm",
  "bounty-hunters-esports",

  "sk-gaming",
  "team-heretics",
  "natus-vincere",
  "totem-esports",
  "novo-esports",
  "big",
  "big-talents",
  "cmm",
  "fut-esports-academy",

  "reject",
  "skcalalas-ea",
  "rival-esports",
  "effort-result",
  "abc-ea-team",
  "wwl-esports",
  "feasible-gaming",
  "frenzy-esports",

  "vatic-esports",
  "team-elektros",
  "kds-esports",
  "stmn-esports",
  "elevate",

  "loud",
  "skcalalas",
  "new-heights-gaming",
  "kaioperro",
  "eternal-esports",
  "alguem-segura",
  "zurita-gang",
  "enosis-esports",
  "olimpo-squad",
  "bc-gaming-sa",
  "level-esports",

  "kebap",
  "metizport",
  "zoos-esports",

  "ace-xero",
  "toxic-lotus",
  "revenant-xspark",
] as const;

/**
 * Fuera del circuito BSC 2026 — no listar en clubes, fantasy ni predicciones.
 * QLASH nunca jugó; Papara/SSG/Nova/etc. no son el circuito actual.
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
  "oddyssey",
  "intz",
  "acre-lovers",
  "spacestation-gaming",
  "spacestation-gaming-brazil",
  "spacestation-gaming-sea",
  "nova-esports",
  "nova-esports-china",
  "only-realm-na",
  "skcalalas-na",
  "eternal-fire",
  "bc-gaming",
  "fennel",
  "tribe-gaming-eu",
  "stmn-esports-eu",
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

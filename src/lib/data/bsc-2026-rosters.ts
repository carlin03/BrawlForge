/**
 * Plantillas BSC 2026 — Liquipedia (activos + MF/PSI/Brawl Cup).
 * Actualizado desde liquipedia.net/brawlstars (mayo 2026).
 */
export const BSC_2026_ROSTERS: Record<string, string[]> = {
  "sk-gaming": ["yoshi", "ope", "nowy297"],
  "team-heretics": ["guillevgx", "ikaoss", "marco"],
  "crazy-raccoon": ["moya", "tensai", "milkreo"],
  loud: ["edinho", "firecrow", "kaiodog"],
  "tribe-gaming": ["diegogamer", "lxffy", "rbm"],
  "zeta-division": ["sizuku", "sitetampo", "battoman"],
  "fut-esports": ["angelboy", "guesti", "nob"],
  "natus-vincere": ["drage", "gero", "enraged"],
  "totem-esports": ["joker", "maru", "maury"],
  "spacestation-gaming": ["bobby", "chino", "sans"],
  "novo-esports": ["meow", "terry", "filippo"],
  hmble: ["lukii", "boss", "symantec"],
  reject: ["levi", "melty", "shu"],
  "stmn-esports": ["cyrad", "fen", "trappz"],
  "papara-supermassive": ["tomzy", "woodland", "salty"],
  "toxic-lotus": ["engine", "ou", "toc"],
  "revenant-xspark": ["hiroshii", "response", "sergeant-clash", "walkthrough"],
  skcalalas: ["juan-carlos", "kristian", "rhz"],
  "bc-gaming-sa": ["leo", "mica", "tomz", "ray092", "skyriikzz"],
  "only-realm": ["patchy", "ryuk", "storm"],
  "bounty-hunters-esports": ["portox", "prozy", "wesley"],
  "ace-xero": ["david", "galaxy", "nagi"],
  "eternal-esports": ["cauebr", "jubileu", "mohtep"],
  oddyssey: ["alan", "keaps", "yoko"],
  "vatic-esports": ["belal", "duckie", "ezlivi", "zee"],
};

/** Slugs de equipo con plantilla BSC 2026 */
export const BSC_2026_TEAM_SLUGS = Object.keys(BSC_2026_ROSTERS) as string[];

/** Jugadores fuera de plantilla 2026 (p. ej. bajas recientes en Liquipedia) */
export const BSC_2026_EXCLUDED_PLAYERS = new Set(["jxcr"]);

export const BSC_2026_PLAYER_SLUGS = new Set(
  Object.values(BSC_2026_ROSTERS).flat().filter((s) => !BSC_2026_EXCLUDED_PLAYERS.has(s)),
);

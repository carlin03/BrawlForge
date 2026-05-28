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
  "novo-esports": ["meow", "terry", "filippo"],
  hmble: ["lukii", "boss", "symantec"],
  reject: ["levi", "melty", "shu"],
  "stmn-esports": ["cyrad", "fen", "trappz"],
  "papara-supermassive": ["tomzy", "woodland", "salty"],
  "toxic-lotus": ["engine", "ou", "toc"],
  "revenant-xspark": ["hiroshii", "response", "sergeant-clash", "walkthrough"],
  skcalalas: ["juan-carlos", "kristian", "rhz"],
  "bc-gaming-sa": ["leo", "mica", "tomz", "ray092", "skyriikzz"],
  "only-realm": ["bobby", "patchy", "sans"],
  "bounty-hunters-esports": ["portox", "prozy", "wesley"],
  "ace-xero": ["david", "galaxy", "nagi"],
  "eternal-esports": ["cauebr", "jubileu", "mohtep"],
  oddyssey: ["alan", "keaps", "yoko"],
  "vatic-esports": ["belal", "duckie", "ezlivi", "zee"],
  "acre-lovers": ["fire-murilo", "satisfyer", "sennin"],
  "big-talents": ["dompe", "mine", "nes"],
  "olimpo-squad": ["brabao", "golden", "pekka"],
  "team-elektros": ["doin", "memen", "snoiy"],
  "zurita-gang": ["bryan", "exic", "jxcr"],
  big: ["arthur", "amos", "salty"],
  metizport: ["decaii", "iro"],
  kebap: ["yuffy"],
  elevate: ["tufa", "rei-do-fut", "redzin"],
  "enosis-esports": ["kirito", "godnoob", "math"],
  "fut-esports-academy": ["zeyrox", "ferissa", "master"],
  "kds-esports": ["bobby", "patchy", "sans"],
  "zoos-esports": ["duckie", "tyrant", "xemp"],
};

/** Slugs de equipo con plantilla BSC 2026 */
export const BSC_2026_TEAM_SLUGS = Object.keys(BSC_2026_ROSTERS) as string[];

/** Jugadores fuera de plantilla 2026 (p. ej. bajas recientes en Liquipedia) */
export const BSC_2026_EXCLUDED_PLAYERS = new Set<string>();

export const BSC_2026_PLAYER_SLUGS = new Set(
  Object.values(BSC_2026_ROSTERS).flat().filter((s) => !BSC_2026_EXCLUDED_PLAYERS.has(s)),
);

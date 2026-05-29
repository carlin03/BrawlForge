/**
 * Plantillas BSC 2026 — BSEN / Liquipedia (MF, PSI, preseason, roster trackers).
 * Fuente de verdad para fantasy y fichajes (teamSlug forzado aunque Liquipedia esté desactualizado).
 */
export const BSC_2026_ROSTERS: Record<string, string[]> = {
  "sk-gaming": ["nowy297", "ope", "yoshi"],
  "team-heretics": ["ikaoss", "marco", "subeme"],
  hmble: ["boss", "lukii", "symantec"],
  "totem-esports": ["joker", "maru", "maury"],
  "natus-vincere": ["drage", "gero", "lenain"],
  "fut-esports": ["angelboy", "guesti", "nob"],
  big: ["amos", "arthur", "salty"],
  "big-talents": ["dompe", "mine", "nes"],
  cmm: ["kellow", "mine", "dompe"],
  "novo-esports": ["filippo", "meow", "terry"],
  "fut-esports-academy": ["ferissa", "master", "zeyrox"],

  "zeta-division": ["battoman", "sitetampo", "sizuku"],
  "crazy-raccoon": ["milkreo", "moya", "tensai"],
  reject: ["levi", "melty", "shu"],
  "skcalalas-ea": ["ghost-t", "kuru", "naipishu"],
  "rival-esports": ["ryohei", "totoron", "yutapin"],
  "effort-result": ["jene-azure", "wahochi", "koga"],
  "abc-ea-team": ["achapi", "i-see", "ken-g"],
  "wwl-esports": ["cookie", "minzzun", "nenne"],
  "feasible-gaming": ["nyades", "sigemyon", "drake"],
  "frenzy-esports": ["danshari", "mira", "toridesu"],

  "tribe-gaming": ["diegogamer", "lxffy", "rbm"],
  "kds-esports": [],
  "stmn-esports": ["juan-carlos", "pain", "tacos"],
  "team-elektros": ["doin", "memen", "snoiy"],
  "vatic-esports": ["belal", "ezlivi", "rafiki"],
  "only-realm": ["bobby", "patchy", "sans"],
  elevate: ["duckie", "vegeta", "og"],

  loud: ["edinho", "firecrow", "kaiodog"],
  skcalalas: ["kristian", "pekka", "rhz"],
  "new-heights-gaming": ["portox", "wesley", "prozy"],
  kaioperro: ["derrp", "doritos", "loko"],
  "eternal-esports": ["cauebr", "jubileu", "mohtep"],
  "alguem-segura": ["nubis", "tufa", "zeus"],
  "olimpo-squad": ["brabao", "golden", "icecrow"],
  "bounty-hunters-esports": ["redzin", "bicho", "rei-do-fut"],
  "zurita-gang": ["bryan", "meliodas", "exic"],
  "enosis-esports": ["b4st", "deykon", "gun"],
  "bc-gaming-sa": ["leo", "mica", "tomz"],
  "level-esports": ["nouthz", "darke-san", "satisfyer"],

  kebap: ["dede", "yuffy", "ray092"],
  metizport: ["decaii", "ciro", "kellow"],
  "zoos-esports": ["tyrant", "xemp"],
  "ace-xero": ["david", "galaxy", "coldrink"],
  "toxic-lotus": ["engine", "toc", "ou"],
  "revenant-xspark": ["sergeant-clash", "hiroshii", "walkthrough"],
};

export const BSC_2026_TEAM_SLUGS = Object.keys(BSC_2026_ROSTERS);

/** Jugadores que no deben salir en fantasy (p. ej. ya no en BSC 2026) */
export const BSC_2026_EXCLUDED_PLAYERS = new Set<string>([
  "jxcr",
  "jeton",
  "skyrilzz",
  "woodland",
  "tomzy",
  "chino",
  "walkthrough",
  "hiroshii",
  "response",
  "sergeant-clash",
]);

export const BSC_2026_PLAYER_SLUGS = new Set(
  Object.values(BSC_2026_ROSTERS).flat().filter((s) => !BSC_2026_EXCLUDED_PLAYERS.has(s)),
);

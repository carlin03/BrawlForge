/**
 * Plantillas BSC 2026 — BSEN / Liquipedia (MF, PSI, preseason).
 * Fuente de verdad para fantasy (teamSlug forzado).
 */
import { BSC_2026_TEAM_REGISTRY } from "./bsc-2026-team-registry";

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
  madridmira: ["rup", "yoko", "jusorange"],
  kebap: ["dede", "yuffy", "ray092"],
  metizport: ["decaii", "ciro", "kellow"],

  "zeta-division": ["battoman", "sitetampo", "sizuku"],
  "crazy-raccoon": ["milkreo", "moya", "tensai"],
  reject: ["levi", "melty", "shu"],
  "skcalalas-ea": ["ghost-t", "kuru", "naipishu"],
  "rival-esports": ["ryohei", "totoron", "yutapin"],
  "wwl-esports": ["cookie", "minzzun", "nenne"],
  "feasible-gaming": ["nyades", "sigemyon", "drake"],
  "frenzy-esports": ["danshari", "mira", "toridesu"],
  fennel: ["achapi", "i-see", "ken-g"],
  insomnia: ["jene-azure", "koga", "wahochi"],
  "ace-xero": ["david", "galaxy", "coldrink"],
  "toxic-lotus": ["engine", "toc", "ou"],

  "tribe-gaming": ["diegogamer", "lxffy", "rbm"],
  "stmn-esports": ["juan-carlos", "pain", "tacos"],
  "team-elektros": ["doin", "memen", "snoiy"],
  "vatic-esports": ["belal", "ezlivi", "zee"],
  "only-realm": ["bobby", "patchy", "sans"],
  elevate: ["vegeta", "og", "portox"],
  "f-a-homeless": ["ducky", "tyrant", "xemp"],
  "vic-day": ["kapi", "santi", "michu"],
  "legacy-esports": ["rafiki", "zoulan", "zeus"],

  loud: ["edinho", "firecrow", "kaiodog"],
  skcalalas: ["kristian", "pekka", "rhz"],
  "new-heights-gaming": ["portox", "wesley", "prozy"],
  kaioperro: ["derrp", "doritos", "loko"],
  "eternal-esports": ["cauebr", "jubileu", "mohtep"],
  "alguem-segura": ["nubis", "tufa", "satisfyer"],
  "olimpo-squad": ["brabao", "golden", "icecrow"],
  "bounty-hunters-esports": ["redzin", "bicho", "rei-do-fut"],
  "enosis-esports": ["b4st", "deykon", "gun"],
  "bc-gaming-sa": ["leo", "mica", "tomz"],
  "level-esports": ["nouthz", "darke-san", "titan"],
  oddyssey: ["dreww", "lipizin", "magic"],
  "acre-lovers": ["fire-murilo", "sennin", "muri"],
  "f-a-zurita-gaming": ["bryan", "exic", "jxcr"],

  "revenant-xspark": ["sergeant-clash", "hiroshii", "walkthrough"],
};

// Asegurar plantillas del registro (por si falta alguna clave arriba)
for (const [slug, entry] of Object.entries(BSC_2026_TEAM_REGISTRY)) {
  if (!BSC_2026_ROSTERS[slug]?.length) {
    BSC_2026_ROSTERS[slug] = [...entry.roster];
  }
}

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

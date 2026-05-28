/** Curated BSC top-tier overrides — plantillas reales (sin duplicar jugadores entre clubes). */

export const CURATED_TEAMS: Record<

  string,

  Partial<{

    earnings: number;

    rank: number;

    rankChange: number;

    form: ("W" | "L")[];

    roster: string[];

    achievements: { place: string; tournament: string; prize: string; date: string }[];

  }>

> = {

  "crazy-raccoon": {

    earnings: 874750,

    rank: 1,

    form: ["W", "W", "L", "W", "W"],

    roster: ["moya", "tensai", "milkreo"],

    achievements: [

      { place: "1st", tournament: "Brawl Stars World Finals 2025", prize: "$400,000", date: "2025-11-30" },

    ],

  },

  "sk-gaming": {

    earnings: 873081,

    rank: 2,

    form: ["W", "W", "L", "W", "W"],

    roster: ["yoshi", "ope", "nowy297"],

  },

  hmble: { earnings: 428000, rank: 3, form: ["W", "L", "W", "W", "L"], roster: ["lukii", "boss", "symantec"] },

  "tribe-gaming": { earnings: 274199, rank: 4, roster: ["diegogamer", "lxffy", "rbm"] },

  "fut-esports": { rank: 5, roster: ["angelboy", "guesti", "nob"] },

  "totem-esports": { rank: 6, roster: ["joker", "maru", "maury"] },

  "revenant-xspark": { rank: 7, roster: ["hiroshii", "response", "sergeant-clash"] },

  loud: { rank: 8, roster: ["edinho", "firecrow", "kaiodog"] },

  "team-heretics": { rank: 9, roster: ["guillevgx", "ikaoss", "marco"] },

  "zeta-division": {

    rank: 10,

    form: ["W", "L", "W", "W", "L"],

    roster: ["sizuku", "sitetampo", "battoman"],

    achievements: [{ place: "2nd", tournament: "BSC 2026 February EA MF", prize: "$15,000", date: "2026-02-14" }],

  },

  "natus-vincere": { rank: 11, roster: ["drage", "gero", "enraged"] },

  reject: { rank: 13, roster: ["levi", "melty", "shu"] },


  "spacestation-gaming": { rank: 12, roster: ["bobby", "chino", "sans"] },

  "stmn-esports": { rank: 14, roster: ["cyrad", "fen", "trappz"] },

  skcalalas: { rank: 16, roster: ["juan-carlos", "kristian", "rhz"] },

  "nova-esports": { rank: 24, roster: ["filippo", "meow", "terry"] },

  "toxic-lotus": { rank: 19, roster: ["engine", "ou", "toc"] },

  "bounty-hunters-esports": { rank: 20, roster: ["portox", "prozy", "wesley"] },

  "only-realm": { rank: 17, roster: ["patchy", "ryuk", "storm"] },

  "eternal-esports": { rank: 21, roster: ["cauebr", "jubileu", "mohtep"] },

  oddyssey: { rank: 22, roster: ["alan", "keaps", "yoko"] },

  "ace-xero": { rank: 23, roster: ["david", "galaxy", "nagi"] },

  "papara-supermassive": { rank: 18, roster: ["tomzy", "filippo", "woodland"] },

  "bc-gaming-sa": { rank: 20, roster: ["leo", "mica", "tomz"] },

};



export const CURATED_PLAYERS: Record<

  string,

  Partial<{ fantasyPoints: number; fantasyOwnership: number; rating: number; realName: string; teamSlug: string }>

> = {

  moya: { fantasyPoints: 94, fantasyOwnership: 72, rating: 1.28 },

  yoshi: { fantasyPoints: 91, fantasyOwnership: 68, rating: 1.24, realName: "David Cayetano Gómez" },

  tensai: { fantasyPoints: 88, fantasyOwnership: 65, rating: 1.22 },

  lukii: { fantasyPoints: 86, fantasyOwnership: 58, rating: 1.2 },

  boss: { fantasyPoints: 84, fantasyOwnership: 52, rating: 1.17 },

  lxffy: { fantasyPoints: 85, fantasyOwnership: 61, rating: 1.19 },

  ope: { fantasyPoints: 82, fantasyOwnership: 54, rating: 1.18, realName: "Alexis Mangelle" },

  response: { fantasyPoints: 81, fantasyOwnership: 48, rating: 1.16 },

  symantec: { fantasyPoints: 80, fantasyOwnership: 47, rating: 1.13 },

  joker: { fantasyPoints: 79, fantasyOwnership: 38, rating: 1.15 },

  rbm: { fantasyPoints: 78, fantasyOwnership: 44, rating: 1.12 },

  engine: { fantasyPoints: 78, fantasyOwnership: 44, rating: 1.13 },

  filippo: { teamSlug: "papara-supermassive", fantasyPoints: 82, fantasyOwnership: 40, rating: 1.15 },
  tomzy: { teamSlug: "papara-supermassive", fantasyPoints: 78, fantasyOwnership: 28, rating: 1.1, realName: "Woodland Tom Edward" },
  woodland: { teamSlug: "papara-supermassive", fantasyPoints: 77, fantasyOwnership: 26, rating: 1.09 },
  chino: { teamSlug: "spacestation-gaming", fantasyPoints: 80, fantasyOwnership: 38, rating: 1.12 },
  sans: { teamSlug: "spacestation-gaming", fantasyPoints: 79, fantasyOwnership: 36, rating: 1.11 },
  cyrad: { teamSlug: "stmn-esports", fantasyPoints: 81, fantasyOwnership: 40, rating: 1.13 },
  fen: { teamSlug: "stmn-esports", fantasyPoints: 79, fantasyOwnership: 35, rating: 1.1 },
  trappz: { teamSlug: "stmn-esports", fantasyPoints: 78, fantasyOwnership: 33, rating: 1.09 },
  leo: { teamSlug: "bc-gaming-sa", fantasyPoints: 80, fantasyOwnership: 34, rating: 1.11 },
  mica: { teamSlug: "bc-gaming-sa", fantasyPoints: 78, fantasyOwnership: 30, rating: 1.09 },
  tomz: { teamSlug: "bc-gaming-sa", fantasyPoints: 77, fantasyOwnership: 28, rating: 1.08 },
  nowy297: { teamSlug: "sk-gaming", fantasyPoints: 82, fantasyOwnership: 41, rating: 1.14 },
  enraged: { teamSlug: "natus-vincere", fantasyPoints: 84, fantasyOwnership: 38, rating: 1.15 },
  gero: { teamSlug: "natus-vincere", fantasyPoints: 86, fantasyOwnership: 45, rating: 1.18 },
  drage: { teamSlug: "natus-vincere", fantasyPoints: 85, fantasyOwnership: 42, rating: 1.17 },
  nob: { teamSlug: "fut-esports", fantasyPoints: 80, fantasyOwnership: 36, rating: 1.11 },
  guesti: { teamSlug: "fut-esports", fantasyPoints: 83, fantasyOwnership: 44, rating: 1.16 },
  angelboy: { teamSlug: "fut-esports", fantasyPoints: 87, fantasyOwnership: 48, rating: 1.19 },
  bobby: { teamSlug: "spacestation-gaming", fantasyPoints: 81, fantasyOwnership: 37, rating: 1.12 },
  walkthrough: { teamSlug: "revenant-xspark", fantasyPoints: 76, fantasyOwnership: 28, rating: 1.08 },
  zee: { teamSlug: "vatic-esports", fantasyPoints: 77, fantasyOwnership: 30, rating: 1.09 },
  ray092: { teamSlug: "bc-gaming-sa", fantasyPoints: 75, fantasyOwnership: 25, rating: 1.07 },
  skyriikzz: { teamSlug: "bc-gaming-sa", fantasyPoints: 74, fantasyOwnership: 22, rating: 1.06 },
  meow: { teamSlug: "novo-esports", fantasyPoints: 80, fantasyOwnership: 35, rating: 1.11 },
  terry: { teamSlug: "novo-esports", fantasyPoints: 78, fantasyOwnership: 30, rating: 1.09 },
  ryuk: { teamSlug: "only-realm", fantasyPoints: 77, fantasyOwnership: 28, rating: 1.08 },
  storm: { teamSlug: "only-realm", fantasyPoints: 76, fantasyOwnership: 26, rating: 1.07 },
  salty: { teamSlug: "papara-supermassive", fantasyPoints: 75, fantasyOwnership: 24, rating: 1.06 },
};



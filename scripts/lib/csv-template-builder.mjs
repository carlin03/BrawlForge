import { escapeCsvCell } from "./catalog-csv.mjs";

/**
 * CSV enriquecido: comentarios #, fila _ayuda (descripciones), fila _ejemplo, datos reales.
 */
export function buildCatalogTemplateCsv({ title, headers, hints, example, rows }) {
  const lines = [
    `# ${title}`,
    "# BrawlForge — edita en Excel o Google Sheets. Guarda como CSV UTF-8.",
    "# Las filas que empiezan por # y las filas _ayuda / _ejemplo NO se importan.",
    "# En listas usa el carácter | entre valores (ej. jugador1|jugador2).",
    headers.join(","),
    headers.map((h) => escapeCsvCell(hints[h] ?? "")).join(","),
  ];
  if (example) {
    const ex = { ...example, slug: example.slug ?? "_ejemplo" };
    lines.push(headers.map((h) => escapeCsvCell(ex[h] ?? "")).join(","));
  }
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvCell(row[h] ?? "")).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}

export const TEAM_HINTS = {
  slug: "_ayuda",
  name: "Nombre en ficha",
  tag: "Abreviatura",
  region: "EMEA|EA|NA|SA|GLOBAL",
  country: "País",
  earnings: "USD",
  rank: "Nº ranking",
  rank_change: "+/-",
  description: "Texto largo en página del equipo",
  logo_url: "URL opcional",
  roster_slugs: "slug1|slug2|slug3",
};

export const TEAM_EXAMPLE = {
  slug: "_ejemplo",
  name: "SK Gaming",
  tag: "SK",
  region: "EMEA",
  country: "Germany",
  earnings: "842000",
  rank: "1",
  rank_change: "2",
  description:
    "SK Gaming es uno de los clubes históricos del BSC 2026. Esta descripción aparece en la ficha pública del equipo.",
  logo_url: "",
  roster_slugs: "yoshi|nowy297|ope",
};

export const PLAYER_HINTS = {
  slug: "_ayuda",
  ign: "Nombre en juego",
  real_name: "Nombre real",
  team_slug: "slug del equipo",
  region: "EMEA|EA|NA|SA",
  role: "Player",
  status: "active|inactive|retired",
  fantasy_points: "0-100",
  fantasy_ownership: "0-100",
  rating: "0-2",
  bio: "Bio en perfil",
  photo_url: "URL foto",
  previous_teams: "slug1|slug2",
};

export const PLAYER_EXAMPLE = {
  slug: "_ejemplo",
  ign: "Yoshi",
  real_name: "",
  team_slug: "sk-gaming",
  region: "EMEA",
  role: "Player",
  status: "active",
  fantasy_points: "92",
  fantasy_ownership: "28",
  rating: "1.18",
  bio: "Jugador estrella de SK Gaming. Capitán habitual en Monthly Finals.",
  photo_url: "",
  previous_teams: "fut-esports|tribe-gaming",
};

export const NEWS_HINTS = {
  slug: "_ayuda",
  title: "Titular",
  excerpt: "Resumen en listado",
  body: "Párrafo1|||Párrafo2",
  category: "Esports|Fantasy|Torneos",
  published_at: "AAAA-MM-DD",
  author: "Firma",
  read_minutes: "minutos",
  cover_accent: "gold|blue|red|green",
  related_teams: "slug1|slug2",
  related_tournament: "slug torneo BSC",
  hot: "true|false",
};

export const NEWS_EXAMPLE = {
  slug: "_ejemplo",
  title: "HMBLE conquista el Brawl Cup 2026",
  excerpt: "La gran final dejó al campeón europeo en lo más alto del circuito.",
  body:
    "En una serie vibrante, HMBLE cerró el torneo con autoridad.|||Los analistas destacan su consistencia en picks y macro a lo largo del evento.",
  category: "Resultados",
  published_at: "2026-05-29",
  author: "BrawlForge",
  read_minutes: "4",
  cover_accent: "gold",
  related_teams: "hmble|fut-esports",
  related_tournament: "bsc-2026-brawl-cup",
  hot: "true",
};

export const TOURNAMENT_HEADERS = [
  "slug",
  "name",
  "short_name",
  "region",
  "prize_pool",
  "teams_count",
  "status",
  "start_date",
  "end_date",
  "location",
  "stage",
  "tier",
  "logo_url",
  "participant_slugs",
];

export const TOURNAMENT_HINTS = {
  slug: "_ayuda",
  name: "Nombre del evento",
  short_name: "Nombre corto",
  region: "EMEA|GLOBAL",
  prize_pool: "Texto premio",
  teams_count: "Nº equipos",
  status: "upcoming|live|finished",
  start_date: "AAAA-MM-DD",
  end_date: "AAAA-MM-DD",
  location: "Ciudad u online",
  stage: "Brawl Cup|Monthly Final",
  tier: "1-3",
  logo_url: "URL logo",
  participant_slugs: "equipo1|equipo2",
};

export const TOURNAMENT_EXAMPLE = {
  slug: "_ejemplo",
  name: "Brawl Cup 2026",
  short_name: "Brawl Cup",
  region: "EMEA",
  prize_pool: "$100,000",
  teams_count: "16",
  status: "upcoming",
  start_date: "2026-05-29",
  end_date: "2026-05-31",
  location: "Berlin",
  stage: "Brawl Cup",
  tier: "1",
  logo_url: "",
  participant_slugs: "hmble|sk-gaming|fut-esports",
};

export const ROSTER_HEADERS = ["tournament_slug", "team_slug", "player_slugs"];

export const ROSTER_HINTS = {
  tournament_slug: "_ayuda",
  team_slug: "slug equipo",
  player_slugs: "jugador1|jugador2|jugador3",
};

export const ROSTER_EXAMPLE = {
  tournament_slug: "_ejemplo",
  team_slug: "sk-gaming",
  player_slugs: "yoshi|nowy297|ope",
};

export const MATCH_HEADERS = [
  "id",
  "tournament_slug",
  "team_a_slug",
  "team_b_slug",
  "scheduled_at",
  "status",
  "stage",
  "region",
  "format",
  "score_a",
  "score_b",
  "published",
  "map_order",
  "meta_json",
];

export const MATCH_HINTS = {
  id: "_ayuda",
  tournament_slug: "slug torneo",
  team_a_slug: "equipo A",
  team_b_slug: "equipo B",
  scheduled_at: "ISO 8601 UTC",
  status: "upcoming|live|finished",
  stage: "Grand Final",
  region: "EMEA",
  format: "Bo3|Bo5",
  score_a: "0",
  score_b: "0",
  published: "true|false",
  map_order: "mapa1|mapa2",
  meta_json: '{"importance":"featured"}',
};

export const MATCH_EXAMPLE = {
  id: "_ejemplo",
  tournament_slug: "bsc-2026-brawl-cup",
  team_a_slug: "hmble",
  team_b_slug: "sk-gaming",
  scheduled_at: "2026-05-29T18:00:00Z",
  status: "upcoming",
  stage: "Grand Final",
  region: "EMEA",
  format: "Bo5",
  score_a: "0",
  score_b: "0",
  published: "true",
  map_order: "Hard Rock Mine|Double Swoosh",
  meta_json: "",
};

export const FANTASY_HEADERS = [
  "tournament_slug",
  "player_slug",
  "team_slug",
  "price",
  "price_change",
  "pick_rate",
  "form",
];

export const FANTASY_HINTS = {
  tournament_slug: "_ayuda",
  player_slug: "slug jugador",
  team_slug: "slug equipo",
  price: "9.5",
  price_change: "0.2",
  pick_rate: "34",
  form: "W|W|L",
};

export const FANTASY_EXAMPLE = {
  tournament_slug: "_ejemplo",
  player_slug: "yoshi",
  team_slug: "sk-gaming",
  price: "9.5",
  price_change: "0.2",
  pick_rate: "28",
  form: "W|W|L",
};

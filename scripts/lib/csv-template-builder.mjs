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

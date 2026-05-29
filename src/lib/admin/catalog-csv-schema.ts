export type CsvFieldDef = {
  key: string;
  label: string;
  description: string;
  example: string;
  required?: boolean;
};

export type CsvTemplateDef = {
  id: "teams" | "players" | "news";
  title: string;
  subtitle: string;
  filename: string;
  table: string;
  icon: "teams" | "players" | "news";
  fields: CsvFieldDef[];
};

export const CSV_TEMPLATES: CsvTemplateDef[] = [
  {
    id: "teams",
    title: "Equipos",
    subtitle: "Fichas de club con descripción, región y plantilla",
    filename: "teams.csv",
    table: "teams_catalog",
    icon: "teams",
    fields: [
      {
        key: "slug",
        label: "Slug",
        description: "Identificador único en la URL. Solo minúsculas y guiones.",
        example: "sk-gaming",
        required: true,
      },
      {
        key: "name",
        label: "Nombre",
        description: "Nombre público del equipo (título de la ficha).",
        example: "SK Gaming",
        required: true,
      },
      {
        key: "tag",
        label: "Tag",
        description: "Abreviatura de 2–4 letras en rankings y partidos.",
        example: "SK",
      },
      {
        key: "region",
        label: "Región",
        description: "EMEA, EA, NA, SA, GLOBAL o CN.",
        example: "EMEA",
        required: true,
      },
      {
        key: "country",
        label: "País",
        description: "País del club (texto libre).",
        example: "Germany",
      },
      {
        key: "earnings",
        label: "Ganancias",
        description: "Premios acumulados en USD (número).",
        example: "842000",
      },
      {
        key: "rank",
        label: "Ranking",
        description: "Posición en el ranking global (vacío si no aplica).",
        example: "1",
      },
      {
        key: "rank_change",
        label: "Δ Rank",
        description: "Cambio de posición (+ sube, − baja).",
        example: "2",
      },
      {
        key: "description",
        label: "Descripción",
        description: "Párrafo en la página del equipo — como una web real.",
        example: "SK Gaming lidera el circuito EMEA 2026 con plantilla consolidada.",
        required: true,
      },
      {
        key: "logo_url",
        label: "Logo URL",
        description: "Imagen opcional. También puedes usar Admin → Logos.",
        example: "https://…",
      },
      {
        key: "roster_slugs",
        label: "Plantilla",
        description: "Slugs de jugadores separados por | (pipe).",
        example: "yoshi|nowy297|ope",
        required: true,
      },
      { key: "coach", label: "Entrenador", description: "Opcional.", example: "Coach Name" },
      { key: "founded_year", label: "Fundación", description: "Año (número).", example: "2020" },
      { key: "headquarters", label: "Sede", description: "Ciudad o país sede.", example: "Berlin" },
      { key: "circuit_summary", label: "Resumen BSC", description: "Frase corta del circuito regional.", example: "MF EMEA 2026" },
      { key: "liquipedia_url", label: "Liquipedia", description: "URL completa de la página del club.", example: "https://liquipedia.net/…" },
    ],
  },
  {
    id: "players",
    title: "Jugadores",
    subtitle: "Pros del circuito: fantasy, bio y foto",
    filename: "players.csv",
    table: "players_catalog",
    icon: "players",
    fields: [
      {
        key: "slug",
        label: "Slug",
        description: "ID único del jugador (mismo que en Liquipedia/local).",
        example: "yoshi",
        required: true,
      },
      {
        key: "ign",
        label: "IGN",
        description: "Nombre en juego mostrado en toda la web.",
        example: "Yoshi",
        required: true,
      },
      {
        key: "real_name",
        label: "Nombre real",
        description: "Nombre completo opcional en la ficha.",
        example: "…",
      },
      {
        key: "team_slug",
        label: "Equipo",
        description: "Slug del equipo actual (debe existir en teams.csv).",
        example: "sk-gaming",
        required: true,
      },
      {
        key: "region",
        label: "Región",
        description: "Hereda contexto del equipo si lo dejas vacío.",
        example: "EMEA",
      },
      {
        key: "role",
        label: "Rol",
        description: "Rol esports (Player, Captain…).",
        example: "Player",
      },
      {
        key: "status",
        label: "Estado",
        description: "active, inactive o retired.",
        example: "active",
      },
      {
        key: "fantasy_points",
        label: "Pts fantasy",
        description: "Precio base del mercado fantasy (número).",
        example: "92",
      },
      {
        key: "fantasy_ownership",
        label: "% ownership",
        description: "Porcentaje de managers que lo tienen (0–100).",
        example: "34",
      },
      {
        key: "rating",
        label: "Rating",
        description: "Valoración 0–2 (decimal permitido).",
        example: "1.18",
      },
      {
        key: "bio",
        label: "Bio",
        description: "Texto corto en perfil del jugador.",
        example: "Capitán de SK Gaming. Referente del meta BSC 2026.",
      },
      {
        key: "photo_url",
        label: "Foto URL",
        description: "URL de foto de perfil (JPG/PNG).",
        example: "https://…",
      },
      { key: "country", label: "País", description: "País del jugador.", example: "Germany" },
      { key: "primary_brawler", label: "Brawler 1", description: "Referencia de main.", example: "Mortis" },
      { key: "secondary_brawler", label: "Brawler 2", description: "Secundario.", example: "Gene" },
      { key: "is_captain", label: "Capitán", description: "true / false", example: "true" },
      { key: "join_date", label: "Ingreso", description: "AAAA-MM", example: "2026-01" },
      { key: "liquipedia_url", label: "Liquipedia", description: "URL del perfil.", example: "https://liquipedia.net/…" },
    ],
  },
  {
    id: "news",
    title: "Noticias",
    subtitle: "Artículos con extracto, cuerpo multipárrafo y enlaces",
    filename: "news.csv",
    table: "news_catalog",
    icon: "news",
    fields: [
      {
        key: "slug",
        label: "Slug",
        description: "URL de la noticia: /news/tu-slug",
        example: "bsc-brawl-cup-2026",
        required: true,
      },
      {
        key: "title",
        label: "Título",
        description: "Titular principal del artículo.",
        example: "HMBLE gana el Brawl Cup 2026",
        required: true,
      },
      {
        key: "excerpt",
        label: "Extracto",
        description: "Resumen en listados y tarjetas (1–2 frases).",
        example: "La gran final cerró el primer major del año.",
        required: true,
      },
      {
        key: "body",
        label: "Cuerpo",
        description: "Párrafos separados por ||| (tres pipes).",
        example: "Párrafo uno.|||Párrafo dos con detalle.",
        required: true,
      },
      {
        key: "category",
        label: "Categoría",
        description: "Esports, Fantasy, Torneos, Resultados o Fichajes.",
        example: "Resultados",
      },
      {
        key: "published_at",
        label: "Fecha",
        description: "ISO: AAAA-MM-DD",
        example: "2026-05-29",
      },
      {
        key: "author",
        label: "Autor",
        description: "Firma del artículo.",
        example: "BrawlForge",
      },
      {
        key: "read_minutes",
        label: "Lectura",
        description: "Minutos estimados (número).",
        example: "4",
      },
      {
        key: "cover_accent",
        label: "Color portada",
        description: "gold, blue, red o green.",
        example: "gold",
      },
      {
        key: "related_teams",
        label: "Equipos",
        description: "Slugs de equipos relacionados, separados por |.",
        example: "hmble|fut-esports",
      },
      {
        key: "related_tournament",
        label: "Torneo",
        description: "Slug BSC (ej. bsc-2026-brawl-cup).",
        example: "bsc-2026-brawl-cup",
      },
      {
        key: "hot",
        label: "Destacada",
        description: "true / false — badge «Hot» en home.",
        example: "true",
      },
    ],
  },
];

export function getCsvTemplate(id: CsvTemplateDef["id"]): CsvTemplateDef | undefined {
  return CSV_TEMPLATES.find((t) => t.id === id);
}

export type CsvFieldDef = {
  key: string;
  label: string;
  description: string;
  example: string;
  required?: boolean;
};

export type CsvTemplateId =
  | "teams"
  | "players"
  | "news"
  | "tournaments"
  | "tournament_rosters"
  | "matches"
  | "fantasy_market";

export type CsvTemplateIcon =
  | "teams"
  | "players"
  | "news"
  | "tournaments"
  | "rosters"
  | "matches"
  | "fantasy";

export type CsvTemplateDef = {
  id: CsvTemplateId;
  group: "clubs" | "competition" | "content";
  title: string;
  subtitle: string;
  filename: string;
  table: string;
  icon: CsvTemplateIcon;
  fields: CsvFieldDef[];
};

export const CSV_TEMPLATE_GROUPS: {
  id: CsvTemplateDef["group"];
  title: string;
  note?: string;
}[] = [
  {
    id: "clubs",
    title: "Equipos y jugadores",
    note: "Son archivos distintos: teams.csv no sustituye a players.csv. Puedes subir solo uno o ambos.",
  },
  {
    id: "competition",
    title: "Torneos y partidos",
    note: "Importa primero torneos y equipos; luego partidos y plantillas por torneo.",
  },
  {
    id: "content",
    title: "Noticias y fantasy",
    note: "Noticias para el blog; fantasy_market para precios por torneo.",
  },
];

export const CSV_TEMPLATES: CsvTemplateDef[] = [
  {
    id: "teams",
    group: "clubs",
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
      { key: "form", label: "Forma", description: "Últimos resultados (W/L), separados por |.", example: "W|W|L" },
      { key: "coach", label: "Entrenador", description: "Opcional.", example: "Coach Name" },
      { key: "founded_year", label: "Fundación", description: "Año (número).", example: "2020" },
      { key: "headquarters", label: "Sede", description: "Ciudad o país sede.", example: "Berlin" },
      { key: "website", label: "Web", description: "URL del club.", example: "https://…" },
      { key: "circuit_summary", label: "Resumen BSC", description: "Frase corta del circuito regional.", example: "MF EMEA 2026" },
      {
        key: "social_json",
        label: "Redes (JSON)",
        description: "Objeto JSON: twitter, youtube, twitch, instagram, discord… Igual que en Admin → Equipos.",
        example: '{"twitter":"https://x.com/…"}',
      },
      {
        key: "achievements_json",
        label: "Logros (JSON)",
        description: "Array JSON de trofeos (place, tournament, prize, date).",
        example: '[{"place":"1st","tournament":"Brawl Cup"}]',
      },
      {
        key: "meta_json",
        label: "Meta (JSON)",
        description: "Wiki, tagline, galería y secciones extra guardadas en el admin. Exporta desde «Descargar CSV» para round-trip.",
        example: '{"tagline":"…","wiki_sections":[]}',
      },
    ],
  },
  {
    id: "players",
    group: "clubs",
    title: "Jugadores",
    subtitle: "Pros del circuito: fantasy, bio y foto",
    filename: "players.csv",
    table: "players_catalog",
    icon: "players",
    fields: [
      {
        key: "slug",
        label: "Slug",
        description: "ID único del jugador en la URL.",
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
      {
        key: "previous_teams",
        label: "Equipos anteriores",
        description: "Slugs de clubes previos, separados por | (pipe).",
        example: "fut-esports|tribe-gaming",
      },
      {
        key: "social_json",
        label: "Redes (JSON)",
        description: "Objeto JSON con enlaces sociales del jugador.",
        example: '{"twitter":"https://x.com/…"}',
      },
      {
        key: "meta_json",
        label: "Meta (JSON)",
        description: "Biografía larga, wiki_sections, career_highlights, gallery… lo mismo que Admin → Jugadores.",
        example: '{"wiki_sections":[],"career_highlights":[]}',
      },
    ],
  },
  {
    id: "tournaments",
    group: "competition",
    title: "Torneos",
    subtitle: "Eventos BSC: fechas, premios y participantes",
    filename: "tournaments.csv",
    table: "tournaments_catalog",
    icon: "tournaments",
    fields: [
      { key: "slug", label: "Slug", description: "ID del torneo en URL.", example: "bsc-2026-brawl-cup", required: true },
      { key: "name", label: "Nombre", description: "Título público.", example: "Brawl Cup 2026", required: true },
      { key: "short_name", label: "Nombre corto", description: "Para chips y calendario.", example: "Brawl Cup" },
      { key: "region", label: "Región", description: "EMEA, GLOBAL, etc.", example: "EMEA", required: true },
      { key: "prize_pool", label: "Premio", description: "Texto libre (ej. $100,000).", example: "$100,000" },
      { key: "teams_count", label: "Equipos", description: "Número de clubes.", example: "16" },
      { key: "status", label: "Estado", description: "upcoming, live, finished.", example: "upcoming" },
      { key: "start_date", label: "Inicio", description: "AAAA-MM-DD", example: "2026-05-01" },
      { key: "end_date", label: "Fin", description: "AAAA-MM-DD", example: "2026-05-03" },
      { key: "location", label: "Sede", description: "Ciudad o online.", example: "Berlin" },
      { key: "stage", label: "Fase", description: "Monthly Final, Brawl Cup…", example: "Brawl Cup" },
      { key: "tier", label: "Tier", description: "1–3 (número).", example: "1" },
      { key: "logo_url", label: "Logo", description: "URL imagen del evento.", example: "https://…" },
      {
        key: "participant_slugs",
        label: "Participantes",
        description: "Slugs de equipos separados por |.",
        example: "hmble|sk-gaming|fut-esports",
      },
    ],
  },
  {
    id: "tournament_rosters",
    group: "competition",
    title: "Plantillas por torneo",
    subtitle: "Qué jugadores juega cada club en un evento concreto",
    filename: "tournament_rosters.csv",
    table: "tournament_team_rosters",
    icon: "rosters",
    fields: [
      { key: "tournament_slug", label: "Torneo", description: "Slug del torneo.", example: "bsc-2026-brawl-cup", required: true },
      { key: "team_slug", label: "Equipo", description: "Slug del club.", example: "sk-gaming", required: true },
      {
        key: "player_slugs",
        label: "Jugadores",
        description: "Slugs separados por | (deben existir en players.csv).",
        example: "yoshi|nowy297|ope",
        required: true,
      },
    ],
  },
  {
    id: "matches",
    group: "competition",
    title: "Partidos",
    subtitle: "Calendario y resultados enlazados a torneo y equipos",
    filename: "matches.csv",
    table: "matches_catalog",
    icon: "matches",
    fields: [
      { key: "id", label: "ID", description: "Identificador único del partido.", example: "bsc-bc-2026-mf-emea-r1-m1", required: true },
      { key: "tournament_slug", label: "Torneo", description: "Slug del torneo.", example: "bsc-2026-brawl-cup", required: true },
      { key: "team_a_slug", label: "Equipo A", description: "Local o lado A.", example: "hmble", required: true },
      { key: "team_b_slug", label: "Equipo B", description: "Visitante o lado B.", example: "sk-gaming", required: true },
      { key: "scheduled_at", label: "Fecha", description: "ISO 8601 con zona (UTC recomendado).", example: "2026-05-29T18:00:00Z", required: true },
      { key: "status", label: "Estado", description: "upcoming, live, finished, cancelled.", example: "upcoming" },
      { key: "stage", label: "Ronda", description: "Grupos, semifinal, final…", example: "Grand Final" },
      { key: "region", label: "Región", description: "Contexto regional.", example: "EMEA" },
      { key: "format", label: "Formato", description: "Bo3, Bo5…", example: "Bo5" },
      { key: "score_a", label: "Marcador A", description: "Sets o mapas ganados.", example: "0" },
      { key: "score_b", label: "Marcador B", description: "Sets o mapas ganados.", example: "0" },
      { key: "published", label: "Publicado", description: "true / false — visible en web.", example: "true" },
      {
        key: "map_order",
        label: "Mapas",
        description: "Orden de mapas en predicciones, separados por |.",
        example: "Hard Rock Mine|Double Swoosh|Pinhole Punt",
      },
      {
        key: "meta_json",
        label: "Meta JSON",
        description: "Opcional: objeto JSON para campos avanzados (predicciones, streams…).",
        example: '{"importance":"featured"}',
      },
    ],
  },
  {
    id: "news",
    group: "content",
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
  {
    id: "fantasy_market",
    group: "content",
    title: "Mercado fantasy",
    subtitle: "Precios y forma por jugador en un torneo",
    filename: "fantasy_market.csv",
    table: "fantasy_market_catalog",
    icon: "fantasy",
    fields: [
      { key: "tournament_slug", label: "Torneo", description: "Slug del evento.", example: "bsc-2026-brawl-cup", required: true },
      { key: "player_slug", label: "Jugador", description: "Slug del pro.", example: "yoshi", required: true },
      { key: "team_slug", label: "Equipo", description: "Club en ese torneo.", example: "sk-gaming", required: true },
      { key: "price", label: "Precio", description: "Coste en el mercado (número).", example: "9.5" },
      { key: "price_change", label: "Δ precio", description: "Cambio reciente (+/-).", example: "0.2" },
      { key: "pick_rate", label: "% picks", description: "0–100.", example: "34" },
      { key: "form", label: "Forma", description: "Últimos resultados W/L separados por |.", example: "W|W|L" },
    ],
  },
];

export function getCsvTemplate(id: CsvTemplateId): CsvTemplateDef | undefined {
  return CSV_TEMPLATES.find((t) => t.id === id);
}

export function getCsvTemplatesByGroup(group: CsvTemplateDef["group"]): CsvTemplateDef[] {
  return CSV_TEMPLATES.filter((t) => t.group === group);
}

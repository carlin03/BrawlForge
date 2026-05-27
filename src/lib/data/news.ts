export interface NewsArticle {
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  category: "Resultados" | "Torneos" | "Fichajes" | "Fantasy" | "Esports";
  date: string;
  author: string;
  readMinutes: number;
  coverAccent: "red" | "yellow" | "blue" | "gold";
  relatedTeams?: string[];
  relatedTournament?: string;
  hot?: boolean;
}

export const news: NewsArticle[] = [
  {
    slug: "crazy-raccoon-world-champions-2025",
    title: "Crazy Raccoon barre a HMBLE 3-0 y se proclama campeón del mundo 2025",
    excerpt:
      "El Crazy Raccoon japonés dominó la Gran Final en DreamHack Stockholm y derrotó a los campeones defensores HMBLE sin ceder un solo mapa en la serie decisiva.",
    body: [
      "El escenario de Stockholmsmässan vibró durante toda la tarde del domingo. Crazy Raccoon llegaba como favorito tras un playoffs impecable, pero HMBLE tenía la experiencia de haber levantado el trofeo en 2024. Nadie esperaba un 3-0 tan contundente.",
      "Moya fue la estrella indiscutible de la serie. Su lectura del meta en Gem Grab y su capacidad para abrir espacios en Hot Zone dejaron a HMBLE sin respuesta en los tres mapas. Tensai completó un rendimiento sobresaliente en Bounty, mientras Milkreo cerró las rotaciones defensivas con una solidez envidiable.",
      "Por parte de HMBLE, Lukii intentó revertir la dinámica en el segundo mapa con picks agresivos, pero la ventaja temprana de CR se mantuvo hasta el final. Boss y Symantec no encontraron huecos en la estructura japonesa, que parecía conocer cada ángulo del mapa antes de que empezara la partida.",
      "Con este título, Crazy Raccoon suma su segundo campeonato mundial y confirma el dominio de la región EA en la escena internacional. El equipo se lleva 400.000 dólares de premio y el honor de levantar la copa del mundo en Suecia.",
      "En BrawlForge Fantasy, Moya se convierte en el jugador más fichado de la semana, superando el 78% de ownership global. Los managers que lo eligieron capitán duplicaron sus puntos de jornada en la Gran Final.",
    ],
    category: "Resultados",
    date: "2025-11-30",
    author: "Redacción BrawlForge",
    readMinutes: 6,
    coverAccent: "gold",
    relatedTeams: ["crazy-raccoon", "hmble"],
    relatedTournament: "world-finals-2025",
    hot: true,
  },
  {
    slug: "sk-gaming-reverse-sweep-cr-semis",
    title: "SK Gaming cae 2-3 ante Crazy Raccoon en una semifinal épica del World Finals",
    excerpt:
      "La ilusión alemana de repetir final se esfumó en el quinto mapa cuando Crazy Raccoon completó la remontada en un duelo para la historia.",
    body: [
      "SK Gaming estuvo a un mapa de la Gran Final. Yoshi y Ope lideraron un 2-0 inicial que hizo soñar a toda la región EMEA con un representante en la final mundial.",
      "Pero Crazy Raccoon no conoce la palabra rendición. Mapa a mapa, Moya fue desgastando la ventaja psicológica de SK hasta empatar la serie en el cuarto asalto. El quinto mapa, un Heist cerrado, se decidió en los últimos segundos con una jugada colectiva de CR que dejó a Ope sin margen de reacción.",
      "Para SK Gaming, la temporada termina en un tercer puesto amargo pero con orgullo. Han demostrado que pueden competir con los mejores del mundo y Yoshi consolida su estatus como uno de los midlaners más temidos del circuito.",
      "Los pronósticos de la comunidad en BrawlForge daban un 62% de victoria a Crazy Raccoon antes del partido. Quienes confiaron en la remontada sumaron 75 puntos extra en la jornada de predicciones.",
    ],
    category: "Resultados",
    date: "2025-11-30",
    author: "Redacción BrawlForge",
    readMinutes: 5,
    coverAccent: "blue",
    relatedTeams: ["sk-gaming", "crazy-raccoon"],
    relatedTournament: "world-finals-2025",
  },
  {
    slug: "sk-gaming-3-0-totem-quarterfinal",
    title: "SK Gaming arrasa a Totem Esports 3-0 en cuartos del World Finals",
    excerpt:
      "Yoshi y Ope guiaron a SK Gaming hacia una victoria limpia sobre Totem Esports y un puesto en semifinales contra Crazy Raccoon.",
    body: [
      "Totem Esports llegaba con la moral alta tras superar la fase de grupos, pero SK Gaming tenía otra velocidad. Desde el primer mapa, la coordinación entre Yoshi y Ope fue superior en todas las fases del juego.",
      "Zhar intentó cambiar la dinámica con picks sorpresa en el segundo mapa, pero la macro de SK no flaqueó. Ikaoss y Lenain no pudieron encontrar el ritmo necesario para forzar un tercer mapa.",
      "Con este 3-0, SK Gaming envía un mensaje claro al resto del bracket: vienen a ganarlo todo. Su próximo rival, Crazy Raccoon, será un examen completamente distinto.",
    ],
    category: "Resultados",
    date: "2025-11-30",
    author: "Redacción BrawlForge",
    readMinutes: 4,
    coverAccent: "blue",
    relatedTeams: ["sk-gaming", "totem-esports"],
    relatedTournament: "world-finals-2025",
  },
  {
    slug: "world-finals-2026-tokyo",
    title: "Supercell confirma Tokio como sede del Brawl Stars World Finals 2026",
    excerpt:
      "El evento más importante del año regresa con 16 equipos compitiendo por el título mundial en Tokio, Japón.",
    body: [
      "Supercell ha anunciado oficialmente que el Brawl Stars World Finals 2026 se celebrará en Tokio. La capital japonesa acogerá por primera vez la cumbre del competitivo de Brawl Stars con un formato ampliado y una producción de nivel esports.",
      "Dieciséis equipos clasificarán a través de los circuitos regionales BSC 2026: EMEA, East Asia, North America y South America. Los Monthly Finals y el Brawl Cup serán decisivos para acumular puntos en el leaderboard global.",
      "Para la comunidad de BrawlForge, esto significa una temporada fantasy más larga y más pick'ems por regiones. El bracket de Tokio abrirá en noviembre con predicciones especiales y recompensas exclusivas para los mejores pronosticadores.",
      "Las entradas para el evento presencial se pondrán a la venta en verano. Mientras tanto, el calendario BSC continúa con los Challengers y Monthly Finals de cada región.",
    ],
    category: "Torneos",
    date: "2026-01-15",
    author: "Redacción BrawlForge",
    readMinutes: 5,
    coverAccent: "yellow",
    relatedTournament: "world-finals-2026",
    hot: true,
  },
  {
    slug: "joker-leaves-sk-gaming",
    title: "SK Gaming y Joker se separan de mutuo acuerdo tras dos temporadas",
    excerpt:
      "Erik 'Joker' Bravo Granström deja SK Gaming y se une a Totem Esports de cara a la temporada 2026.",
    body: [
      "El movimiento más sonado del mercado invernal afecta directamente a dos contendientes EMEA. Joker, pieza clave del SK Gaming que llegó a semifinales del World Finals 2025, cambia de aires y refuerza a Totem Esports.",
      "Para SK Gaming, la salida obliga a replantear el roster. Ope y Yoshi siguen como núcleo, pero el tercer jugador será decisivo de cara a los Challengers de España y los Monthly Finals.",
      "Totem Esports, por su parte, forma un trío español con Zhar, Ikaoss y Joker que promete mucha sinergia en comunicación y estrategia. En fantasy, el precio de Joker sube un 12% tras el anuncio.",
      "Los fans reaccionaron con sorpresa en redes, pero la mayoría coincide en que Totem gana un perfil más agresivo y SK mantiene suficiente talento para seguir peleando arriba.",
    ],
    category: "Fichajes",
    date: "2025-12-30",
    author: "Redacción BrawlForge",
    readMinutes: 4,
    coverAccent: "red",
    relatedTeams: ["sk-gaming", "totem-esports"],
  },
  {
    slug: "fut-esports-emea-leaderboard",
    title: "FUT Esports lidera el leaderboard EMEA del BSC 2026 con 278 puntos",
    excerpt:
      "FUT Esports encabeza la clasificación del Campeonato EMEA por delante de HMBLE y Team Heretics tras unos Monthly Finals muy sólidos.",
    body: [
      "La región EMEA vive uno de sus años más competitivos. FUT Esports, con Nowy297, Meow y Gero, acumula 278 puntos en el leaderboard y se coloca como principal favorito para el World Finals de Tokio.",
      "HMBLE no se queda lejos: Lukii, Boss y Symantec mantienen la presión con 261 puntos. La rivalidad entre ambos equipos define la temporada y cada Monthly Final es una batalla directa por el liderato.",
      "Team Heretics y Revenant XSpark completan el grupo de perseguidores con opciones reales de clasificación. NOVO Esports y Totem Esports pelean por los últimos puestos de playoff.",
      "En fantasy, Nowy297 es el differential pick más popular entre managers que buscan diferenciarse del resto. Su ownership es solo del 34%, pero sus puntos por partido están entre los más altos de EMEA.",
    ],
    category: "Esports",
    date: "2026-04-16",
    author: "Redacción BrawlForge",
    readMinutes: 5,
    coverAccent: "blue",
    relatedTeams: ["fut-esports", "hmble", "team-heretics"],
  },
  {
    slug: "crazy-raccoon-brawl-cup-2026",
    title: "Crazy Raccoon cae 1-3 ante HMBLE en playoffs del Brawl Cup 2026",
    excerpt:
      "Los campeones del mundo fueron eliminados en playoffs cuando HMBLE se tomó la revancha de la Gran Final de Estocolmo.",
    body: [
      "El Brawl Cup 2026 dejó una de las mayores sorpresas de la temporada. Crazy Raccoon, favorito absoluto, no pudo repetir el dominio del World Finals y cayó 1-3 ante un HMBLE hambriento de revancha.",
      "El primer mapa sonrió a CR con un Gem Grab impecable de Moya, pero HMBLE respondió con tres mapas consecutivos donde Lukii fue el MVP indiscutible. Boss cerró el último mapa con una defensa perfecta en Hot Zone.",
      "Para Crazy Raccoon, la eliminación temprana complica su push hacia Tokio. Necesitarán sumar en los Monthly Finals de EA para no depender de wildcards.",
      "HMBLE envía un mensaje al resto del mundo: siguen siendo candidatos al título. En BrawlForge, más del 71% de la comunidad había votado victoria de CR antes del partido. HMBLE rompió el consenso y recompensó a quienes confiaron en la sorpresa.",
    ],
    category: "Resultados",
    date: "2026-05-17",
    author: "Redacción BrawlForge",
    readMinutes: 5,
    coverAccent: "red",
    relatedTeams: ["crazy-raccoon", "hmble"],
    relatedTournament: "bsc-2026-brawl-cup",
  },
  {
    slug: "tribe-gaming-na-dominance",
    title: "Tribe Gaming conquista su tercer Monthly Final consecutivo de NA en 2026",
    excerpt:
      "Lxffy y RBM impulsaron a Tribe Gaming hacia otra victoria en North America, consolidando su push hacia el World Finals.",
    body: [
      "North America tiene un dominador claro en 2026. Tribe Gaming suma su tercer Monthly Final consecutivo y se acerca peligrosamente a la clasificación directa para Tokio.",
      "Lxffy continúa siendo el jugador más constante de la región. Su impacto en Bounty y Gem Grab es la base sobre la que RBM y Zeus construyen las victorias. STMN Esports, el histórico rival, no pudo frenarlos en la final.",
      "El leaderboard NA refleja la distancia: Tribe lidera con holgura y solo un milagre en los últimos eventos podría cambiar el panorama. Para fantasy, Lxffy supera los 11M de valoración y sigue subiendo.",
      "La región NA suele ser la gran olvidada en pick'ems globales, pero Tribe Gaming demuestra que cualquier rival en Tokio debería tomarlos en serio.",
    ],
    category: "Resultados",
    date: "2026-04-20",
    author: "Redacción BrawlForge",
    readMinutes: 4,
    coverAccent: "blue",
    relatedTeams: ["tribe-gaming"],
    relatedTournament: "bsc-2026-s3-na-mf",
  },
];

export function getNews(slug: string): NewsArticle | undefined {
  return news.find((n) => n.slug === slug);
}

export function getLatestNews(limit = 6): NewsArticle[] {
  return [...news].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
}

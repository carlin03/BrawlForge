import { DEFAULT_MAP_POOL } from "./match-meta";

export type TournamentMatchTemplate = {
  id: string;
  label: string;
  format: string;
  map_pool: string[];
  map_order: string[];
  map_decisive?: string;
  /** Slugs de torneo que sugieren esta plantilla (autoselección). */
  tournament_hints?: string[];
  notes?: string;
};

const POOL_BO5 = [
  "Bridge Too Far",
  "Center Stage",
  "Double Swoosh",
  "Gem Fort",
  "Hot Zone",
  "Kaboom Canyon",
  "Layer Cake",
] as const;

const ORDER_BO5 = [...POOL_BO5];

const POOL_BO7 = [
  ...POOL_BO5,
  "Belle's Rock",
  "Flaring Phoenix",
  "Hard Rock Mine",
] as const;

const ORDER_BO7 = [...POOL_BO7];

const POOL_BO3 = ["Hot Zone", "Gem Fort", "Bridge Too Far", "Center Stage", "Knockout"] as const;

/** Plantillas BSC por defecto (sin tocar código para temporadas nuevas: ampliar en Admin). */
export const DEFAULT_TOURNAMENT_MATCH_TEMPLATES: TournamentMatchTemplate[] = [
  {
    id: "bsc-monthly-finals-bo5",
    label: "BSC Monthly Finals · BO5",
    format: "Bo5",
    map_pool: [...ORDER_BO5],
    map_order: [...ORDER_BO5],
    tournament_hints: ["monthly-finals", "mf", "monthly"],
    notes: "Final mensual BSC — pool estándar BO5.",
  },
  {
    id: "bsc-worlds-bo7",
    label: "BSC Worlds · BO7",
    format: "Bo7",
    map_pool: [...POOL_BO7],
    map_order: [...ORDER_BO7],
    tournament_hints: ["worlds", "global-finals", "world-finals"],
    notes: "Mundial BSC — serie al mejor de 7.",
  },
  {
    id: "bsc-emea-bo5",
    label: "BSC EMEA · BO5",
    format: "Bo5",
    map_pool: [...ORDER_BO5],
    map_order: ["Gem Fort", "Center Stage", "Hot Zone", "Bridge Too Far", "Layer Cake"],
    tournament_hints: ["emea", "challengers-spain", "challengers"],
    notes: "Circuito EMEA — orden típico Challengers/MF.",
  },
  {
    id: "bsc-na-bo5",
    label: "BSC NA · BO5",
    format: "Bo5",
    map_pool: [...ORDER_BO5],
    map_order: ["Bridge Too Far", "Kaboom Canyon", "Double Swoosh", "Gem Fort", "Center Stage"],
    tournament_hints: ["na", "north-america"],
  },
  {
    id: "bsc-east-asia-bo5",
    label: "BSC East Asia · BO5",
    format: "Bo5",
    map_pool: [...ORDER_BO5],
    map_order: ["Hot Zone", "Layer Cake", "Gem Fort", "Center Stage", "Bridge Too Far"],
    tournament_hints: ["east-asia", "ea", "japan", "korea"],
  },
  {
    id: "bsc-groups-bo3",
    label: "BSC Groups · BO3",
    format: "Bo3",
    map_pool: [...POOL_BO3],
    map_order: [...POOL_BO3].slice(0, 3),
    tournament_hints: ["group", "groups", "stage"],
  },
  {
    id: "custom-empty",
    label: "Sin plantilla (manual)",
    format: "Bo3",
    map_pool: [],
    map_order: [],
  },
];

export const TOURNAMENT_TEMPLATES_SETTINGS_KEY = "tournament_match_templates";

export function mergeTournamentTemplates(
  custom: TournamentMatchTemplate[] | null | undefined,
): TournamentMatchTemplate[] {
  const byId = new Map<string, TournamentMatchTemplate>();
  for (const t of DEFAULT_TOURNAMENT_MATCH_TEMPLATES) byId.set(t.id, t);
  for (const t of custom ?? []) {
    if (t.id) byId.set(t.id, { ...byId.get(t.id), ...t });
  }
  return [...byId.values()];
}

export function suggestTemplateForTournament(
  tournamentSlug: string,
  templates: TournamentMatchTemplate[],
): TournamentMatchTemplate | null {
  const slug = tournamentSlug.toLowerCase();
  for (const t of templates) {
    if (t.tournament_hints?.some((h) => slug.includes(h.toLowerCase()))) return t;
  }
  if (slug.includes("world")) return templates.find((t) => t.id === "bsc-worlds-bo7") ?? null;
  if (slug.includes("emea") || slug.includes("challengers"))
    return templates.find((t) => t.id === "bsc-emea-bo5") ?? null;
  if (slug.includes("monthly") || slug.includes("finals"))
    return templates.find((t) => t.id === "bsc-monthly-finals-bo5") ?? null;
  return null;
}

export function applyTemplateToMatchForm(
  template: TournamentMatchTemplate,
): {
  format: string;
  map_pool: string[];
  map_order: string[];
  map_decisive: string;
} {
  const pool = template.map_pool.length ? template.map_pool : [...DEFAULT_MAP_POOL];
  const order = template.map_order.length ? template.map_order : pool;
  return {
    format: template.format,
    map_pool: pool,
    map_order: order,
    map_decisive: template.map_decisive ?? "",
  };
}

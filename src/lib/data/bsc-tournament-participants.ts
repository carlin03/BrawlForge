/**
 * Participantes BSC 2026 por torneo — fuente de verdad para /tournaments (no el sync Liquipedia).
 * Prioridad: partidos reales → lista curada → vacío.
 */
import { bscMatches } from "./bsc-matches";
import { BSC_TOURNAMENT_ALIASES } from "./bsc-tournaments";
import { isBsc2026ActiveTeam } from "./bsc-2026-active-teams";
import { getGeneratedMatches, normalizeParticipantList } from "./catalog";

const MF_EMEA_8 = [
  "fut-esports",
  "sk-gaming",
  "team-heretics",
  "hmble",
  "natus-vincere",
  "totem-esports",
  "novo-esports",
  "big",
] as const;

const MF_EA_8 = [
  "crazy-raccoon",
  "zeta-division",
  "reject",
  "skcalalas-ea",
  "rival-esports",
  "wwl-esports",
  "feasible-gaming",
  "frenzy-esports",
] as const;

const MF_NA_8 = [
  "tribe-gaming",
  "only-realm",
  "stmn-esports",
  "team-elektros",
  "vatic-esports",
  "elevate",
  "f-a-homeless",
  "legacy-esports",
] as const;

const MF_SA_8 = [
  "loud",
  "skcalalas",
  "new-heights-gaming",
  "kaioperro",
  "eternal-esports",
  "bounty-hunters-esports",
  "alguem-segura",
  "olimpo-squad",
] as const;

const CN_MF_8 = [
  "ace-xero",
  "toxic-lotus",
  "crazy-raccoon",
  "zeta-division",
  "reject",
  "skcalalas-ea",
  "feasible-gaming",
  "fennel",
] as const;

/** Participantes verificados (Liquipedia + partidos BrawlForge) */
export const BSC_TOURNAMENT_PARTICIPANTS: Record<string, readonly string[]> = {
  "bsc-2026-brawl-cup": [
    "hmble",
    "fut-esports",
    "tribe-gaming",
    "zeta-division",
    "crazy-raccoon",
    "only-realm",
    "bounty-hunters-esports",
    "bc-gaming-sa",
    "eternal-esports",
    "revenant-xspark",
    "ace-xero",
    "toxic-lotus",
  ],

  "bsc-2026-psi-emea": ["sk-gaming", "team-heretics", "hmble", "fut-esports"],
  "bsc-2026-psi-ea": ["crazy-raccoon", "zeta-division", "reject", "skcalalas-ea"],
  "bsc-2026-psi-na": ["tribe-gaming", "only-realm", "stmn-esports", "elevate"],
  "bsc-2026-psi-sa": ["loud", "skcalalas", "eternal-esports", "bounty-hunters-esports"],

  // March MF — 8 equipos (cuadro completo en partidos)
  "bsc-2026-march-emea-mf": [
    "fut-esports",
    "kebap",
    "team-heretics",
    "natus-vincere",
    "hmble",
    "totem-esports",
    "novo-esports",
    "sk-gaming",
  ],
  "bsc-2026-march-ea-mf": [...MF_EA_8],
  "bsc-2026-march-na-mf": [...MF_NA_8],
  "bsc-2026-march-sa-mf": [...MF_SA_8],

  "bsc-2026-february-emea-mf": [...MF_EMEA_8],
  "bsc-2026-february-ea-mf": [...MF_EA_8],
  "bsc-2026-february-na-mf": [...MF_NA_8],
  "bsc-2026-february-sa-mf": [...MF_SA_8],

  "bsc-2026-april-emea-mf": [...MF_EMEA_8],
  "bsc-2026-april-ea-mf": [...MF_EA_8],
  "bsc-2026-april-na-mf": [...MF_NA_8],
  "bsc-2026-april-sa-mf": [...MF_SA_8],

  "bsc-2026-may-emea-mf": [...MF_EMEA_8],
  "bsc-2026-may-ea-mf": [...MF_EA_8],
  "bsc-2026-may-na-mf": [...MF_NA_8],
  "bsc-2026-may-sa-mf": [...MF_SA_8],

  "bsc-2026-june-emea-mf": [...MF_EMEA_8],
  "bsc-2026-june-ea-mf": [...MF_EA_8],
  "bsc-2026-june-na-mf": [...MF_NA_8],
  "bsc-2026-june-sa-mf": [...MF_SA_8],

  "bsc-2026-july-emea-mf": [...MF_EMEA_8],
  "bsc-2026-july-ea-mf": [...MF_EA_8],
  "bsc-2026-july-na-mf": [...MF_NA_8],
  "bsc-2026-july-sa-mf": [...MF_SA_8],

  "bsc-2026-august-emea-mf": [...MF_EMEA_8],
  "bsc-2026-august-ea-mf": [...MF_EA_8],
  "bsc-2026-august-na-mf": [...MF_NA_8],
  "bsc-2026-august-sa-mf": [...MF_SA_8],

  "bsc-2026-s3-emea-mf": [...MF_EMEA_8],
  "bsc-2026-s3-ea-mf": [...MF_EA_8],
  "bsc-2026-s3-na-mf": [...MF_NA_8],
  "bsc-2026-s3-sa-mf": [...MF_SA_8],

  "bsc-2026-cn-february-mf": [...CN_MF_8],
  "bsc-2026-cn-march-mf": [...CN_MF_8],
  "bsc-2026-cn-april-mf": [...CN_MF_8],
  "bsc-2026-cn-may-mf": ["toxic-lotus", "ace-xero", "zeta-division", "crazy-raccoon", "reject", "skcalalas-ea", "feasible-gaming", "fennel"],

  "bsc-2026-cn-finals": ["toxic-lotus", "ace-xero", "zeta-division", "crazy-raccoon"],

  "bsc-2026-challengers-dach": [
    "sk-gaming",
    "natus-vincere",
    "team-heretics",
    "hmble",
    "fut-esports",
    "totem-esports",
    "novo-esports",
    "big",
    "big-talents",
    "kebap",
    "metizport",
    "madridmira",
    "cmm",
    "fut-esports-academy",
  ],

  "bsc-2026-challengers-spain": [
    "sk-gaming",
    "team-heretics",
    "novo-esports",
    "totem-esports",
  ],

  "world-finals-2026": [
    "crazy-raccoon",
    "sk-gaming",
    "tribe-gaming",
    "loud",
    "zeta-division",
    "hmble",
    "fut-esports",
    "team-heretics",
    "natus-vincere",
    "reject",
    "skcalalas",
    "only-realm",
    "toxic-lotus",
    "ace-xero",
    "bounty-hunters-esports",
    "eternal-esports",
  ],
};

const MF_MONTHS = ["february", "march", "april", "may", "june", "july", "august"] as const;
for (const month of MF_MONTHS) {
  const key = (r: string) => `bsc-2026-${month}-${r}-mf`;
  if (!BSC_TOURNAMENT_PARTICIPANTS[key("emea")]) BSC_TOURNAMENT_PARTICIPANTS[key("emea")] = [...MF_EMEA_8];
  if (!BSC_TOURNAMENT_PARTICIPANTS[key("ea")]) BSC_TOURNAMENT_PARTICIPANTS[key("ea")] = [...MF_EA_8];
  if (!BSC_TOURNAMENT_PARTICIPANTS[key("na")]) BSC_TOURNAMENT_PARTICIPANTS[key("na")] = [...MF_NA_8];
  if (!BSC_TOURNAMENT_PARTICIPANTS[key("sa")]) BSC_TOURNAMENT_PARTICIPANTS[key("sa")] = [...MF_SA_8];
}

function tournamentSlugsForLookup(slug: string): string[] {
  const alias = BSC_TOURNAMENT_ALIASES[slug];
  return alias ? [slug, alias] : [slug];
}

/** Equipos que aparecen en partidos del torneo (solo clubes BSC activos). */
export function extractTournamentParticipantsFromMatches(tournamentSlug: string): string[] {
  const slugs = new Set(tournamentSlugsForLookup(tournamentSlug));
  const found = new Set<string>();

  const extra2026 = getGeneratedMatches().filter(
    (m) => m.date?.startsWith("2026") && /^bsc-2026|^world-finals-2026/i.test(m.tournamentSlug),
  );
  for (const m of [...bscMatches, ...extra2026]) {
    if (!slugs.has(m.tournamentSlug)) continue;
    if (m.teamASlug && m.teamASlug !== "tbd" && isBsc2026ActiveTeam(m.teamASlug)) found.add(m.teamASlug);
    if (m.teamBSlug && m.teamBSlug !== "tbd" && isBsc2026ActiveTeam(m.teamBSlug)) found.add(m.teamBSlug);
  }

  return normalizeParticipantList([...found]).sort((a, b) => a.localeCompare(b));
}

function resolveCurated(slug: string): string[] {
  const alias = BSC_TOURNAMENT_ALIASES[slug];
  const raw = BSC_TOURNAMENT_PARTICIPANTS[slug] ?? (alias ? BSC_TOURNAMENT_PARTICIPANTS[alias] : undefined);
  return raw?.length ? normalizeParticipantList([...raw]) : [];
}

/**
 * Participantes finales para UI de torneos.
 * Si hay partidos suficientes (≥4 o ≥2 en PSI/CN), los partidos mandan sobre la plantilla curada.
 */
export function getBscTournamentParticipantSlugs(slug: string): string[] {
  const fromMatches = extractTournamentParticipantsFromMatches(slug);
  const curated = resolveCurated(slug);

  const isPsi = slug.includes("-psi-");
  const isCn = slug.includes("-cn-");
  const minFromMatches = isPsi || isCn ? 2 : 4;

  if (fromMatches.length >= minFromMatches) {
    if (curated.length && fromMatches.length < curated.length) {
      const merged = new Set([...fromMatches, ...curated]);
      return normalizeParticipantList([...merged]).sort((a, b) => a.localeCompare(b));
    }
    return fromMatches;
  }

  return curated;
}

/** Re-export para fantasy (misma fuente; MF = 8 equipos del bracket). */
export const BSC_FANTASY_PARTICIPANTS: Record<string, string[]> = Object.fromEntries(
  Object.entries(BSC_TOURNAMENT_PARTICIPANTS).map(([k, v]) => [k, [...v]]),
);

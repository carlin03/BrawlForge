/**
 * Participantes BSC 2026 por torneo — fuente de verdad para /tournaments.
 */
import { bscMatches } from "./bsc-matches";
import { getBscEnrichedMatches, getBscTournamentEnrichment } from "./bsc-tournaments-enriched";
import { BSC_TOURNAMENT_ALIASES } from "./bsc-tournaments";
import { BSC_2026_ACTIVE_TEAM_SLUGS } from "./bsc-2026-active-teams";
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

const SA_ACTIVE = BSC_2026_ACTIVE_TEAM_SLUGS.filter((s) =>
  ["loud", "skcalalas", "new-heights-gaming", "kaioperro", "eternal-esports", "alguem-segura", "olimpo-squad", "bounty-hunters-esports", "enosis-esports", "bc-gaming-sa", "level-esports", "oddyssey", "acre-lovers"].includes(s),
);

const NA_ACTIVE = BSC_2026_ACTIVE_TEAM_SLUGS.filter((s) =>
  ["tribe-gaming", "only-realm", "stmn-esports", "team-elektros", "vatic-esports", "elevate", "f-a-homeless", "vic-day", "legacy-esports"].includes(s),
);

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

/** Participantes verificados por evento BSC 2026 */
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
  "bsc-2026-march-ea-mf": ["crazy-raccoon", "reject", "zeta-division", "skcalalas-ea", "rival-esports", "wwl-esports", "feasible-gaming", "frenzy-esports"],
  "bsc-2026-march-na-mf": ["stmn-esports", "tribe-gaming", "only-realm", "team-elektros", "vatic-esports", "elevate", "f-a-homeless", "legacy-esports"],
  "bsc-2026-march-sa-mf": ["loud", "skcalalas", "eternal-esports", "bounty-hunters-esports", "new-heights-gaming", "kaioperro", "alguem-segura", "olimpo-squad"],

  "bsc-2026-february-emea-mf": [...MF_EMEA_8],
  "bsc-2026-february-ea-mf": [...MF_EA_8],
  "bsc-2026-february-na-mf": [...MF_NA_8],
  "bsc-2026-february-sa-mf": [...MF_SA_8],

  "bsc-2026-april-emea-mf": ["fut-esports", "sk-gaming", "hmble", "team-heretics", "natus-vincere", "totem-esports", "novo-esports", "big"],
  "bsc-2026-april-ea-mf": ["crazy-raccoon", "zeta-division", "reject", "skcalalas-ea", "rival-esports", "wwl-esports", "feasible-gaming", "frenzy-esports"],
  "bsc-2026-april-na-mf": ["tribe-gaming", "only-realm", "stmn-esports", "team-elektros", "vatic-esports", "elevate", "f-a-homeless", "legacy-esports"],
  "bsc-2026-april-sa-mf": ["eternal-esports", "bounty-hunters-esports", "skcalalas", "loud", "new-heights-gaming", "kaioperro", "alguem-segura", "olimpo-squad"],

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

  "bsc-2026-rtbc-sa-west": [
    "loud",
    "skcalalas",
    "eternal-esports",
    "bounty-hunters-esports",
    "new-heights-gaming",
    "kaioperro",
    "oddyssey",
    "olimpo-squad",
    "level-esports",
    "enosis-esports",
    "bc-gaming-sa",
    "alguem-segura",
  ],
  "bsc-2026-rtbc-sesa": ["feasible-gaming", "rival-esports", "wwl-esports", "fennel", "insomnia", "skcalalas-ea"],

  "bsc-2026-challengers-dach": [
    "sk-gaming",
    "natus-vincere",
    "team-heretics",
    "hmble",
    "fut-esports",
    "totem-esports",
    "novo-esports",
    "big",
    "kebap",
    "cmm",
    "fut-esports-academy",
    "sk-gaming",
    "natus-vincere",
  ],
  "bsc-2026-challengers-spain": ["sk-gaming", "team-heretics", "novo-esports", "totem-esports"],
  "bsc-2026-challengers-italy": ["novo-esports", "totem-esports"],
  "bsc-2026-challengers-france": [
    "fut-esports",
    "team-heretics",
    "hmble",
    "sk-gaming",
    "natus-vincere",
    "totem-esports",
    "novo-esports",
    "big",
  ],
  "bsc-2026-challengers-turkey": [
    "fut-esports",
    "team-heretics",
    "hmble",
    "natus-vincere",
    "totem-esports",
    "novo-esports",
    "big",
    "kebap",
    "cmm",
    "fut-esports-academy",
    "sk-gaming",
    "revenant-xspark",
    "novo-esports",
  ],
  "bsc-2026-challengers-sa-west": [...SA_ACTIVE],
  "bsc-2026-challengers-brasil": [...SA_ACTIVE],
  "bsc-2026-challengers-na": [...NA_ACTIVE],
  "bsc-2026-challengers-finals": [
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
    "toxic-lotus",
    "ace-xero",
  ],

  "bsc-2026-lcq": [
    "hmble",
    "fut-esports",
    "sk-gaming",
    "crazy-raccoon",
    "tribe-gaming",
    "loud",
    "zeta-division",
    "toxic-lotus",
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

export function extractTournamentParticipantsFromMatches(tournamentSlug: string): string[] {
  const slugs = new Set(tournamentSlugsForLookup(tournamentSlug));
  const found = new Set<string>();

  const extra2026 = getGeneratedMatches().filter(
    (m) => m.date?.startsWith("2026") && /^bsc-2026|^world-finals-2026/i.test(m.tournamentSlug),
  );
  for (const m of [...bscMatches, ...getBscEnrichedMatches(), ...extra2026]) {
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

/** Lista final: Liquipedia (sync) → curada → partidos parseados. */
export function getBscTournamentParticipantSlugs(slug: string): string[] {
  for (const s of tournamentSlugsForLookup(slug)) {
    const wiki = getBscTournamentEnrichment(s)?.participantSlugs;
    if (wiki?.length) {
      const norm = normalizeParticipantList(wiki.filter((t) => isBsc2026ActiveTeam(t)));
      if (norm.length >= 2) return norm;
    }
  }
  const curated = resolveCurated(slug);
  if (curated.length) return curated;
  return extractTournamentParticipantsFromMatches(slug);
}

export const BSC_FANTASY_PARTICIPANTS: Record<string, string[]> = Object.fromEntries(
  Object.entries(BSC_TOURNAMENT_PARTICIPANTS).map(([k, v]) => [k, [...new Set(v)]]),
);

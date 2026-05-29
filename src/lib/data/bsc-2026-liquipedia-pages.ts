/**
 * Página Liquipedia oficial por slug de torneo BSC 2026 (ruta sin dominio).
 * Fuente: https://liquipedia.net/brawlstars/Brawl_Stars_Championship/2026
 */
const MONTH_TO_SEASON: Record<string, string> = {
  february: "Season_1",
  march: "Season_2",
  april: "Season_3",
  may: "Season_4",
  june: "Season_5",
  july: "Season_6",
  august: "Season_7",
};

const REGION_TO_LP: Record<string, string> = {
  emea: "EMEA",
  ea: "East_Asia",
  na: "North_America",
  sa: "South_America",
};

const BSC_BASE = "Brawl_Stars_Championship/2026";

/** Slug app → página Liquipedia */
export const BSC_2026_LIQUIPEDIA_PAGE: Record<string, string> = {
  "bsc-2026-brawl-cup": `${BSC_BASE}/Brawl_Cup`,
  "bsc-2026-rtbc-sa-west": `${BSC_BASE}/Road_To_Brawl_Cup/SA_West`,
  "bsc-2026-rtbc-sesa": `${BSC_BASE}/Road_To_Brawl_Cup/SESA`,
  "bsc-2026-lcq": `${BSC_BASE}/Last_Chance_Qualifier`,
  "bsc-2026-challengers-dach": `${BSC_BASE}/Challengers/DACH_Finals`,
  "bsc-2026-challengers-sa-west": `${BSC_BASE}/Challengers/South_America_West`,
  "bsc-2026-challengers-na": `${BSC_BASE}/Challengers/North_America_Finals`,
  "bsc-2026-challengers-italy": `${BSC_BASE}/Challengers/Italy_Finals`,
  "bsc-2026-challengers-spain": `${BSC_BASE}/Challengers/Spain_Grand_Finals`,
  "bsc-2026-challengers-brasil": `${BSC_BASE}/Challengers/Brasil`,
  "bsc-2026-challengers-france": `${BSC_BASE}/Challengers/France_Finals`,
  "bsc-2026-challengers-turkey": `${BSC_BASE}/Challengers/Türkiye_Finals`,
  "bsc-2026-challengers-finals": `${BSC_BASE}/Challengers_Finals`,
  "bsc-2026-cn-finals": `${BSC_BASE}/Chinese_Mainland_Finals`,
  "world-finals-2026": "Brawl_Stars_World_Finals/2026",
  "bsc-2026-psi-emea": `${BSC_BASE}/Pre-Season_Invitational/EMEA`,
  "bsc-2026-psi-ea": `${BSC_BASE}/Pre-Season_Invitational/East_Asia`,
  "bsc-2026-psi-na": `${BSC_BASE}/Pre-Season_Invitational/North_America`,
  "bsc-2026-psi-sa": `${BSC_BASE}/Pre-Season_Invitational/South_America`,
  "bsc-2026-cn-february-mf": `${BSC_BASE}/Chinese_Mainland/February_Monthly_Finals`,
  "bsc-2026-cn-march-mf": `${BSC_BASE}/Chinese_Mainland/March_Monthly_Finals`,
  "bsc-2026-cn-april-mf": `${BSC_BASE}/Chinese_Mainland/April_Monthly_Finals`,
  "bsc-2026-cn-may-mf": `${BSC_BASE}/Chinese_Mainland/May_Monthly_Finals`,
};

const MF_MONTHS = ["february", "march", "april", "may", "june", "july", "august"] as const;
const MF_REGIONS = ["emea", "ea", "na", "sa"] as const;

for (const month of MF_MONTHS) {
  const season = MONTH_TO_SEASON[month];
  if (!season) continue;
  for (const region of MF_REGIONS) {
    const lpRegion = REGION_TO_LP[region];
    const slug = `bsc-2026-${month}-${region}-mf`;
    BSC_2026_LIQUIPEDIA_PAGE[slug] = `${BSC_BASE}/${season}/${lpRegion}/Monthly_Finals`;
  }
}

export function getBsc2026LiquipediaPage(slug: string): string | undefined {
  return BSC_2026_LIQUIPEDIA_PAGE[slug.trim().toLowerCase()];
}

export function getBsc2026LiquipediaUrl(slug: string): string | undefined {
  const page = getBsc2026LiquipediaPage(slug);
  return page ? `https://liquipedia.net/brawlstars/${page}` : undefined;
}

export function listBsc2026LiquipediaSlugs(): string[] {
  return Object.keys(BSC_2026_LIQUIPEDIA_PAGE).sort();
}

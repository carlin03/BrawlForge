import type { Region } from "../types";
import type { EsportsTournament } from "./matches";
import { getBsc2026LiquipediaUrl } from "./bsc-2026-liquipedia-pages";

const BSC26 = "https://liquipedia.net/brawlstars/Brawl_Stars_Championship/2026";
const BSC_LOGO = "https://taiyoro-prod-media.s3.amazonaws.com/game/mWB0X8mVG2.png";

type TDef = Omit<EsportsTournament, "liquipediaUrl"> & { liquipediaUrl?: string };

function mf(
  month: string,
  region: Region,
  regionLabel: string,
  start: string,
  prize: string,
  status: EsportsTournament["status"],
  winnerSlug?: string,
): TDef {
  const slug = `bsc-2026-${month}-${region.toLowerCase()}-mf`;
  return {
    slug,
    name: `BSC 2026: ${month.charAt(0).toUpperCase() + month.slice(1)} ${regionLabel} Monthly Finals`,
    shortName: `BSC ${month.slice(0, 3).toUpperCase()} ${region} MF`,
    region,
    prizePool: prize,
    teams: 8,
    status,
    startDate: start,
    endDate: start,
    location: "Online",
    stage: status === "finished" ? "Completed" : status === "live" ? "In progress" : "Scheduled",
    winnerSlug,
  };
}

/** PSI 2026 — solo para partidos históricos (no listar en admin/home) */
export const bsc2026LegacyPsiTournaments: EsportsTournament[] = (
  [
    {
      slug: "bsc-2026-psi-emea",
      name: "BSC 2026: Pre-Season Invitational EMEA",
      shortName: "Pre-Season Invitational EMEA",
      region: "EMEA",
      prizePool: "$5,000",
      teams: 4,
      status: "finished",
      startDate: "2026-01-24",
      endDate: "2026-01-24",
      location: "Online",
      stage: "Completed",
      winnerSlug: "sk-gaming",
    },
    {
      slug: "bsc-2026-psi-ea",
      name: "BSC 2026: Pre-Season Invitational East Asia",
      shortName: "Pre-Season Invitational EA",
      region: "EA",
      prizePool: "$5,000",
      teams: 4,
      status: "finished",
      startDate: "2026-01-24",
      endDate: "2026-01-24",
      location: "Online",
      stage: "Completed",
      winnerSlug: "crazy-raccoon",
    },
    {
      slug: "bsc-2026-psi-na",
      name: "BSC 2026: Pre-Season Invitational North America",
      shortName: "Pre-Season Invitational NA",
      region: "NA",
      prizePool: "$5,000",
      teams: 4,
      status: "finished",
      startDate: "2026-01-25",
      endDate: "2026-01-25",
      location: "Online",
      stage: "Completed",
      winnerSlug: "tribe-gaming",
    },
    {
      slug: "bsc-2026-psi-sa",
      name: "BSC 2026: Pre-Season Invitational South America",
      shortName: "Pre-Season Invitational SA",
      region: "SA",
      prizePool: "$5,000",
      teams: 4,
      status: "finished",
      startDate: "2026-01-25",
      endDate: "2026-01-25",
      location: "Online",
      stage: "Completed",
      winnerSlug: "loud",
    },
  ] satisfies TDef[]
).map((t) => ({
  ...t,
  liquipediaUrl: ("liquipediaUrl" in t && t.liquipediaUrl) ? t.liquipediaUrl : BSC26,
})) as EsportsTournament[];

/** Calendario BSC 2026 — fuente: Liquipedia Brawl Stars Championship/2026 */
export const bsc2026Tournaments: EsportsTournament[] = (
  [
    // February Monthly Finals
    mf("february", "EMEA", "EMEA", "2026-02-15", "$42,000", "finished", "hmble"),
    mf("february", "EA", "East Asia", "2026-02-14", "$40,000", "finished", "zeta-division"),
    mf("february", "NA", "North America", "2026-02-22", "$34,000", "finished", "tribe-gaming"),
    mf("february", "SA", "South America", "2026-02-21", "$31,000", "finished", "skcalalas"),

    // March Monthly Finals
    mf("march", "EMEA", "EMEA", "2026-03-15", "$42,000", "finished", "fut-esports"),
    mf("march", "EA", "East Asia", "2026-03-14", "$40,000", "finished", "crazy-raccoon"),
    mf("march", "NA", "North America", "2026-03-22", "$34,000", "finished", "stmn-esports"),
    mf("march", "SA", "South America", "2026-03-21", "$31,000", "finished", "loud"),

    // April Monthly Finals (Season 3)
    mf("april", "EMEA", "EMEA", "2026-04-12", "$42,000", "finished", "fut-esports"),
    mf("april", "EA", "East Asia", "2026-04-11", "$40,000", "finished", "crazy-raccoon"),
    mf("april", "NA", "North America", "2026-04-19", "$34,000", "finished", "tribe-gaming"),
    mf("april", "SA", "South America", "2026-04-18", "$31,000", "finished", "skcalalas"),

    // May — Brawl Cup + Road events
    {
      slug: "bsc-2026-brawl-cup",
      name: "BSC 2026: Brawl Cup",
      shortName: "Brawl Cup 2026",
      region: "GLOBAL",
      prizePool: "$100,000",
      teams: 12,
      status: "finished",
      startDate: "2026-05-15",
      endDate: "2026-05-17",
      location: "Online",
      stage: "Completed",
      winnerSlug: "hmble",
    },
    {
      slug: "bsc-2026-rtbc-sa-west",
      name: "Road to Brawl Cup: SA West",
      shortName: "Road to Brawl Cup SA West",
      region: "SA",
      prizePool: "$5,000",
      teams: 12,
      status: "finished",
      startDate: "2026-02-23",
      endDate: "2026-02-28",
      location: "Online",
      stage: "Completed",
    },
    {
      slug: "bsc-2026-rtbc-sesa",
      name: "Road to Brawl Cup SESA",
      shortName: "Road to Brawl Cup SESA",
      region: "EA",
      prizePool: "$5,000",
      teams: 6,
      status: "finished",
      startDate: "2026-03-07",
      endDate: "2026-03-08",
      location: "Online",
      stage: "Completed",
    },

    // Challengers
    {
      slug: "bsc-2026-challengers-dach",
      name: "Brawl Stars Challengers: DACH Finals",
      shortName: "Challengers DACH",
      region: "EMEA",
      prizePool: "$25,000",
      teams: 16,
      status: "finished",
      startDate: "2026-05-02",
      endDate: "2026-05-30",
      location: "Düsseldorf",
      stage: "Completed",
      winnerSlug: "sk-gaming",
    },
    {
      slug: "bsc-2026-challengers-sa-west",
      name: "Brawl Stars Challengers: South America West",
      shortName: "Challengers SA West",
      region: "SA",
      prizePool: "$25,000",
      teams: 16,
      status: "live",
      startDate: "2026-05-09",
      endDate: "2026-06-28",
      location: "Online",
      stage: "In progress",
    },
    {
      slug: "bsc-2026-challengers-na",
      name: "Brawl Stars Challengers: North America Finals",
      shortName: "Challengers NA",
      region: "NA",
      prizePool: "$25,000",
      teams: 16,
      status: "upcoming",
      startDate: "2026-06-04",
      endDate: "2026-06-14",
      location: "Online",
      stage: "Scheduled",
    },
    {
      slug: "bsc-2026-challengers-italy",
      name: "Brawl Stars Challengers: Italy Finals",
      shortName: "Challengers Italy",
      region: "EMEA",
      prizePool: "$25,000",
      teams: 4,
      status: "upcoming",
      startDate: "2026-06-28",
      endDate: "2026-06-28",
      location: "Bergamo",
      stage: "Scheduled",
    },
    {
      slug: "bsc-2026-challengers-spain",
      name: "Brawl Stars Challengers: Spain Grand Finals",
      shortName: "Challengers Spain",
      region: "EMEA",
      prizePool: "$25,000",
      teams: 4,
      status: "upcoming",
      startDate: "2026-07-04",
      endDate: "2026-07-05",
      location: "Valencia",
      stage: "Scheduled",
    },
    {
      slug: "bsc-2026-challengers-brasil",
      name: "Brawl Stars Challengers: Brasil",
      shortName: "Challengers Brasil",
      region: "SA",
      prizePool: "$25,000",
      teams: 24,
      status: "live",
      startDate: "2026-05-23",
      endDate: "2026-07-18",
      location: "Online",
      stage: "In progress",
    },
    {
      slug: "bsc-2026-challengers-france",
      name: "Brawl Stars Challengers: France Finals",
      shortName: "Challengers France",
      region: "EMEA",
      prizePool: "$13,000",
      teams: 8,
      status: "upcoming",
      startDate: "2026-07-18",
      endDate: "2026-07-19",
      location: "Online",
      stage: "Scheduled",
    },
    {
      slug: "bsc-2026-challengers-turkey",
      name: "Brawl Stars Challengers: Türkiye Finals",
      shortName: "Challengers Türkiye",
      region: "EMEA",
      prizePool: "TBA",
      teams: 16,
      status: "upcoming",
      startDate: "2026-07-20",
      endDate: "2026-07-26",
      location: "Istanbul",
      stage: "Scheduled",
    },
    {
      slug: "bsc-2026-challengers-finals",
      name: "Brawl Stars Challengers Finals",
      shortName: "Challengers Finals",
      region: "GLOBAL",
      prizePool: "TBA",
      teams: 12,
      status: "upcoming",
      startDate: "2026-09-05",
      endDate: "2026-09-06",
      location: "TBD",
      stage: "Scheduled",
    },

    // June Monthly Finals
    mf("june", "EMEA", "EMEA", "2026-06-14", "$42,000", "upcoming"),
    mf("june", "EA", "East Asia", "2026-06-13", "$40,000", "upcoming"),
    mf("june", "NA", "North America", "2026-06-21", "$34,000", "upcoming"),
    mf("june", "SA", "South America", "2026-06-20", "$31,000", "upcoming"),

    // July Monthly Finals
    mf("july", "EMEA", "EMEA", "2026-07-12", "$42,000", "upcoming"),
    mf("july", "EA", "East Asia", "2026-07-18", "$40,000", "upcoming"),
    mf("july", "NA", "North America", "2026-07-19", "$34,000", "upcoming"),
    mf("july", "SA", "South America", "2026-07-11", "$31,000", "upcoming"),
    {
      slug: "bsc-2026-cn-finals",
      name: "BSC 2026: Chinese Mainland Finals",
      shortName: "CN Finals",
      region: "EA",
      prizePool: "$22,436",
      teams: 4,
      status: "upcoming",
      startDate: "2026-07-01",
      endDate: "2026-07-01",
      location: "Online",
      stage: "Scheduled",
    },

    // August Monthly Finals
    mf("august", "EMEA", "EMEA", "2026-08-09", "$42,000", "upcoming"),
    mf("august", "EA", "East Asia", "2026-08-08", "$40,000", "upcoming"),
    mf("august", "NA", "North America", "2026-08-16", "$34,000", "upcoming"),
    mf("august", "SA", "South America", "2026-08-15", "$31,000", "upcoming"),

    // LCQ + World Finals
    {
      slug: "bsc-2026-lcq",
      name: "BSC 2026: Last Chance Qualifier",
      shortName: "LCQ 2026",
      region: "GLOBAL",
      prizePool: "$18,000",
      teams: 8,
      status: "upcoming",
      startDate: "2026-10-17",
      endDate: "2026-10-18",
      location: "Berlin",
      stage: "Scheduled",
    },
    {
      slug: "world-finals-2026",
      name: "Brawl Stars World Finals 2026",
      shortName: "World Finals",
      region: "GLOBAL",
      prizePool: "TBA",
      teams: 16,
      status: "upcoming",
      startDate: "2026-11-01",
      endDate: "2026-11-30",
      location: "Tokyo, Japan",
      stage: "Qualifiers ongoing",
      liquipediaUrl: "https://liquipedia.net/brawlstars/Brawl_Stars_World_Finals/2026",
    },

    // Chinese Mainland Monthly Finals
    ...(["february", "march", "april", "may"] as const).map(
      (month): TDef => ({
        slug: `bsc-2026-cn-${month}-mf`,
        name: `BSC 2026: Chinese Mainland ${month.charAt(0).toUpperCase() + month.slice(1)} Monthly Finals`,
        shortName: `CN ${month.slice(0, 3).toUpperCase()} MF`,
        region: "EA",
        prizePool: "$1,600",
        teams: 8,
        status: "finished",
        startDate: month === "february" ? "2026-03-07" : month === "march" ? "2026-03-22" : month === "april" ? "2026-04-18" : "2026-05-23",
        endDate: month === "february" ? "2026-03-07" : month === "march" ? "2026-03-22" : month === "april" ? "2026-04-18" : "2026-05-23",
        location: "Online",
        stage: "Completed",
        winnerSlug: month === "may" ? "crazy-raccoon" : month === "april" ? "zeta-division" : undefined,
      }),
    ),
  ] satisfies TDef[]
).map((t) => ({
  ...t,
  liquipediaUrl: getBsc2026LiquipediaUrl(t.slug) ?? t.liquipediaUrl ?? BSC26,
}));

/** Alias slugs used elsewhere in the app */
export const BSC_TOURNAMENT_ALIASES: Record<string, string> = {
  "bsc-2026-s3-emea-mf": "bsc-2026-april-emea-mf",
  "bsc-2026-s3-ea-mf": "bsc-2026-april-ea-mf",
  "bsc-2026-s3-na-mf": "bsc-2026-april-na-mf",
};

export const BSC_DEFAULT_LOGO = BSC_LOGO;

const ADMIN_TOURNAMENT_HIDE = /^(PSI|RTBC)\b/i;

/** Slugs del circuito BSC 2026 (+ alias) — excluye PSI legacy y catálogo Liquipedia genérico */
export const BSC_CIRCUIT_SLUGS = new Set<string>([
  ...bsc2026Tournaments.map((t) => t.slug),
  ...Object.keys(BSC_TOURNAMENT_ALIASES),
]);

export function isBscCircuitSlug(slug: string): boolean {
  return BSC_CIRCUIT_SLUGS.has(slug);
}

/** Torneos públicos BSC (mismo conjunto que admin/logos, sin Liquipedia genérico) */
export const BSC_PUBLIC_TOURNAMENT_COUNT = BSC_CIRCUIT_SLUGS.size;

/** Torneos BSC visibles en admin (logos) y listados principales — sin abreviaturas PSI/RTBC */
export function getAdminBscTournaments(): EsportsTournament[] {
  return bsc2026Tournaments
    .filter((t) => !ADMIN_TOURNAMENT_HIDE.test(t.shortName))
    .sort((a, b) => a.shortName.localeCompare(b.shortName));
}

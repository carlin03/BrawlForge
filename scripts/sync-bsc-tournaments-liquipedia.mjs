/**
 * Enriquece torneos BSC 2026 desde Liquipedia (Infobox league + participantes + partidos).
 *
 *   node scripts/sync-bsc-tournaments-liquipedia.mjs
 *   node scripts/sync-bsc-tournaments-liquipedia.mjs --write
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  sleep,
  fetchWikitextBatch,
  parseLeagueInfobox,
  parseParticipantTeams,
  parseMatchesFromWikitext,
  buildTeamResolver,
  mapRegion,
  tournamentStatus,
  cleanLabel,
} from "./liquipedia-api.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "src", "lib", "data", "generated");
const WRITE = process.argv.includes("--write");
const BATCH = 20;
const DELAY_MS = 2200;

const BSC_BASE = "Brawl_Stars_Championship/2026";
const MONTH_TO_SEASON = {
  february: "Season_1",
  march: "Season_2",
  april: "Season_3",
  may: "Season_4",
  june: "Season_5",
  july: "Season_6",
  august: "Season_7",
};
const REGION_TO_LP = { emea: "EMEA", ea: "East_Asia", na: "North_America", sa: "South_America" };

function buildSlugPageMap() {
  const map = {
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
  for (const [month, season] of Object.entries(MONTH_TO_SEASON)) {
    for (const [region, lpRegion] of Object.entries(REGION_TO_LP)) {
      map[`bsc-2026-${month}-${region}-mf`] = `${BSC_BASE}/${season}/${lpRegion}/Monthly_Finals`;
    }
  }
  return map;
}

function mfDisplayName(slug) {
  const m = slug.match(/^bsc-2026-(february|march|april|may|june|july|august)-(emea|ea|na|sa)-mf$/);
  if (!m) return null;
  const month = m[1].charAt(0).toUpperCase() + m[1].slice(1);
  const region = { emea: "EMEA", ea: "East Asia", na: "North America", sa: "South America" }[m[2]];
  return `Brawl Stars Championship 2026: ${month} ${region} Monthly Finals`;
}

async function main() {
  const teamsPath = path.join(outDir, "teams.json");
  if (!fs.existsSync(teamsPath)) {
    console.error("Falta teams.json — ejecuta: npm run data:sync:full -- --write");
    process.exit(1);
  }
  const allTeams = JSON.parse(fs.readFileSync(teamsPath, "utf8"));
  const resolveTeam = buildTeamResolver(allTeams);
  const slugPage = buildSlugPageMap();
  const entries = Object.entries(slugPage);
  console.log(`Liquipedia BSC 2026 — ${entries.length} torneos\n`);

  const enriched = {};
  const allMatches = [];

  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH);
    const titles = batch.map(([, page]) => page);
    const texts = await fetchWikitextBatch(titles);
    process.stdout.write(`  batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(entries.length / BATCH)}... `);
    let ok = 0;

    for (const [slug, page] of batch) {
      const titleKey = page.replace(/_/g, " ");
      const wikitext =
        texts[titleKey] ??
        texts[page] ??
        texts[page.replace(/\//g, " / ")] ??
        "";
      if (!wikitext) {
        enriched[slug] = { slug, liquipediaPage: page, liquipediaUrl: `https://liquipedia.net/brawlstars/${page}`, missing: true };
        continue;
      }
      const info = parseLeagueInfobox(wikitext);
      const region =
        slug.includes("-emea-") || slug.endsWith("-emea-mf")
          ? "EMEA"
          : slug.includes("-ea-") || slug.endsWith("-ea-mf") || slug.includes("sesa") || slug.includes("cn-")
            ? "EA"
            : slug.includes("-na-")
              ? "NA"
              : slug.includes("-sa-")
                ? "SA"
                : "GLOBAL";
      const participantNames = parseParticipantTeams(wikitext);
      const parsedMatches = parseMatchesFromWikitext(wikitext, slug, mapRegion(region), resolveTeam, page);
      const fromNames = participantNames.map(resolveTeam).filter(Boolean);
      const fromMatches = parsedMatches.flatMap((m) => [m.teamASlug, m.teamBSlug]);
      const participantSlugs = [...new Set([...fromNames, ...fromMatches])];
      allMatches.push(...parsedMatches);

      const status = tournamentStatus(info.startDate, info.endDate);
      const slugName = mfDisplayName(slug);
      enriched[slug] = {
        slug,
        liquipediaPage: page,
        liquipediaUrl: `https://liquipedia.net/brawlstars/${page}`,
        name: slugName ?? (info.name ? cleanLabel(info.name) : undefined),
        shortName: info.shortName ? cleanLabel(info.shortName) : undefined,
        prizePool: info.prizePool,
        startDate: info.startDate || undefined,
        endDate: info.endDate || undefined,
        location: info.location,
        city: info.city || undefined,
        country: info.country || undefined,
        venue: info.venue || undefined,
        type: info.type || undefined,
        format: info.format || undefined,
        organizer: info.organizer || undefined,
        liquipediaTier: info.liquipediaTier,
        teamCount: info.teamCount,
        series: info.series || undefined,
        website: info.website || undefined,
        winnerPage: info.winnerPage,
        winnerSlug: info.winnerPage ? resolveTeam(info.winnerPage) : undefined,
        status,
        participantSlugs,
        matchCount: parsedMatches.length,
        prizeBreakdown: info.prizeBreakdown,
        syncedAt: new Date().toISOString(),
      };
      if (info.name || participantSlugs.length) ok++;
    }
    console.log(`${ok} enriquecidos`);
    if (i + BATCH < entries.length) await sleep(DELAY_MS);
  }

  const withParticipants = Object.values(enriched).filter((e) => e.participantSlugs?.length).length;
  console.log(`\nTorneos: ${entries.length} · con plantilla: ${withParticipants} · partidos parseados: ${allMatches.length}`);

  if (WRITE) {
    const out = {
      syncedAt: new Date().toISOString(),
      source: "liquipedia.net/brawlstars",
      tournaments: enriched,
      matches: allMatches,
    };
    fs.writeFileSync(path.join(outDir, "bsc-tournaments-enriched.json"), JSON.stringify(out, null, 2));
    console.log("Wrote src/lib/data/generated/bsc-tournaments-enriched.json");
  } else {
    console.log("\nDry run — usa --write para guardar JSON");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

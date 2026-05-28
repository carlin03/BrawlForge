/**
 * Descubre equipos con actividad en el circuito BSC 2026 oficial (Liquipedia).
 * Fuentes: MF, MQ, PSI, Challengers, Brawl Cup, LCQ, CN Finals, leaderboards.
 *
 *   node scripts/discover-bsc-2026-circuit.mjs
 *   node scripts/discover-bsc-2026-circuit.mjs --write
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  sleep,
  fetchWikitextBatch,
  pageToSlug,
  parseParticipantTeams,
  parseMatchesFromWikitext,
  buildTeamResolver,
  apiGet,
} from "./liquipedia-api.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "src", "lib", "data", "generated");
const WRITE = process.argv.includes("--write");
const BATCH = 30;
const DELAY_MS = 2500;

const REGIONS = ["EMEA", "East_Asia", "North_America", "South_America"];
const MONTHS = [
  ["Season_1", "February"],
  ["Season_2", "March"],
  ["Season_3", "April"],
  ["Season_4", "May"],
  ["Season_5", "June"],
  ["Season_6", "July"],
  ["Season_7", "August"],
];

function mqPages() {
  const pages = [];
  for (const [season, month] of MONTHS) {
    for (const region of REGIONS) {
      pages.push(`Brawl_Stars_Championship/2026/${season}/${region}/Monthly_Qualifier`);
      pages.push(`Brawl_Stars_Championship/2026/${season}/${region}/Monthly_Finals`);
    }
  }
  return pages;
}

const STATIC_PAGES = [
  "Brawl_Stars_Championship/2026",
  "Brawl_Stars_Championship/2026/Pre-Season_Invitational",
  "Brawl_Stars_Championship/2026/Brawl_Cup",
  "Brawl_Stars_Championship/2026/Last_Chance_Qualifier",
  "Brawl_Stars_Championship/2026/Challengers_Finals",
  "Brawl_Stars_Championship/2026/Challengers/DACH_Finals",
  "Brawl_Stars_Championship/2026/Challengers/North_America_Finals",
  "Brawl_Stars_Championship/2026/Challengers/South_America_West",
  "Brawl_Stars_Championship/2026/Challengers/Brasil",
  "Brawl_Stars_Championship/2026/Challengers/Italy_Finals",
  "Brawl_Stars_Championship/2026/Challengers/Spain_Grand_Finals",
  "Brawl_Stars_Championship/2026/Challengers/France_Finals",
  "Brawl_Stars_Championship/2026/Challengers/Türkiye_Finals",
  "Brawl_Stars_Championship/2026/Road_To_Brawl_Cup/SA_West",
  "Brawl_Stars_Championship/2026/Road_To_Brawl_Cup/SESA",
  "Brawl_Stars_Championship/2026/Chinese_Mainland_Finals",
  ...["February", "March", "April", "May"].map(
    (m) => `Brawl_Stars_Championship/2026/Chinese_Mainland/${m}_Monthly_Finals`,
  ),
  ...REGIONS.map((r) => `Brawl_Stars_Championship/2026/Leaderboards/${r.replace(/_/g, " ")}`),
];

const ALL_PAGES = [...new Set([...STATIC_PAGES, ...mqPages()])];

function parseTeamsFromHtml(html, resolveTeam) {
  const slugs = new Set();
  const re = /href="\/brawlstars\/([^"#?/]+)"/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const page = decodeURIComponent(m[1]);
    if (/^(Category|File|Template|Brawl_|Special|User|Help|Main_Page|Brawl_Stars_Championship)/i.test(page)) {
      continue;
    }
    const slug = resolveTeam(page.replace(/_/g, " "));
    if (slug && slug.length >= 2) slugs.add(slug);
  }
  return slugs;
}

async function fetchParseParticipants(title, resolveTeam) {
  try {
    const data = await apiGet({ action: "parse", page: title, prop: "text", format: "json" });
    const html = data.parse?.text?.["*"] || "";
    return parseTeamsFromHtml(html, resolveTeam);
  } catch {
    return new Set();
  }
}

async function main() {
  const teamsPath = path.join(outDir, "teams.json");
  if (!fs.existsSync(teamsPath)) {
    console.error("Missing teams.json — run: npm run data:sync:full -- --write");
    process.exit(1);
  }
  const allTeams = JSON.parse(fs.readFileSync(teamsPath, "utf8"));
  const resolveTeam = buildTeamResolver(allTeams);
  const knownSlugs = new Set(allTeams.map((t) => t.slug));

  const teamSlugs = new Set();
  const byPage = {};
  const allMatches = [];
  const errors = [];

  console.log(`Scanning ${ALL_PAGES.length} official BSC 2026 Liquipedia pages...\n`);

  for (let i = 0; i < ALL_PAGES.length; i += BATCH) {
    const batch = ALL_PAGES.slice(i, i + BATCH);
    const idx = Math.floor(i / BATCH) + 1;
    const total = Math.ceil(ALL_PAGES.length / BATCH);
    process.stdout.write(`  wikitext ${idx}/${total}... `);

    let found = 0;
    try {
      const texts = await fetchWikitextBatch(batch);
      for (const title of batch) {
        const wikitext = texts[title] || "";
        if (!wikitext) {
          errors.push(title);
          continue;
        }
        const names = parseParticipantTeams(wikitext);
        const slugs = new Set();
        for (const name of names) {
          const s = resolveTeam(name);
          if (s && knownSlugs.has(s)) slugs.add(s);
        }
        const tourSlug = pageToSlug(title);
        const parsed = parseMatchesFromWikitext(wikitext, tourSlug, "GLOBAL", resolveTeam);
        for (const m of parsed) {
          if (knownSlugs.has(m.teamASlug)) slugs.add(m.teamASlug);
          if (knownSlugs.has(m.teamBSlug)) slugs.add(m.teamBSlug);
          allMatches.push(m);
        }
        if (slugs.size) {
          byPage[title] = [...slugs];
          for (const s of slugs) teamSlugs.add(s);
          found++;
        }
      }
    } catch (e) {
      console.warn(`batch error: ${e.message}`);
    }
    console.log(`${found} with teams`);
    if (i + BATCH < ALL_PAGES.length) await sleep(DELAY_MS);
  }

  // Parse API fallback for pages with empty wikitext participants
  const missing = ALL_PAGES.filter((p) => !byPage[p]).slice(0, 40);
  if (missing.length) {
    console.log(`\nParse API fallback for ${missing.length} pages...`);
    for (let i = 0; i < missing.length; i++) {
      const title = missing[i];
      process.stdout.write(`  [${i + 1}/${missing.length}] ${title.split("/").pop()}... `);
      const slugs = await fetchParseParticipants(title, resolveTeam);
      const valid = [...slugs].filter((s) => knownSlugs.has(s));
      console.log(valid.length);
      if (valid.length) {
        byPage[title] = valid;
        for (const s of valid) teamSlugs.add(s);
      }
      await sleep(1100);
    }
  }

  const sorted = [...teamSlugs].sort();
  const teams2026 = allTeams.filter((t) => teamSlugs.has(t.slug));

  const report = {
    syncedAt: new Date().toISOString(),
    source: "liquipedia.net/brawlstars/Brawl_Stars_Championship/2026",
    pagesScanned: ALL_PAGES.length,
    pagesWithTeams: Object.keys(byPage).length,
    pagesMissing: errors.length,
    teamCount: sorted.length,
    matchCount: allMatches.length,
    teamSlugs: sorted,
    byPage,
  };

  console.log(`\n=== BSC 2026 circuit discovery ===`);
  console.log(`Teams with official circuit activity: ${sorted.length}`);
  console.log(`Matches parsed: ${allMatches.length}`);
  console.log(`Pages with data: ${report.pagesWithTeams}/${ALL_PAGES.length}`);

  if (WRITE) {
    fs.writeFileSync(path.join(outDir, "bsc-2026-circuit-teams.json"), JSON.stringify(report, null, 2));
    const existingTeams = fs.existsSync(path.join(outDir, "teams-2026.json"))
      ? JSON.parse(fs.readFileSync(path.join(outDir, "teams-2026.json"), "utf8"))
      : [];
    const merged = new Map(existingTeams.map((t) => [t.slug, t]));
    for (const t of teams2026) merged.set(t.slug, t);
    const out = [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
    fs.writeFileSync(path.join(outDir, "teams-2026.json"), JSON.stringify(out, null, 0));
    fs.writeFileSync(
      path.join(outDir, "team-slugs.json"),
      JSON.stringify(out.map((t) => t.slug).sort(), null, 0),
    );
    if (allMatches.length) {
      const matchesPath = path.join(outDir, "matches-2026.json");
      const prev = fs.existsSync(matchesPath) ? JSON.parse(fs.readFileSync(matchesPath, "utf8")) : [];
      const byId = new Map(prev.map((m) => [m.id, m]));
      for (const m of allMatches) byId.set(m.id, m);
      fs.writeFileSync(matchesPath, JSON.stringify([...byId.values()], null, 0));
    }
    console.log(`Wrote bsc-2026-circuit-teams.json, teams-2026.json (${out.length} teams)`);
  } else {
    console.log("\nDry run — use --write to save");
    console.log("Sample teams:", sorted.slice(0, 20).join(", "));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

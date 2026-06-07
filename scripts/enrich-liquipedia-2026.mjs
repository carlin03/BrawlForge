/**
 * Enrich 2026 Liquipedia data — participants, matches, tournament logos.
 *
 *   node scripts/enrich-liquipedia-2026.mjs --write
 *   node scripts/enrich-liquipedia-2026.mjs --write --logos
 */
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";
import {
  sleep,
  fetchWikitextBatch,
  pageToSlug,
  resolveCommonsImageUrl,
  isYear2026,
  cleanLabel,
  parseParticipantTeams,
  parseMatchesFromWikitext,
  buildTeamResolver,
} from "./liquipedia-api.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "src", "lib", "data", "generated");
const WRITE = process.argv.includes("--write");
const LOGOS = process.argv.includes("--logos");
const BATCH = 40;
const DELAY_MS = 700;

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "BrawlForge/1.0" } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return download(res.headers.location, dest).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", reject);
  });
}

async function main() {
  const teamsPath = path.join(outDir, "teams.json");
  const toursPath = path.join(outDir, "tournaments.json");
  const playersPath = path.join(outDir, "players.json");
  if (!fs.existsSync(toursPath)) {
    console.error("Run sync first: npm run data:sync:full");
    process.exit(1);
  }

  const allTeams = JSON.parse(fs.readFileSync(teamsPath, "utf8"));
  const allPlayers = JSON.parse(fs.readFileSync(playersPath, "utf8"));
  const allTournaments = JSON.parse(fs.readFileSync(toursPath, "utf8"));
  const resolveTeam = buildTeamResolver(allTeams);

  const tours2026 = allTournaments.filter((t) => isYear2026(t.startDate) || isYear2026(t.endDate));
  console.log(`Enriching ${tours2026.length} tournaments (2026)...\n`);

  const allMatches = [];
  const enriched = [];

  for (let i = 0; i < tours2026.length; i += BATCH) {
    const batch = tours2026.slice(i, i + BATCH);
    const titles = batch.map((t) => t.liquipediaPage);
    const idx = Math.floor(i / BATCH) + 1;
    const total = Math.ceil(tours2026.length / BATCH);
    process.stdout.write(`  batch ${idx}/${total}... `);

    const texts = await fetchWikitextBatch(titles);
    let parts = 0;
    for (const t of batch) {
      const wikitext = texts[t.liquipediaPage] || "";
      const participantNames = parseParticipantTeams(wikitext);
      const participantSlugs = [...new Set(participantNames.map(resolveTeam).filter(Boolean))];
      const parsed = parseMatchesFromWikitext(
        wikitext,
        t.slug,
        t.region,
        resolveTeam,
        t.liquipediaPage?.replace(/ /g, "_"),
      );
      allMatches.push(...parsed);
      enriched.push({
        ...t,
        name: cleanLabel(t.name),
        shortName: cleanLabel(t.shortName),
        participantSlugs,
      });
      if (participantSlugs.length) parts++;
    }
    console.log(`${parts} with participants`);
    if (i + BATCH < tours2026.length) await sleep(DELAY_MS);
  }

  const teamSlugs2026 = new Set();
  for (const t of enriched) {
    for (const s of t.participantSlugs || []) teamSlugs2026.add(s);
  }
  for (const m of allMatches) {
    teamSlugs2026.add(m.teamASlug);
    teamSlugs2026.add(m.teamBSlug);
  }

  const teams2026 = allTeams.filter((t) => teamSlugs2026.has(t.slug));
  const players2026 = allPlayers.filter(
    (p) => teamSlugs2026.has(p.teamSlug) && p.status !== "Retired" && p.status !== "Inactive",
  );

  const upcoming = allMatches.filter((m) => m.status === "upcoming");
  const live = allMatches.filter((m) => m.status === "live");

  console.log(`\n2026 teams: ${teams2026.length}`);
  console.log(`2026 players: ${players2026.length}`);
  console.log(`Matches: ${allMatches.length} (${upcoming.length} upcoming, ${live.length} live)`);

  if (WRITE) {
    fs.writeFileSync(path.join(outDir, "tournaments-2026.json"), JSON.stringify(enriched));
    fs.writeFileSync(path.join(outDir, "matches-2026.json"), JSON.stringify(allMatches));
    fs.writeFileSync(path.join(outDir, "teams-2026.json"), JSON.stringify(teams2026));
    fs.writeFileSync(path.join(outDir, "players-2026.json"), JSON.stringify(players2026));
    fs.writeFileSync(
      path.join(outDir, "team-slugs.json"),
      JSON.stringify(teams2026.map((t) => t.slug).sort()),
    );
    console.log("Wrote tournaments-2026.json, matches-2026.json, teams-2026.json, players-2026.json");
  }

  if (LOGOS && WRITE) {
    const logoDir = path.join(root, "public", "logos", "tournaments");
    fs.mkdirSync(logoDir, { recursive: true });
    const withLogo = enriched.filter((t) => t.logoFile);
    console.log(`\nDownloading ${withLogo.length} tournament logos...`);
    let ok = 0;
    for (const t of withLogo) {
      const dest = path.join(logoDir, `${t.slug}.png`);
      if (fs.existsSync(dest) && fs.statSync(dest).size > 500) continue;
      try {
        const url = await resolveCommonsImageUrl(t.logoFile);
        if (!url) continue;
        await download(url, dest);
        ok++;
      } catch {
        /* skip */
      }
      await sleep(200);
    }
    console.log(`Tournament logos: ${ok} downloaded`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Full Liquipedia sync — teams, players, tournaments (+ logo filenames).
 *
 * Usage:
 *   node scripts/sync-liquipedia-full.mjs           # dry run stats
 *   node scripts/sync-liquipedia-full.mjs --write   # write src/lib/data/generated/*.json
 *   node scripts/sync-liquipedia-full.mjs --logos   # download team logos from commons
 */
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";
import {
  sleep,
  fetchCategoryMembers,
  fetchWikitextBatch,
  pageToSlug,
  parseInfoboxFields,
  resolveCommonsImageUrl,
  mapRegion,
  inferRegionFromCountry,
  tournamentStatus,
} from "./liquipedia-api.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "src", "lib", "data", "generated");
const WRITE = process.argv.includes("--write");
const LOGOS = process.argv.includes("--logos");
const LOGOS_ONLY = process.argv.includes("--logos-only");
const maxTierArg = process.argv.find((a) => a.startsWith("--max-tier="));
const MAX_TIER = maxTierArg ? Number(maxTierArg.split("=")[1]) : null;
const BATCH = 50;
const DELAY_MS = 800;

function hashNum(s, min, max) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return min + (h % (max - min + 1));
}

function pseudoFantasy(slug) {
  return {
    fantasyPoints: hashNum(slug, 62, 96),
    fantasyOwnership: hashNum(slug + "o", 8, 74),
    rating: 1.0 + hashNum(slug + "r", 4, 28) / 100,
  };
}

function teamTag(name) {
  const words = name.replace(/[*]/g, "").trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 4).toUpperCase();
}

async function processBatches(titles, parser, label) {
  const results = [];
  const batches = Math.ceil(titles.length / BATCH);
  for (let i = 0; i < titles.length; i += BATCH) {
    const batch = titles.slice(i, i + BATCH);
    const idx = Math.floor(i / BATCH) + 1;
    process.stdout.write(`  ${label} batch ${idx}/${batches} (${batch.length} pages)... `);
    const texts = await fetchWikitextBatch(batch);
    let ok = 0;
    for (const title of batch) {
      const wikitext = texts[title];
      if (!wikitext) continue;
      const parsed = parser(title, wikitext);
      if (parsed) {
        results.push(parsed);
        ok++;
      }
    }
    console.log(`${ok} parsed`);
    if (i + BATCH < titles.length) await sleep(DELAY_MS);
  }
  return results;
}

function parseTeam(title, wikitext) {
  if (!/\{\{Infobox team/i.test(wikitext)) return null;
  const f = parseInfoboxFields(wikitext);
  const name = (f.name || title.replace(/_/g, " ")).trim();
  const slug = pageToSlug(title);
  const region = mapRegion(f.region) !== "GLOBAL" ? mapRegion(f.region) : inferRegionFromCountry(f.location);
  return {
    slug,
    name,
    tag: teamTag(name),
    region,
    country: f.location || "Unknown",
    earnings: 0,
    rank: 0,
    rankChange: 0,
    form: [],
    liquipediaPage: title,
    logoFile: f.image?.replace(/ /g, "_") || null,
    roster: [],
    achievements: [],
  };
}

function parsePlayer(title, wikitext) {
  if (!/\{\{Infobox player/i.test(wikitext)) return null;
  const f = parseInfoboxFields(wikitext);
  const ign = (f.id || title.replace(/_/g, " ")).trim();
  const slug = pageToSlug(ign !== title ? ign : title);
  const teamName = f.team?.replace(/\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g, "$1").trim();
  const teamSlug = teamName ? pageToSlug(teamName.replace(/ /g, "_")) : "";
  const region = inferRegionFromCountry(f.country);
  const fantasy = pseudoFantasy(slug);
  return {
    slug,
    ign,
    realName: f.name || undefined,
    teamSlug,
    region,
    role: "Player",
    liquipediaPage: title,
    status: f.status || "Active",
    ...fantasy,
  };
}

function parseTournament(title, wikitext) {
  if (!/\{\{Infobox league/i.test(wikitext)) return null;
  const f = parseInfoboxFields(wikitext);
  const name = (f.name || f.displaytitle || title.replace(/_/g, " ").replace(/\//g, ": ")).trim();
  const shortName = (f.shortname || f.tickername || name).trim();
  const slug = pageToSlug(title);
  const sdate = f.sdate?.slice(0, 10) || "";
  const edate = f.edate?.slice(0, 10) || sdate;
  const region = mapRegion(f.region) !== "GLOBAL" ? mapRegion(f.region) : inferRegionFromCountry(f.country);
  const prize = f.prizepoolusd ? `$${Number(f.prizepoolusd).toLocaleString("en-US")}` : "TBA";
  const status = tournamentStatus(sdate, edate);
  return {
    slug,
    name,
    shortName,
    region,
    prizePool: prize,
    teams: Number(f.team_number) || 8,
    status,
    startDate: sdate || "2026-01-01",
    endDate: edate || sdate || "2026-12-31",
    location: f.type === "Offline" ? f.country || "TBA" : "Online",
    stage: status === "finished" ? "Completed" : status === "live" ? "In progress" : "Scheduled",
    liquipediaPage: title,
    tier: f.liquipediatier ? Number(f.liquipediatier) : undefined,
    logoFile: f.image?.replace(/ /g, "_") || f.icon?.replace(/ /g, "_") || null,
  };
}

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

async function downloadTeamLogos(teams) {
  const dir = path.join(root, "public", "logos", "teams");
  fs.mkdirSync(dir, { recursive: true });
  const withLogo = teams.filter((t) => t.logoFile);
  console.log(`\nResolving ${withLogo.length} team logos via Liquipedia API...`);
  let ok = 0;
  for (const t of withLogo) {
    const dest = path.join(dir, `${t.slug}.png`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 800) continue;
    process.stdout.write(`  ${t.slug}... `);
    try {
      const url = await resolveCommonsImageUrl(t.logoFile);
      if (!url) throw new Error("no url");
      await download(url, dest);
      if (fs.statSync(dest).size < 500) throw new Error("too small");
      console.log("ok");
      ok++;
    } catch (e) {
      console.log(`skip (${e.message})`);
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
    }
    await sleep(350);
  }
  console.log(`Downloaded ${ok} new logos`);
}

async function main() {
  console.log("Liquipedia full sync — Brawl Stars\n");

  const catalogPath = path.join(outDir, "teams.json");
  if (LOGOS_ONLY && fs.existsSync(catalogPath)) {
    const teams = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
    console.log(`Logo-only mode — ${teams.length} teams from cache\n`);
    await downloadTeamLogos(teams);
    return;
  }

  console.log("Fetching category lists...");
  const [teamMembers, playerMembers, tourMembers] = await Promise.all([
    fetchCategoryMembers("Category:Teams"),
    fetchCategoryMembers("Category:Players"),
    fetchCategoryMembers("Category:Tournaments"),
  ]);

  const teamTitles = teamMembers.map((m) => m.title);
  const playerTitles = playerMembers.map((m) => m.title);
  const tourTitles = tourMembers.map((m) => m.title);

  console.log(`Found: ${teamTitles.length} teams, ${playerTitles.length} players, ${tourTitles.length} tournament pages\n`);

  console.log("Parsing teams...");
  const teams = await processBatches(teamTitles, parseTeam, "Teams");

  console.log("Parsing players...");
  const players = await processBatches(playerTitles, parsePlayer, "Players");

  console.log("Parsing tournaments...");
  let tournaments = await processBatches(tourTitles, parseTournament, "Tournaments");

  if (MAX_TIER != null && !Number.isNaN(MAX_TIER)) {
    const before = tournaments.length;
    tournaments = tournaments.filter((t) => t.tier != null && t.tier <= MAX_TIER);
    console.log(`\nTier filter (≤${MAX_TIER}): ${tournaments.length}/${before} tournaments kept`);
  }

  // Link rosters from players
  const teamBySlug = new Map(teams.map((t) => [t.slug, t]));
  for (const p of players) {
    if (!p.teamSlug) continue;
    const team = teamBySlug.get(p.teamSlug);
    if (team && team.roster.length < 6 && !team.roster.includes(p.slug)) {
      team.roster.push(p.slug);
    }
  }

  // Rank teams with earnings placeholder by roster size + hash
  teams.sort((a, b) => b.roster.length - a.roster.length || a.name.localeCompare(b.name));
  teams.forEach((t, i) => {
    t.rank = i + 1;
  });

  const payload = {
    syncedAt: new Date().toISOString(),
    source: "liquipedia.net/brawlstars",
    counts: { teams: teams.length, players: players.length, tournaments: tournaments.length },
    teams,
    players,
    tournaments,
  };

  console.log(`\nParsed: ${teams.length} teams, ${players.length} players, ${tournaments.length} tournaments`);

  if (WRITE) {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "catalog.json"), JSON.stringify(payload, null, 0));
    fs.writeFileSync(path.join(outDir, "teams.json"), JSON.stringify(teams, null, 0));
    fs.writeFileSync(path.join(outDir, "players.json"), JSON.stringify(players, null, 0));
    fs.writeFileSync(path.join(outDir, "tournaments.json"), JSON.stringify(tournaments, null, 0));
    fs.writeFileSync(
      path.join(outDir, "team-slugs.json"),
      JSON.stringify(teams.map((t) => t.slug).sort(), null, 0),
    );
    console.log(`Wrote ${outDir}/catalog.json (+ teams, players, tournaments)`);
  } else {
    console.log("\nDry run — use --write to save JSON to src/lib/data/generated/");
  }

  if (LOGOS || WRITE) {
    await downloadTeamLogos(teams);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

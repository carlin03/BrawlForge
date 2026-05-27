/**
 * Sync esports data from Liquipedia (backend only — not shown in UI).
 *
 * Usage:
 *   node scripts/sync-liquipedia-data.mjs              # fetch + report
 *   node scripts/sync-liquipedia-data.mjs --write      # update scripts/liquipedia-sync.json
 *   node scripts/sync-liquipedia-data.mjs --logos      # download missing team logos
 *
 * Respects rate limits: 1 request / 1.5s between pages.
 */
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LIQUIPEDIA_TEAM_LOGOS, liquipediaCommonsUrl } from "./liquipedia-commons.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const WRITE = process.argv.includes("--write");
const LOGOS = process.argv.includes("--logos");
const DELAY_MS = 1500;

const PAGES = [
  "Brawl_Stars_World_Finals/2025",
  "Brawl_Stars_Championship/2026",
  "Brawl_Stars_Championship/2026/Brawl_Cup",
  "Brawl_Stars_Championship/2026/February/EMEA",
  "Brawl_Stars_Championship/2026/March/EMEA",
  "Brawl_Stars_Championship/2026/April/EMEA",
  "Natus_Vincere",
  "Bounty_Hunters_Esports",
  "Only_Realm",
  "Eternal_Esports",
  "Toxic_Lotus",
  "Ace_Xero",
  "Papara_SuperMassive",
  "SKCalalas",
  "QLASH",
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "BrawlForge/1.0 (local sync; contact: dev@brawlforge.local)" } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return fetchText(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode === 429) {
          return reject(new Error("Rate limited — wait and retry"));
        }
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
          resolve(data);
        });
      })
      .on("error", reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0 BrawlForge/1.0" } }, (res) => {
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

function stripHtml(s) {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Parse Liquipedia match rows like "SK 3 0 RNTX" from wikitext/HTML tables */
function parseMatchScores(html) {
  const matches = [];
  const re =
    /([A-Z0-9*]{2,6})\s*<\/[^>]+>\s*(\d)\s*<\/[^>]+>\s*(\d)\s*<\/[^>]+>\s*([A-Z0-9*]{2,6})/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    matches.push({ teamA: m[1], scoreA: +m[2], scoreB: +m[3], teamB: m[4] });
  }
  return matches;
}

function parseTeamRoster(html) {
  const roster = [];
  const blockRe = /Main Roster[\s\S]{0,2000}?(?=<\/table>|Staff)/gi;
  const ignRe = />\s*([A-Za-z0-9_.]{2,20})\s*<\/a>/g;
  let block;
  while ((block = blockRe.exec(html)) !== null) {
    const ids = [...block[0].matchAll(ignRe)].map((x) => x[1]).slice(0, 3);
    if (ids.length === 3) roster.push(ids);
  }
  return roster;
}

async function fetchPage(page) {
  const url = `https://liquipedia.net/brawlstars/${page}`;
  const html = await fetchText(url);
  return {
    page,
    url,
    fetchedAt: new Date().toISOString(),
    matchCount: parseMatchScores(html).length,
    matches: parseMatchScores(html).slice(0, 40),
    rosters: parseTeamRoster(html),
    title: stripHtml(html.match(/<title>([^<]+)<\/title>/)?.[1] ?? page),
  };
}

async function downloadLogos() {
  const dir = path.join(root, "public", "logos", "teams");
  fs.mkdirSync(dir, { recursive: true });
  console.log("\nDownloading Liquipedia commons logos...");
  for (const [slug, file] of Object.entries(LIQUIPEDIA_TEAM_LOGOS)) {
    const url = liquipediaCommonsUrl(file);
    const dest = path.join(dir, `${slug}.png`);
    process.stdout.write(`  ${slug}... `);
    try {
      await download(url, dest);
      const size = fs.statSync(dest).size;
      if (size < 500) throw new Error("too small");
      console.log(`ok (${size}b)`);
    } catch (e) {
      console.log(`FAIL (${e.message})`);
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
    }
    await sleep(300);
  }
}

async function main() {
  console.log("Liquipedia sync — Brawl Stars esports data\n");

  if (LOGOS) {
    const { spawnSync } = await import("node:child_process");
    spawnSync(process.execPath, [path.join(__dirname, "download-logos.mjs")], { stdio: "inherit" });
    return;
  }

  const results = [];
  for (let i = 0; i < PAGES.length; i++) {
    const page = PAGES[i];
    process.stdout.write(`[${i + 1}/${PAGES.length}] ${page}... `);
    try {
      const data = await fetchPage(page);
      results.push(data);
      console.log(`${data.matchCount} matches, ${data.rosters.length} rosters`);
    } catch (e) {
      console.log(`FAIL — ${e.message}`);
      results.push({ page, error: e.message });
    }
    if (i < PAGES.length - 1) await sleep(DELAY_MS);
  }

  const out = {
    syncedAt: new Date().toISOString(),
    source: "liquipedia.net/brawlstars",
    pages: results,
  };

  const outPath = path.join(__dirname, "liquipedia-sync.json");
  if (WRITE) {
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log(`\nWrote ${outPath}`);
  } else {
    console.log(`\nDry run — use --write to save ${path.basename(outPath)}`);
  }

  const totalMatches = results.reduce((n, r) => n + (r.matchCount ?? 0), 0);
  console.log(`Total parsed match rows: ${totalMatches}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

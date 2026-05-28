/**
 * Sincroniza jugadores BSC 2026 desde Liquipedia (Cargo + plantillas + curado).
 *
 *   node scripts/sync-bsc-2026-rosters.mjs
 *   node scripts/sync-bsc-2026-rosters.mjs --write
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  sleep,
  fetchWikitextBatch,
  pageToSlug,
  parseInfoboxFields,
  mapRegion,
  inferRegionFromCountry,
  apiGet,
} from "./liquipedia-api.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "src", "lib", "data", "generated");
const WRITE = process.argv.includes("--write");
const ONLINE = process.argv.includes("--online");
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

function loadCircuitTeamSlugs() {
  const slugsPath = path.join(outDir, "team-slugs.json");
  if (fs.existsSync(slugsPath)) {
    return new Set(JSON.parse(fs.readFileSync(slugsPath, "utf8")));
  }
  const teams2026 = path.join(outDir, "teams-2026.json");
  if (fs.existsSync(teams2026)) {
    return new Set(JSON.parse(fs.readFileSync(teams2026, "utf8")).map((t) => t.slug));
  }
  throw new Error("Run: npm run data:rebuild:bsc-teams");
}

const BSC_TEAM_SLUGS = loadCircuitTeamSlugs();

const TEAM_LIQUIPEDIA = {
  "sk-gaming": "SK_Gaming",
  "team-heretics": "Team_Heretics",
  "crazy-raccoon": "Crazy_Raccoon",
  loud: "LOUD",
  "tribe-gaming": "Tribe_Gaming",
  "zeta-division": "ZETA_DIVISION",
  "fut-esports": "FUT_Esports",
  "natus-vincere": "Natus_Vincere",
  "totem-esports": "Totem_Esports",
  "spacestation-gaming": "Spacestation_Gaming",
  hmble: "HMBLE",
  reject: "REJECT",
  "stmn-esports": "STMN_esports",
  "papara-supermassive": "Papara_SuperMassive",
  "toxic-lotus": "Toxic_Lotus",
  "revenant-xspark": "Revenant_XSpark",
  qlash: "QLASH",
  skcalalas: "SKCalalas",
  "bc-gaming-sa": "BC_Gaming_SA",
  "only-realm": "Only_Realm",
  "bounty-hunters-esports": "Bounty_Hunters_Esports",
  "ace-xero": "Ace_Xero",
  "eternal-esports": "Eternal_Esports",
  oddyssey: "Oddyssey",
  "vatic-esports": "Vatic_Esports",
  "metizport": "Metizport",
  big: "BIG",
  "big-talents": "Big_Talents",
  kebap: "Kebap",
  "zoos-esports": "ZOOS_Esports",
  "team-elektros": "Team_Elektros",
  elevate: "Elevate",
  "zurita-gang": "Zurita_Gang",
  "olimpo-squad": "Olimpo_Squad",
  "acre-lovers": "Acre_Lovers",
  "fut-esports-academy": "FUT_Esports_Academy",
  "skcalalas-na": "SKCalalas",
};

function parsePlayerFromWikitext(title, wikitext) {
  if (!/\{\{Infobox player/i.test(wikitext)) return null;
  const f = parseInfoboxFields(wikitext);
  const ign = (f.id || title.replace(/_/g, " ")).trim();
  const slug = pageToSlug(ign !== title ? ign : title);
  const teamName = f.team?.replace(/\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g, "$1").trim();
  const teamSlug = teamName ? pageToSlug(teamName.replace(/ /g, "_")) : "";
  return {
    slug,
    ign: ign.replace(/<!--[\s\S]*?-->/g, "").split("\n")[0].trim(),
    realName: f.name || undefined,
    teamSlug,
    region: inferRegionFromCountry(f.country),
    role: "Player",
    liquipediaPage: title,
    status: f.status || "Active",
    ...pseudoFantasy(slug),
  };
}

/** Extrae slugs de jugador del HTML parseado de Liquipedia */
function parseRosterFromHtml(html) {
  const slugs = new Set();
  const re = /href="\/brawlstars\/([^"#?]+)"[^>]*>(?:[^<]{1,40})<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const page = decodeURIComponent(m[1]);
    if (
      /^(Category|File|Template|Brawl_|Special|User|Help|Main_Page)/i.test(page) ||
      page.includes("/")
    ) {
      continue;
    }
    const slug = pageToSlug(page);
    if (slug.length >= 2 && slug.length <= 32) slugs.add(slug);
  }
  return [...slugs];
}

async function fetchTeamRosterFromParse(teamSlug) {
  const page = TEAM_LIQUIPEDIA[teamSlug] ?? teamSlug.replace(/-/g, "_");
  try {
    const data = await apiGet({ action: "parse", page, prop: "text", format: "json" });
    const html = data.parse?.text?.["*"] || "";
    const all = parseRosterFromHtml(html);
    const skip = new Set([
      "teams",
      "players",
      "tournaments",
      "portal",
      "liquipedia",
      pageToSlug(page),
      teamSlug,
    ]);
    return all.filter((s) => !skip.has(s) && !s.includes("gaming") && !s.includes("esports"));
  } catch (e) {
    console.warn(`  parse ${teamSlug}: ${e.message}`);
    return [];
  }
}

function loadCuratedRosters() {
  const curatedPath = path.join(root, "src", "lib", "data", "teams-curated.ts");
  const text = fs.readFileSync(curatedPath, "utf8");
  const map = new Map();
  const blockRe = /"([a-z0-9-]+)":\s*\{[^}]*roster:\s*\[([^\]]+)\]/g;
  let m;
  while ((m = blockRe.exec(text)) !== null) {
    const teamSlug = m[1];
    const players = [...m[2].matchAll(/"([a-z0-9-]+)"/g)].map((x) => x[1]);
    if (players.length) map.set(teamSlug, players);
  }
  return map;
}

async function main() {
  const playersPath = path.join(outDir, "players.json");
  const teamsPath = path.join(outDir, "teams.json");
  if (!fs.existsSync(playersPath)) {
    console.error("Missing players.json — run: npm run data:sync:full -- --write");
    process.exit(1);
  }

  const allPlayers = JSON.parse(fs.readFileSync(playersPath, "utf8"));
  const allTeams = JSON.parse(fs.readFileSync(teamsPath, "utf8"));
  const teamBySlug = new Map(allTeams.map((t) => [t.slug, t]));
  const playerBySlug = new Map(allPlayers.map((p) => [p.slug, p]));

  const rosterByTeam = new Map();
  for (const slug of BSC_TEAM_SLUGS) rosterByTeam.set(slug, new Set());

  for (const [teamSlug, slugs] of loadCuratedRosters()) {
    if (!BSC_TEAM_SLUGS.has(teamSlug)) continue;
    for (const p of slugs) rosterByTeam.get(teamSlug).add(p);
  }

  if (ONLINE) {
    console.log("Fetching Liquipedia team pages (parse API)...");
    const teamList = [...BSC_TEAM_SLUGS];
    for (let i = 0; i < teamList.length; i++) {
      const teamSlug = teamList[i];
      process.stdout.write(`  [${i + 1}/${teamList.length}] ${teamSlug}... `);
      const found = await fetchTeamRosterFromParse(teamSlug);
      for (const s of found) rosterByTeam.get(teamSlug).add(s);
      console.log(found.length);
      if (i < teamList.length - 1) await sleep(1200);
    }
  }

  const rostersTs = fs.readFileSync(path.join(root, "src/lib/data/bsc-2026-rosters.ts"), "utf8");
  const rosterRe = /(?:"([a-z0-9-]+)"|([a-z0-9-]+)):\s*\[([^\]]+)\]/g;
  const playerPrimaryTeam = new Map();
  let rm;
  while ((rm = rosterRe.exec(rostersTs)) !== null) {
    const team = rm[1] || rm[2];
    if (!BSC_TEAM_SLUGS.has(team)) continue;
    for (const s of [...rm[3].matchAll(/"([a-z0-9-]+)"/g)].map((x) => x[1])) {
      rosterByTeam.get(team).add(s);
      playerPrimaryTeam.set(s, team);
    }
  }

  const missingPlayerSlugs = new Set();
  for (const [, slugs] of rosterByTeam) {
    for (const slug of slugs) {
      if (!playerBySlug.has(slug)) missingPlayerSlugs.add(slug);
    }
  }

  console.log(`Fetching ${missingPlayerSlugs.size} missing player pages...`);
  const toFetch = [...missingPlayerSlugs];
  const parsedNew = [];
  if (ONLINE && toFetch.length) {
    for (let i = 0; i < toFetch.length; i += BATCH) {
      const batch = toFetch.slice(i, i + BATCH).map((s) => s.replace(/-/g, "_"));
      try {
        const texts = await fetchWikitextBatch(batch);
        for (const title of batch) {
          const wikitext = texts[title];
          if (!wikitext) continue;
          const p = parsePlayerFromWikitext(title, wikitext);
          if (p) {
            parsedNew.push(p);
            playerBySlug.set(p.slug, p);
          }
        }
      } catch (e) {
        console.warn(`  batch skip: ${e.message}`);
      }
      if (i + BATCH < toFetch.length) await sleep(DELAY_MS);
    }
  }

  const mergedPlayers = new Map();
  for (const p of allPlayers) mergedPlayers.set(p.slug, p);
  for (const p of parsedNew) mergedPlayers.set(p.slug, p);

  const players2026 = [];
  const seen = new Set();
  for (const [slug, teamSlug] of playerPrimaryTeam) {
    if (seen.has(slug)) continue;
    seen.add(slug);
    let p = mergedPlayers.get(slug);
    if (!p) {
      p = {
        slug,
        ign: slug.replace(/-/g, " "),
        teamSlug,
        region: teamBySlug.get(teamSlug)?.region ?? "GLOBAL",
        role: "Player",
        liquipediaPage: slug.replace(/-/g, "_"),
        status: "Active",
        ...pseudoFantasy(slug),
      };
    }
    const status = String(p.status || "Active");
    players2026.push({
      ...p,
      ign: p.ign || slug.replace(/-/g, " "),
      teamSlug,
      status: /^retired$/i.test(status) ? "Active" : /^inactive$/i.test(status) ? "Inactive" : "Active",
    });
  }

  const existing2026 = fs.existsSync(path.join(outDir, "players-2026.json"))
    ? JSON.parse(fs.readFileSync(path.join(outDir, "players-2026.json"), "utf8"))
    : [];

  const excluded = new Set(["jxcr"]);
  for (const p of existing2026) {
    if (seen.has(p.slug) || excluded.has(p.slug)) continue;
    if (!playerPrimaryTeam.has(p.slug)) continue;
    if (p.teamSlug && BSC_TEAM_SLUGS.has(p.teamSlug) && !/^retired$/i.test(p.status || "")) {
      seen.add(p.slug);
      players2026.push(p);
    }
  }

  players2026.sort((a, b) => b.fantasyPoints - a.fantasyPoints);

  const teams2026 = allTeams
    .filter((t) => BSC_TEAM_SLUGS.has(t.slug))
    .map((t) => ({
      ...t,
      roster: [...(rosterByTeam.get(t.slug) ?? [])],
    }));

  console.log(`\nBSC 2026 teams: ${teams2026.length}`);
  console.log(`BSC 2026 players: ${players2026.length}`);
  console.log(`New player pages parsed: ${parsedNew.length}`);

  if (WRITE) {
    fs.writeFileSync(path.join(outDir, "players-2026.json"), JSON.stringify(players2026, null, 0));
    fs.writeFileSync(path.join(outDir, "teams-2026.json"), JSON.stringify(teams2026, null, 0));
    fs.writeFileSync(
      path.join(outDir, "team-slugs.json"),
      JSON.stringify(teams2026.map((t) => t.slug).sort(), null, 0),
    );
    console.log("Wrote players-2026.json, teams-2026.json");
  } else {
    console.log("\nDry run — use --write to save");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

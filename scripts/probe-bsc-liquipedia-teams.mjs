/**
 * Extrae equipos de páginas BSC 2026 en Liquipedia (parse API).
 * node scripts/probe-bsc-liquipedia-teams.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { apiGet, buildTeamResolver, sleep } from "./liquipedia-api.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const teams = JSON.parse(fs.readFileSync(path.join(root, "src/lib/data/generated/teams.json"), "utf8"));
const resolve = buildTeamResolver(teams);
const activeTs = fs.readFileSync(path.join(root, "src/lib/data/bsc-2026-active-teams.ts"), "utf8");
const activeBlock = activeTs.match(/BSC_2026_ACTIVE_TEAM_SLUGS[^[]*\[([\s\S]*?)\]\s*as const/)?.[1] ?? "";
const active = new Set([...activeBlock.matchAll(/"([a-z][a-z0-9-]*)"/g)].map((m) => m[1]));

const PAGES = [
  "Brawl_Stars_Championship/2026/Season_1/EMEA/Monthly_Finals",
  "Brawl_Stars_Championship/2026/Season_2/EMEA/Monthly_Finals",
  "Brawl_Stars_Championship/2026/Season_3/EMEA/Monthly_Finals",
  "Brawl_Stars_Championship/2026/Season_1/East_Asia/Monthly_Finals",
  "Brawl_Stars_Championship/2026/Season_2/East_Asia/Monthly_Finals",
  "Brawl_Stars_Championship/2026/Season_3/East_Asia/Monthly_Finals",
  "Brawl_Stars_Championship/2026/Season_1/North_America/Monthly_Finals",
  "Brawl_Stars_Championship/2026/Season_2/North_America/Monthly_Finals",
  "Brawl_Stars_Championship/2026/Season_3/North_America/Monthly_Finals",
  "Brawl_Stars_Championship/2026/Season_1/South_America/Monthly_Finals",
  "Brawl_Stars_Championship/2026/Season_2/South_America/Monthly_Finals",
  "Brawl_Stars_Championship/2026/Season_3/South_America/Monthly_Finals",
  "Brawl_Stars_Championship/2026/Pre-Season_Invitational/EMEA",
  "Brawl_Stars_Championship/2026/Pre-Season_Invitational/East_Asia",
  "Brawl_Stars_Championship/2026/Pre-Season_Invitational/North_America",
  "Brawl_Stars_Championship/2026/Pre-Season_Invitational/South_America",
  "Brawl_Stars_Championship/2026/Brawl_Cup",
  "Brawl_Stars_Championship/2026/Challengers/DACH_Finals",
  "Brawl_Stars_Championship/2026/Challengers/North_America_Finals",
  "Brawl_Stars_Championship/2026/Challengers/South_America_West",
  "Brawl_Stars_Championship/2026/Challengers/Brasil",
  "Brawl_Stars_Championship/2026/Road_To_Brawl_Cup/SA_West",
  "Brawl_Stars_Championship/2026/Road_To_Brawl_Cup/SESA",
  "Brawl_Stars_Championship/2026/Chinese_Mainland/February_Monthly_Finals",
  "Brawl_Stars_Championship/2026/Chinese_Mainland/May_Monthly_Finals",
  "Brawl_Stars_Championship/2026/Leaderboards/EMEA",
  "Brawl_Stars_Championship/2026/Leaderboards/East Asia",
  "Brawl_Stars_Championship/2026/Leaderboards/North America",
  "Brawl_Stars_Championship/2026/Leaderboards/South America",
];

function teamsFromHtml(html) {
  const slugs = new Set();
  const re = /href="\/brawlstars\/([^"#?/]+)"/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const page = decodeURIComponent(m[1]);
    if (/^(Category|File|Template|Brawl_|Special|User|Help|Main_Page|Brawl_Stars)/i.test(page)) continue;
    const slug = resolve(page.replace(/_/g, " "));
    if (slug) slugs.add(slug);
  }
  return slugs;
}

const union = new Set();
for (let i = 0; i < PAGES.length; i++) {
  const p = PAGES[i];
  process.stdout.write(`[${i + 1}/${PAGES.length}] ${p.split("/").slice(-2).join("/")}... `);
  try {
    const data = await apiGet({ action: "parse", page: p, prop: "text" });
    const html = data.parse?.text?.["*"] || "";
    const slugs = teamsFromHtml(html);
    for (const s of slugs) union.add(s);
    console.log(slugs.size);
  } catch (e) {
    console.log("err", e.message);
  }
  await sleep(1100);
}

const sorted = [...union].sort();
const inActive = sorted.filter((s) => active.has(s));
const notInActive = sorted.filter((s) => !active.has(s));
const activeNotInLp = [...active].filter((s) => !union.has(s)).sort();

console.log("\n=== Liquipedia union ===", sorted.length);
console.log(sorted.join(", "));
console.log("\n=== In LP but NOT in active list ===", notInActive.length);
console.log(notInActive.join(", "));
console.log("\n=== In active but NOT seen on LP pages ===", activeNotInLp.length);
console.log(activeNotInLp.join(", "));

import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const teams = JSON.parse(fs.readFileSync(path.join(root, "src/lib/data/generated/teams-2026.json"), "utf8"));
const rosterSrc = fs.readFileSync(path.join(root, "src/lib/data/bsc-2026-rosters.ts"), "utf8");
const rosters = {};
for (const m of rosterSrc.matchAll(/"([^"]+)":\s*\[([^\]]+)\]/g)) {
  rosters[m[1]] = m[2].split(",").map((s) => s.replace(/["'\s]/g, "").trim()).filter(Boolean);
}

const activeSlugs = Object.keys(rosters);
const teamMap = new Map(teams.map((t) => [t.slug, t]));

console.log("Equipos BSC_2026_ROSTERS:", activeSlugs.length);

const mism = [];
for (const slug of activeSlugs) {
  const t = teamMap.get(slug);
  if (!t) {
    mism.push({ slug, issue: "missing in teams-2026.json" });
    continue;
  }
  const a = new Set(rosters[slug]);
  const b = new Set(t.roster ?? []);
  const onlyA = [...a].filter((x) => !b.has(x));
  const onlyB = [...b].filter((x) => !a.has(x));
  if (onlyA.length || onlyB.length) {
    mism.push({ slug, onlyA, onlyB, bsc: rosters[slug], json: t.roster });
  }
}

const owner = {};
for (const [team, list] of Object.entries(rosters)) {
  for (const p of list) {
    if (!owner[p]) owner[p] = [];
    owner[p].push(team);
  }
}
const dups = Object.entries(owner).filter(([, t]) => t.length > 1);

console.log("Roster mismatches:", mism.length);
for (const m of mism) console.log(JSON.stringify(m));

console.log("Duplicate players across teams:", dups.length);
for (const [p, t] of dups) console.log(p, "->", t.join(", "));

const activeSrc = fs.readFileSync(path.join(root, "src/lib/data/bsc-2026-active-teams.ts"), "utf8");
const active = [...activeSrc.matchAll(/"([a-z0-9-]+)"/g)]
  .map((m) => m[1])
  .filter((s) => s.includes("-") || s.length > 3);
const activeSet = new Set(active);
console.log("Active BSC teams:", activeSet.size);
const noRoster = [...activeSet].filter((s) => !rosters[s]);
const noIn2026 = [...activeSet].filter((s) => !teamMap.has(s));
console.log("Active without BSC_2026_ROSTERS:", noRoster.join(", ") || "(none)");
console.log("Active missing teams-2026:", noIn2026.join(", ") || "(none)");
for (const s of ["zoos-esports", "only-realm", "ace-xero"]) {
  const t = teamMap.get(s);
  console.log(s, "json roster:", t?.roster?.join(","), "bsc:", rosters[s]?.join(","));
}

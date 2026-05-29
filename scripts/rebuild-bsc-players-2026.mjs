/**
 * Regenera players-2026.json + rosters en teams-2026 desde bsc-2026-rosters.ts
 *   node scripts/rebuild-bsc-players-2026.mjs --write
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "src", "lib", "data", "generated");
const WRITE = process.argv.includes("--write");

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

function loadExcludedSlugs() {
  const text = fs.readFileSync(path.join(root, "src/lib/data/bsc-2026-active-teams.ts"), "utf8");
  const m = text.match(/BSC_2026_EXCLUDED_TEAM_SLUGS[^[]*\[([\s\S]*?)\]\s*as const/);
  if (!m) return new Set();
  return new Set([...m[1].matchAll(/"([a-z][a-z0-9-]*)"/g)].map((x) => x[1]));
}

function loadRosters() {
  const text = fs.readFileSync(path.join(root, "src/lib/data/bsc-2026-rosters.ts"), "utf8");
  const m = text.match(/BSC_2026_ROSTERS[^=]*=\s*\{([\s\S]*?)\};/);
  if (!m) throw new Error("Could not parse BSC_2026_ROSTERS");
  const rosters = {};
  for (const line of m[1].split("\n")) {
    const tm = line.match(/^\s*"?([a-z0-9-]+)"?\s*:\s*\[([^\]]*)\]/);
    if (!tm) continue;
    const slugs = [...tm[2].matchAll(/"([a-z0-9-]+)"/g)].map((x) => x[1]);
    if (slugs.length) rosters[tm[1]] = slugs;
  }
  return rosters;
}

const REGION_MAP = {
  EMEA: "EMEA",
  NA: "NA",
  SA: "SA",
  EA: "EA",
  SEA: "SEA",
  GLOBAL: "GLOBAL",
};

function main() {
  const rosters = loadRosters();
  const excluded = loadExcludedSlugs();
  const teamSlugs = JSON.parse(fs.readFileSync(path.join(outDir, "team-slugs.json"), "utf8")).filter(
    (s) => !excluded.has(s),
  );
  const allTeams = JSON.parse(fs.readFileSync(path.join(outDir, "teams.json"), "utf8"));
  const allPlayers = JSON.parse(fs.readFileSync(path.join(outDir, "players.json"), "utf8"));
  const bySlug = new Map(allPlayers.map((p) => [p.slug, p]));

  const players2026 = [];
  const seen = new Set();

  for (const teamSlug of teamSlugs) {
    const roster = rosters[teamSlug] ?? [];
    const teamMeta = allTeams.find((t) => t.slug === teamSlug);
    const region = teamMeta?.region ?? "GLOBAL";

    for (const pl of roster) {
      if (seen.has(pl)) continue;
      seen.add(pl);
      const existing = bySlug.get(pl);
      const base = existing
        ? { ...existing }
        : {
            slug: pl,
            ign: pl.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            teamSlug,
            region,
            role: "Player",
            liquipediaPage: pl.replace(/-/g, "_"),
            status: "Active",
            ...pseudoFantasy(pl),
          };
      players2026.push({
        ...base,
        ign: (base.ign || pl).replace(/<!--[\s\S]*?-->/g, "").split("\n")[0].trim(),
        teamSlug,
        region: REGION_MAP[region] ?? region,
        status: /^retired$/i.test(base.status || "") ? "Active" : base.status || "Active",
      });
    }
  }

  players2026.sort((a, b) => b.fantasyPoints - a.fantasyPoints);

  const teams2026 = teamSlugs
    .map((slug) => {
      const t = allTeams.find((x) => x.slug === slug);
      if (!t) return null;
      return { ...t, roster: rosters[slug] ?? [] };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  const missingTeams = teamSlugs.filter((s) => !teams2026.some((t) => t.slug === s));
  const teamsNoRoster = teamSlugs.filter((s) => !(rosters[s]?.length >= 3));

  console.log(`Teams: ${teams2026.length}`);
  console.log(`Players: ${players2026.length} (${Math.round(players2026.length / teams2026.length)} per team avg)`);
  if (missingTeams.length) console.log("Missing team meta:", missingTeams.join(", "));
  if (teamsNoRoster.length) console.log("Teams with <3 in rosters.ts:", teamsNoRoster.join(", "));

  if (WRITE) {
    fs.writeFileSync(path.join(outDir, "players-2026.json"), JSON.stringify(players2026, null, 0));
    fs.writeFileSync(path.join(outDir, "teams-2026.json"), JSON.stringify(teams2026, null, 0));
    console.log("Wrote players-2026.json, teams-2026.json");
  }
}

main();

/**
 * Expande pool 2026: partidos Liquipedia + equipos auto-descubiertos.
 * No requiere que el equipo exista en teams.json — solo slug válido.
 *
 *   node scripts/expand-2026-pool.mjs --write
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "src", "lib", "data", "generated");
const WRITE = process.argv.includes("--write");

const INVALID = new Set(["tbd", "team", ""]);
const BSC_RE = /^bsc-2026|^world-finals-2026|^brawl-stars-championship-/;
const FEATURED_RE =
  /challengers|supremacy|brawl-cup|world-finals|liga-argentina|agg-league|bigg-pro|orion|championship|monthly-final|psi-|rtbc|lcq|chinese-mainland|gpl-season|bps-nations|mml-robo|season-cup|flash-tournament|vanguard-gaming|triple-spring|tournoi-des-crateurs/i;
const MIN_YEAR = 2025;
const MAX_FUTURE_MS = 180 * 24 * 60 * 60 * 1000;

function slugToName(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function okTeam(s) {
  const k = (s || "").trim().toLowerCase();
  return k && !INVALID.has(k) && k !== "por-definir" && !k.startsWith("winner-");
}

function okDate(d) {
  const t = Date.parse(d);
  return !Number.isNaN(t);
}

function keepMatch(m) {
  if (!okTeam(m.teamASlug) || !okTeam(m.teamBSlug)) return false;
  if (m.teamASlug === m.teamBSlug) return false;
  if (!okDate(m.date)) return false;
  const t = Date.parse(m.date);
  const year = Number((m.date || "").slice(0, 4));
  if (year < MIN_YEAR && t < Date.UTC(MIN_YEAR, 0, 1)) return false;

  const isBsc = BSC_RE.test(m.tournamentSlug);
  if (isBsc) {
    if (m.status === "upcoming" && t > Date.now() + MAX_FUTURE_MS) return false;
    return true;
  }

  if (m.status === "finished") {
    return year >= 2026 && m.scoreA !== m.scoreB;
  }
  if (m.status === "upcoming") {
    return FEATURED_RE.test(m.tournamentSlug) && t > Date.now() && t <= Date.now() + MAX_FUTURE_MS;
  }
  return false;
}

function main() {
  const matchesPath = path.join(outDir, "matches-2026.json");
  if (!fs.existsSync(matchesPath)) {
    console.error("Falta matches-2026.json — ejecuta: npm run data:enrich:2026 -- --write");
    process.exit(1);
  }

  const teamsPath = path.join(outDir, "teams.json");
  const knownTeams = new Set(
    fs.existsSync(teamsPath)
      ? JSON.parse(fs.readFileSync(teamsPath, "utf8")).map((t) => t.slug)
      : [],
  );
  const teams2026Path = path.join(outDir, "teams-2026.json");
  if (fs.existsSync(teams2026Path)) {
    for (const t of JSON.parse(fs.readFileSync(teams2026Path, "utf8"))) {
      knownTeams.add(t.slug);
    }
  }

  const all = JSON.parse(fs.readFileSync(matchesPath, "utf8"));
  const kept = all.filter(keepMatch);

  const teamMeta = new Map();
  for (const m of kept) {
    for (const slug of [m.teamASlug, m.teamBSlug]) {
      if (!okTeam(slug) || knownTeams.has(slug)) continue;
      if (!teamMeta.has(slug)) {
        teamMeta.set(slug, {
          slug,
          name: slugToName(slug),
          tag: slug.split("-").map((p) => p[0]).join("").slice(0, 3).toUpperCase(),
          region: m.region || "GLOBAL",
          source: "liquipedia-match-2026",
        });
      }
    }
  }

  const discovered = [...teamMeta.values()].sort((a, b) => a.slug.localeCompare(b.slug));
  const bsc = kept.filter((m) => BSC_RE.test(m.tournamentSlug)).length;
  const nonBsc = kept.length - bsc;
  const upcoming = kept.filter((m) => m.status === "upcoming").length;
  const finished = kept.filter((m) => m.status === "finished").length;

  console.log(`Matches: ${all.length} → ${kept.length} (BSC ${bsc}, regional ${nonBsc})`);
  console.log(`  upcoming ${upcoming}, finished ${finished}`);
  console.log(`Discovered teams: ${discovered.length}`);

  if (!WRITE) {
    console.log("\nDry-run. Usa --write para guardar.");
    return;
  }

  fs.writeFileSync(matchesPath, JSON.stringify(kept));
  fs.writeFileSync(path.join(outDir, "teams-discovered.json"), JSON.stringify(discovered, null, 2));
  console.log("Wrote matches-2026.json, teams-discovered.json");
}

main();

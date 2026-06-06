/**
 * Expande pool 2026: partidos Liquipedia tier B+ + equipos/torneos auto-descubiertos.
 *
 *   node scripts/expand-2026-pool.mjs --write
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "src", "lib", "data", "generated");
const WRITE = process.argv.includes("--write");

const MAX_DISPLAY_TIER = 3;
const INVALID = new Set(["tbd", "team", ""]);
const BSC_RE = /^bsc-2026|^world-finals-2026|^brawl-stars-championship-/;
const MIN_YEAR = 2025;
const MAX_FUTURE_MS = 365 * 24 * 60 * 60 * 1000;

function slugToName(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function loadTierBPlusSlugs() {
  const toursPath = path.join(outDir, "tournaments-2026.json");
  const slugs = new Set();
  const meta = new Map();
  if (!fs.existsSync(toursPath)) return { slugs, meta };

  for (const t of JSON.parse(fs.readFileSync(toursPath, "utf8"))) {
    meta.set(t.slug, t);
    if (t.tier != null && t.tier <= MAX_DISPLAY_TIER) slugs.add(t.slug);
  }
  return { slugs, meta };
}

const { slugs: TIER_B_PLUS_SLUGS, meta: TOURNAMENT_META } = loadTierBPlusSlugs();

function okTeam(s) {
  const k = (s || "").trim().toLowerCase();
  return k && !INVALID.has(k) && k !== "por-definir" && !k.startsWith("winner-");
}

function okDate(d) {
  const t = Date.parse(d);
  return !Number.isNaN(t);
}

function isTierBPlusTournament(slug) {
  return TIER_B_PLUS_SLUGS.has(slug);
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

  if (!isTierBPlusTournament(m.tournamentSlug)) return false;

  if (m.status === "finished") {
    return year >= MIN_YEAR && m.scoreA !== m.scoreB;
  }
  if (m.status === "upcoming" || m.status === "live") {
    return t > Date.now() - 7 * 24 * 60 * 60 * 1000 && t <= Date.now() + MAX_FUTURE_MS;
  }
  return false;
}

function inferTournamentStatus(dates) {
  const now = Date.now();
  const starts = dates.map((d) => Date.parse(d)).filter((n) => !Number.isNaN(n));
  if (!starts.length) return "upcoming";
  const min = Math.min(...starts);
  const max = Math.max(...starts);
  if (max < now - 2 * 24 * 60 * 60 * 1000) return "finished";
  if (min > now + 2 * 24 * 60 * 60 * 1000) return "upcoming";
  return "live";
}

function buildDiscoveredTournaments(matches) {
  const bySlug = new Map();
  for (const m of matches) {
    const slug = m.tournamentSlug;
    if (!slug || BSC_RE.test(slug)) continue;
    if (!bySlug.has(slug)) {
      bySlug.set(slug, {
        slug,
        dates: [],
        regions: new Map(),
        teams: new Set(),
      });
    }
    const row = bySlug.get(slug);
    row.dates.push(m.date);
    row.regions.set(m.region || "GLOBAL", (row.regions.get(m.region || "GLOBAL") || 0) + 1);
    row.teams.add(m.teamASlug);
    row.teams.add(m.teamBSlug);
  }

  const out = [];
  for (const [slug, row] of bySlug) {
    const catalog = TOURNAMENT_META.get(slug);
    const dates = row.dates.filter(Boolean).sort();
    const startDate = catalog?.startDate || dates[0]?.slice(0, 10) || "2026-01-01";
    const endDate = catalog?.endDate || dates[dates.length - 1]?.slice(0, 10) || startDate;
    const region =
      catalog?.region ||
      [...row.regions.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "GLOBAL";

    out.push({
      slug,
      name: catalog?.name || slugToName(slug),
      shortName: catalog?.shortName || slugToName(slug),
      region,
      prizePool: catalog?.prizePool || "TBA",
      teams: catalog?.teams || row.teams.size,
      status: catalog?.status || inferTournamentStatus(dates),
      startDate,
      endDate,
      location: catalog?.location || "Online",
      stage: catalog?.stage || "Circuit",
      tier: catalog?.tier ?? 3,
      logoFile: catalog?.logoFile ?? null,
      source: catalog ? "liquipedia-catalog" : "liquipedia-match-2026",
    });
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
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
          tag: slug
            .split("-")
            .map((p) => p[0])
            .join("")
            .slice(0, 3)
            .toUpperCase(),
          region: m.region || "GLOBAL",
          source: "liquipedia-match-2026",
        });
      }
    }
  }

  const discoveredTeams = [...teamMeta.values()].sort((a, b) => a.slug.localeCompare(b.slug));
  const discoveredTournaments = buildDiscoveredTournaments(kept);
  const tourSlugs = new Set(kept.map((m) => m.tournamentSlug));

  const bsc = kept.filter((m) => BSC_RE.test(m.tournamentSlug)).length;
  const tierB = kept.filter((m) => isTierBPlusTournament(m.tournamentSlug) && !BSC_RE.test(m.tournamentSlug)).length;
  const upcoming = kept.filter((m) => m.status === "upcoming").length;
  const finished = kept.filter((m) => m.status === "finished").length;

  console.log(`Tier B+ catalog: ${TIER_B_PLUS_SLUGS.size} torneos`);
  console.log(`Matches: ${all.length} → ${kept.length} (BSC ${bsc}, tier B+ regional ${tierB})`);
  console.log(`  upcoming ${upcoming}, finished ${finished}`);
  console.log(`  tournaments in pool: ${tourSlugs.size}`);
  console.log(`Discovered teams: ${discoveredTeams.length}`);
  console.log(`Discovered tournaments: ${discoveredTournaments.length}`);

  if (!WRITE) {
    console.log("\nDry-run. Usa --write para guardar.");
    return;
  }

  fs.writeFileSync(matchesPath, JSON.stringify(kept));
  fs.writeFileSync(path.join(outDir, "teams-discovered.json"), JSON.stringify(discoveredTeams, null, 2));
  fs.writeFileSync(
    path.join(outDir, "tournaments-discovered.json"),
    JSON.stringify(discoveredTournaments, null, 2),
  );
  console.log("Wrote matches-2026.json, teams-discovered.json, tournaments-discovered.json");
}

main();

/**
 * Sincroniza cuadros oficiales Supercell BSC → JSON publicable.
 *   node scripts/sync-supercell-brackets.mjs --write
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outPath = path.join(root, "src/lib/data/generated/supercell-bracket-matches.json");
const WRITE = process.argv.includes("--write");

const BASE = "https://event.supercell.com";

/** eventId → slug torneo BrawlForge (Monthly Finals activos). */
const EVENT_TOURNAMENT = {
  "57UicBDQiZW3rOEycvUM7P": "bsc-2026-june-emea-mf",
  fUOdC0IqHXuBhtoegWFeO: "bsc-2026-june-ea-mf",
  "6iVR4E1YiJiezETVwcqn6f": "bsc-2026-june-na-mf",
  "5HIWv7rJuTye6PouIyTGDw": "bsc-2026-june-sa-mf",
};

const REGION = {
  "bsc-2026-june-emea-mf": "EMEA",
  "bsc-2026-june-ea-mf": "EA",
  "bsc-2026-june-na-mf": "NA",
  "bsc-2026-june-sa-mf": "SA",
};

/** Seeds 1–8 por región (leaderboard BSC). */
const PARTICIPANTS = {
  "bsc-2026-june-emea-mf": [
    "fut-esports",
    "sk-gaming",
    "team-heretics",
    "hmble",
    "natus-vincere",
    "totem-esports",
    "novo-esports",
    "big",
  ],
  "bsc-2026-june-ea-mf": [
    "crazy-raccoon",
    "zeta-division",
    "reject",
    "skcalalas-ea",
    "rival-esports",
    "wwl-esports",
    "feasible-gaming",
    "frenzy-esports",
  ],
  "bsc-2026-june-na-mf": [
    "tribe-gaming",
    "only-realm",
    "stmn-esports",
    "team-elektros",
    "vatic-esports",
    "elevate",
    "f-a-homeless",
    "legacy-esports",
  ],
  "bsc-2026-june-sa-mf": [
    "loud",
    "skcalalas",
    "new-heights-gaming",
    "kaioperro",
    "eternal-esports",
    "bounty-hunters-esports",
    "alguem-segura",
    "olimpo-squad",
  ],
};

/** Mapeo global contestantId → slug (inferido de cuadros regionales). */
export const CONTESTANT_SLUGS = {
  2: "team-heretics",
  4: "fut-esports",
  5: "natus-vincere",
  6: "crazy-raccoon",
  8: "rival-esports",
  11: "reject",
  13: "feasible-gaming",
  15: "novo-esports",
  21: "hmble",
  23: "wwl-esports",
  24: "sk-gaming",
  25: "totem-esports",
  27: "skcalalas-ea",
  33: "fut-esports",
  47: "zeta-division",
  51: "loud",
  52: "totem-esports",
  55: "frenzy-esports",
  56: "zeta-division",
  57: "big",
};

function getJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { Accept: "application/json", "User-Agent": "BrawlForge/1.0" } }, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          if (res.statusCode !== 200) return reject(new Error(`${url} → ${res.statusCode}`));
          resolve(JSON.parse(d));
        });
      })
      .on("error", reject);
  });
}

function seedPairs(seeds) {
  return [
    [seeds[0], seeds[7]],
    [seeds[1], seeds[6]],
    [seeds[2], seeds[5]],
    [seeds[3], seeds[4]],
  ];
}

function buildIdMapFromQfs(qfMatches, seeds) {
  const map = { ...CONTESTANT_SLUGS };
  const pairs = seedPairs(seeds);
  qfMatches.forEach((m, i) => {
    const [aId, bId] = (m.contestant ?? []).map((c) => c.id).filter((id) => id > 0);
    if (!aId || !bId) return;
    const [seedA, seedB] = pairs[i] ?? [];
    if (seedA) map[aId] = seedA;
    if (seedB) map[bId] = seedB;
  });
  return map;
}

function slugFromId(id, map) {
  if (!id || id <= 0) return null;
  return map[id] ?? null;
}

function stageLabel(m, idx, total) {
  if (m.isFantasy && idx >= total - 1) return "Grand Final";
  if (m.isFantasy) return "Semifinal";
  return "Quarterfinal";
}

function matchStatus(m) {
  if (m.completed) return "finished";
  const total = (m.contestant ?? []).reduce((s, c) => s + (c.score ?? 0), 0);
  if (total > 0) return "live";
  return "upcoming";
}

function toEsportsMatch(bracket, event, tournamentSlug, sm, idx, totalMatches, idMap) {
  const c0 = sm.contestant?.[0];
  const c1 = sm.contestant?.[1];
  let teamA = slugFromId(c0?.id, idMap);
  let teamB = slugFromId(c1?.id, idMap);

  if (!teamA || !teamB) {
    if (sm.isFantasy) {
      teamA = teamA ?? `winner-m-${sm.populateFromMatches?.[0]?.matchId ?? idx}`;
      teamB = teamB ?? `winner-m-${sm.populateFromMatches?.[1]?.matchId ?? idx + 1}`;
    } else {
      return null;
    }
  }

  const rangeStart = event?.rangeStartTimes?.["1"];
  const baseDate = rangeStart ? new Date(rangeStart) : new Date("2026-06-14T11:00:00Z");
  const offsetMin = idx * 90;
  const date = new Date(baseDate.getTime() + offsetMin * 60_000).toISOString();

  return {
    id: `sc-${event.eventId}-${sm.id}`,
    teamASlug: teamA,
    teamBSlug: teamB,
    scoreA: c0?.score ?? 0,
    scoreB: c1?.score ?? 0,
    tournamentSlug,
    stage: stageLabel(sm, idx, totalMatches),
    date,
    status: matchStatus(sm),
    region: REGION[tournamentSlug] ?? "GLOBAL",
    format: "Bo5",
    meta: {
      schedule_trust: "confirmed",
      pickem_only: false,
      data_source: "supercell",
      supercell_event_id: event.eventId,
      supercell_match_id: sm.id,
    },
  };
}

async function main() {
  const [events, brackets] = await Promise.all([
    getJson(`${BASE}/brawlstars/v1/event`),
    getJson(`${BASE}/brawlstars/v1/bracket`),
  ]);

  const eventById = new Map(events.map((e) => [e.eventId, e]));
  const matches = [];
  const idMaps = {};

  for (const bracket of brackets) {
    const tournamentSlug = EVENT_TOURNAMENT[bracket.eventId];
    if (!tournamentSlug) continue;

    const seeds = PARTICIPANTS[tournamentSlug];
    if (!seeds?.length) continue;

    const event = eventById.get(bracket.eventId);
    const allMatches = bracket.ranges?.flatMap((r) => r.matches ?? []) ?? [];
    const qfs = allMatches.filter((m) => !m.isFantasy && !m.isSkipped && (m.contestant ?? []).some((c) => c.id > 0));
    const idMap = buildIdMapFromQfs(qfs, seeds);
    idMaps[tournamentSlug] = idMap;

    allMatches.forEach((sm, idx) => {
      if (sm.isSkipped) return;
      const row = toEsportsMatch(bracket, event, tournamentSlug, sm, idx, allMatches.length, idMap);
      if (row) matches.push(row);
    });
  }

  const summary = {
    syncedAt: new Date().toISOString(),
    events: events.map((e) => ({
      eventId: e.eventId,
      region: e.region,
      status: e.status,
      start: e.rangeStartTimes?.["1"] ? new Date(e.rangeStartTimes["1"]).toISOString() : null,
      tournamentSlug: EVENT_TOURNAMENT[e.eventId] ?? null,
    })),
    contestantMaps: idMaps,
    matches,
  };

  console.log(`Supercell brackets: ${brackets.length} eventos, ${matches.length} partidos publicables`);
  for (const e of summary.events.filter((x) => x.tournamentSlug)) {
    const n = matches.filter((m) => m.tournamentSlug === e.tournamentSlug).length;
    console.log(`  ${e.tournamentSlug}: ${n} partidos (${e.status}, ${e.start?.slice(0, 10) ?? "?"})`);
  }

  if (WRITE) {
    fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
    console.log(`Wrote ${path.relative(root, outPath)}`);
  } else {
    console.log("Dry run — usa --write");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

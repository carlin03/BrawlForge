/**
 * Scrape official Supercell BSC event site for teams, logos, players, images.
 * Run: node scripts/sync-supercell-bsc.mjs
 */
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const BASE = "https://event.supercell.com";

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0 BrawlForge/1.0", Accept: "*/*", ...headers } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith("http") ? res.headers.location : BASE + res.headers.location;
          return get(next, headers).then(resolve).catch(reject);
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          resolve({ status: res.statusCode, ct: res.headers["content-type"] || "", buf, text: buf.toString("utf8") });
        });
      })
      .on("error", reject);
  });
}

function walk(obj, fn) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    for (const item of obj) walk(item, fn);
    return;
  }
  fn(obj);
  for (const v of Object.values(obj)) walk(v, fn);
}

function absUrl(u) {
  if (!u || typeof u !== "string") return null;
  if (u.startsWith("http")) return u;
  if (u.startsWith("/")) return BASE + u;
  return null;
}

/** Extract image URLs from any nested object */
function extractImages(obj) {
  const images = new Set();
  walk(obj, (node) => {
    for (const [k, v] of Object.entries(node)) {
      if (typeof v !== "string") continue;
      const kl = k.toLowerCase();
      if (/logo|icon|photo|image|badge|avatar|banner|thumbnail|picture/.test(kl)) {
        const u = absUrl(v);
        if (u) images.add(u);
      }
      if (v.includes("/images/") || v.includes("/streamers/") || v.includes("/contestants/")) {
        const u = absUrl(v);
        if (u) images.add(u);
      }
    }
  });
  return [...images];
}

/** Extract team/contestant-like records */
function extractTeams(obj) {
  const teams = [];
  walk(obj, (node) => {
    const name =
      node.name || node.teamName || node.displayName || node.title || node.contestantName || node.organizationName;
    if (!name || typeof name !== "string") return;
    const id = node.contestantId ?? node.teamId ?? node.id;
    const logo =
      absUrl(node.logoUrl) ||
      absUrl(node.logo) ||
      absUrl(node.contestantLogo) ||
      absUrl(node.teamLogo) ||
      absUrl(node.imageUrl) ||
      absUrl(node.image) ||
      absUrl(node.iconUrl) ||
      absUrl(node.badgeUrl) ||
      absUrl(node.photo);
    const region = node.region || node.country || "";
    const players = node.players || node.members || node.roster;
    if (logo || (id != null && name.length > 2 && name.length < 60)) {
      teams.push({ id, name, logo, region, players: Array.isArray(players) ? players : undefined, raw: node });
    }
  });
  return teams;
}

console.log("=== Supercell BSC Sync ===\n");

// 1. Event list (works with Accept: application/json)
console.log("1. Fetching /brawlstars/v1/event ...");
const eventRes = await get(`${BASE}/brawlstars/v1/event`, { Accept: "application/json" });
let events = [];
if (eventRes.text.trim().startsWith("[")) {
  events = JSON.parse(eventRes.text);
  fs.writeFileSync(path.join(__dirname, "bsc-event-fresh.json"), JSON.stringify(events, null, 2));
  console.log(`   OK — ${events.length} event(s)`);
} else {
  console.log(`   FAIL — got HTML (${eventRes.text.length}b)`);
}

// 2. Nuxt payload from homepage
console.log("2. Fetching Nuxt payload ...");
const pageRes = await get(`${BASE}/brawlstars/en`);
const payloadMatch = pageRes.text.match(/\/brawlstars\/en\/_payload\.json[^"']*/);
let payload = null;
if (payloadMatch) {
  const payloadUrl = BASE + payloadMatch[0].split("?")[0] + (payloadMatch[0].includes("?") ? "?" + payloadMatch[0].split("?")[1] : "");
  const pr = await get(payloadUrl.startsWith("http") ? payloadUrl : BASE + payloadMatch[0]);
  try {
    payload = JSON.parse(pr.text);
    fs.writeFileSync(path.join(__dirname, "bsc-payload.json"), JSON.stringify(payload, null, 2));
    console.log(`   OK — payload ${pr.text.length}b`);
  } catch {
    console.log("   FAIL — invalid JSON payload");
  }
}

// 3. Scan nuxt bundle for API paths
console.log("3. Scanning Nuxt bundle for API routes ...");
const jsMatch = pageRes.text.match(/\/brawlstars\/_nuxt\/[^"']+\.js/);
const apiPaths = new Set();
if (jsMatch) {
  const jsRes = await get(BASE + jsMatch[0]);
  const paths = [...jsRes.text.matchAll(/\/brawlstars\/v1\/[a-zA-Z0-9_/-]+/g)].map((m) => m[0]);
  for (const p of paths) apiPaths.add(p);
  console.log(`   Found ${apiPaths.size} API paths in bundle`);
}

// 4. Try known image URL patterns from Supercell CDN
console.log("4. Probing image URL patterns ...");
const imagePatterns = [
  "/brawlstars/images/leaderboard/trophies/trophy-icon-gold.png",
  "/streamers/photos/11D7m26COWMvSS9sXmYqIL",
];
for (const p of imagePatterns) {
  const r = await get(BASE + p);
  const isPng = r.buf[0] === 0x89 && r.buf[1] === 0x50;
  console.log(`   ${p} → ${r.status} ${isPng ? "PNG" : r.ct}`);
}

// 5. Aggregate teams from all JSON sources
const allTeams = [];
const allImages = new Set();
for (const src of [events, payload].filter(Boolean)) {
  allTeams.push(...extractTeams(src));
  for (const img of extractImages(src)) allImages.add(img);
}

// Dedupe teams by name
const byName = new Map();
for (const t of allTeams) {
  const key = t.name.toLowerCase().trim();
  if (!byName.has(key) || (t.logo && !byName.get(key).logo)) byName.set(key, t);
}

const report = {
  syncedAt: new Date().toISOString(),
  source: "https://event.supercell.com/brawlstars/en",
  events: events.map((e) => ({
    eventId: e.eventId,
    status: e.status,
    cup: e.cup,
    region: e.region,
    numberOfContestants: e.numberOfContestants,
    bracketType: e.bracketType,
  })),
  apiPaths: [...apiPaths].sort(),
  teams: [...byName.values()].map(({ id, name, logo, region, players }) => ({
    id,
    name,
    logo,
    region,
    playerCount: players?.length,
  })),
  images: [...allImages].sort(),
  imageBaseUrl: BASE,
  notes: [
    "Logos de equipos suelen estar en campos logo/contestantLogo dentro del JSON de evento",
    "Fotos de streamers: /streamers/photos/{id}",
    "Assets UI: /brawlstars/images/**",
    "API principal: GET /brawlstars/v1/event (Accept: application/json)",
  ],
};

fs.writeFileSync(path.join(__dirname, "supercell-bsc-report.json"), JSON.stringify(report, null, 2));

console.log("\n=== RESUMEN ===");
console.log(`Eventos: ${report.events.length}`);
console.log(`Equipos detectados: ${report.teams.length}`);
console.log(`Imágenes URLs: ${report.images.length}`);
if (report.teams.length) {
  console.log("\nEquipos con logo:");
  for (const t of report.teams.filter((x) => x.logo).slice(0, 15)) {
    console.log(`  • ${t.name} → ${t.logo}`);
  }
}
console.log(`\nReporte guardado: scripts/supercell-bsc-report.json`);

// 6. Bracket + contestant IDs
console.log("\n5. Fetching bracket ...");
const bracketRes = await get(`${BASE}/brawlstars/v1/bracket`, { Accept: "application/json" });
let bracket = [];
if (bracketRes.text.trim().startsWith("[")) {
  bracket = JSON.parse(bracketRes.text);
  fs.writeFileSync(path.join(__dirname, "bsc-bracket-fresh.json"), JSON.stringify(bracket, null, 2));
  const ids = new Set();
  for (const b of bracket) {
    for (const r of b.ranges ?? []) {
      for (const m of r.matches ?? []) {
        for (const c of m.contestant ?? []) ids.add(c.id);
      }
    }
  }
  console.log(`   ${bracket.length} bracket(s), ${ids.size} contestant IDs:`, [...ids].sort((a, b) => a - b).join(", "));
}

// 7. Download official UI assets
console.log("\n6. Downloading official UI assets ...");
const assetDir = path.join(root, "public", "supercell");
fs.mkdirSync(assetDir, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    }).on("error", reject);
  });
}

const assets = [
  { url: `${BASE}/brawlstars/share-image.jpg`, file: "share-image.jpg" },
  { url: `${BASE}/brawlstars/images/leaderboard/trophies/trophy-icon-gold.png`, file: "trophy-gold.png" },
  { url: `${BASE}/brawlstars/images/leaderboard/trophies/trophy-icon-silver.png`, file: "trophy-silver.png" },
  { url: `${BASE}/brawlstars/images/leaderboard/trophies/trophy-icon-bronze.png`, file: "trophy-bronze.png" },
];

for (const a of assets) {
  try {
    await download(a.url, path.join(assetDir, a.file));
    console.log(`   ✓ ${a.file}`);
  } catch (e) {
    console.log(`   ✗ ${a.file} (${e.message})`);
  }
}

report.bracketContestantIds = bracket.length
  ? [...new Set(bracket.flatMap((b) => b.ranges?.flatMap((r) => r.matches?.flatMap((m) => m.contestant?.map((c) => c.id) ?? []) ?? []) ?? []))].sort((a, b) => a - b)
  : [];
report.localAssets = assets.map((a) => `/supercell/${a.file}`);
fs.writeFileSync(path.join(__dirname, "supercell-bsc-report.json"), JSON.stringify(report, null, 2));
console.log("\nAssets locales en public/supercell/");

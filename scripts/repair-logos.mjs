/**
 * Repara logos: elimina PNG genéricos duplicados (Liquipedia default) y re-descarga reales.
 *
 * npm run logos:repair           # equipos + torneos tier B+
 * npm run logos:repair -- --teams-only
 * npm run logos:repair -- --purge-junk   # solo borra genéricos en torneos
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  TEAMS_CATALOG,
  TOURNAMENTS_CATALOG,
  resolveLiquipediaApiUrl,
} from "./catalog-logos.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const TEAMS_DIR = path.join(root, "public", "logos", "teams");
const TOUR_DIR = path.join(root, "public", "logos", "tournaments");
const OUT_MANIFEST = path.join(root, "src", "lib", "data", "generated", "logo-manifest.json");
const MAX_TIER = 3;
const MIN_TEAM_BYTES = 6000;
const MIN_TOUR_BYTES = 9000;
const GENERIC_MIN_COPIES = 6;
const TEAMS_ONLY = process.argv.includes("--teams-only");
const PURGE_ONLY = process.argv.includes("--purge-junk");
const REPROCESS_TEAMS = process.argv.includes("--reprocess-teams");

const sharp = (await import("sharp")).default;

function md5(buf) {
  return crypto.createHash("md5").update(buf).digest("hex");
}

function isPng(buf, min = 500) {
  return buf.length >= min && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
}

/** Convierte fondo blanco/casi blanco a alpha 0 */
async function stripWhiteBackground(inputBuf) {
  const { data, info } = await sharp(inputBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  if (channels < 4) return inputBuf;
  const threshold = 242;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r >= threshold && g >= threshold && b >= threshold) {
      data[i + 3] = 0;
    }
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

async function toOptimizedPng(inputBuf) {
  const stripped = await stripWhiteBackground(inputBuf);
  return sharp(stripped)
    .resize(256, 256, { fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9, force: true })
    .toBuffer();
}

function shieldSvg(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const fill = `hsl(${hue} 58% 42%)`;
  const accent = `hsl(${(hue + 42) % 360} 70% 58%)`;
  const mid = 128;
  const shield = `M ${mid} 20 L 225 56 L 200 210 L ${mid} 240 L 56 210 L 31 56 Z`;
  return `<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="18" fill="#0f141f"/>
    <path d="${shield}" fill="${fill}" stroke="${accent}" stroke-width="2"/>
  </svg>`;
}

async function shieldPng(slug) {
  return sharp(Buffer.from(shieldSvg(slug))).png().toBuffer();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function hashCounts(dir) {
  const map = new Map();
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".png")) continue;
    const buf = fs.readFileSync(path.join(dir, f));
    const h = md5(buf);
    if (!map.has(h)) map.set(h, { count: 0, size: buf.length, files: [] });
    const e = map.get(h);
    e.count++;
    e.files.push(f);
  }
  return map;
}

function findGenericHashes(dir, minCopies = GENERIC_MIN_COPIES) {
  const blocked = new Set();
  for (const [hash, meta] of hashCounts(dir)) {
    if (meta.count >= minCopies) blocked.add(hash);
  }
  return blocked;
}

function purgeByHashes(dir, blocked) {
  let removed = 0;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".png")) continue;
    const p = path.join(dir, f);
    const h = md5(fs.readFileSync(p));
    if (blocked.has(h)) {
      fs.unlinkSync(p);
      removed++;
    }
  }
  return removed;
}

async function fetchUrl(url) {
  const res = await fetch(url, { headers: { "User-Agent": "BrawlForge/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 500) throw new Error("too small");
  return buf;
}

async function downloadTeamLogo(team) {
  const { TAIYORO_LOGOS, ROYALEAPI_LOGOS, ORG_OFFICIAL_LOGOS } = await import("./team-logo-urls.mjs");
  const sources = [];
  if (TAIYORO_LOGOS[team.slug]) sources.push(TAIYORO_LOGOS[team.slug]);
  if (ORG_OFFICIAL_LOGOS[team.slug]) sources.push(ORG_OFFICIAL_LOGOS[team.slug]);
  if (ROYALEAPI_LOGOS[team.slug]) sources.push(ROYALEAPI_LOGOS[team.slug]);
  if (sources.length === 0 && team.logoFile) {
    try {
      const api = await resolveLiquipediaApiUrl(team.logoFile);
      if (api) sources.push(api);
    } catch {
      /* continue */
    }
    const { liquipediaCommonsUrl } = await import("./liquipedia-commons.mjs");
    const commons = liquipediaCommonsUrl(team.logoFile);
    if (commons) sources.push(commons);
  }
  for (const url of sources) {
    try {
      if (url.includes("liquipedia.net/commons")) await sleep(2200);
      const raw = await fetchUrl(url);
      const png = await toOptimizedPng(raw);
      if (png.length >= MIN_TEAM_BYTES) return png;
    } catch {
      /* next */
    }
    await sleep(350);
  }
  return null;
}

async function downloadByLogoFile(logoFile) {
  const { liquipediaCommonsUrl } = await import("./liquipedia-commons.mjs");
  const urls = [];
  try {
    const api = await resolveLiquipediaApiUrl(logoFile);
    if (api) urls.push(api);
  } catch {
    /* continue */
  }
  const commons = liquipediaCommonsUrl(logoFile);
  if (commons) urls.push(commons);

  for (const url of urls) {
    try {
      if (url.includes("liquipedia")) await sleep(2200);
      const raw = await fetchUrl(url);
      const png = await toOptimizedPng(raw);
      if (png.length >= MIN_TOUR_BYTES) return png;
    } catch {
      /* next */
    }
  }
  return null;
}

async function repairTeams(blockedHashes) {
  fs.mkdirSync(TEAMS_DIR, { recursive: true });
  let fixed = 0;
  let ok = 0;
  const teamLocal = [];

  for (const team of TEAMS_CATALOG) {
    if (!team.slug) continue;
    const dest = path.join(TEAMS_DIR, `${team.slug}.png`);
    let buf = fs.existsSync(dest) ? fs.readFileSync(dest) : null;
    const bad =
      !buf ||
      !isPng(buf, MIN_TEAM_BYTES) ||
      blockedHashes.has(md5(buf)) ||
      buf.length < MIN_TEAM_BYTES;

    if (bad) {
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      process.stdout.write(`  team ${team.slug}... `);
      const png = await downloadTeamLogo(team);
      if (png && !blockedHashes.has(md5(png))) {
        fs.writeFileSync(dest, png);
        console.log(`ok (${png.length}b)`);
        fixed++;
        teamLocal.push(team.slug);
      } else {
        try {
          const fallback = await shieldPng(team.slug);
          if (fallback.length >= MIN_TEAM_BYTES) {
            fs.writeFileSync(dest, fallback);
            console.log(`shield (${fallback.length}b)`);
            teamLocal.push(team.slug);
          } else {
            console.log("FAIL");
          }
        } catch {
          console.log("FAIL");
        }
      }
    } else if (REPROCESS_TEAMS && buf) {
      process.stdout.write(`  strip ${team.slug}... `);
      try {
        const png = await toOptimizedPng(buf);
        if (png.length >= MIN_TEAM_BYTES && !blockedHashes.has(md5(png))) {
          fs.writeFileSync(dest, png);
          console.log(`ok (${png.length}b)`);
          fixed++;
          teamLocal.push(team.slug);
        } else {
          ok++;
          teamLocal.push(team.slug);
          console.log("keep");
        }
      } catch {
        ok++;
        teamLocal.push(team.slug);
        console.log("keep");
      }
    } else {
      ok++;
      teamLocal.push(team.slug);
    }
  }
  console.log(`Equipos: ${teamLocal.length} válidos (${fixed} re-descargados/reprocesados, ${ok} ya OK)`);
  return teamLocal;
}

function tournamentsToRepair() {
  return TOURNAMENTS_CATALOG.filter(
    (t) =>
      t.logoFile &&
      ((t.tier != null && t.tier <= 2) ||
        /^(bsc-202[56]|world-finals|brawl-cup-202)/i.test(t.slug)),
  );
}

async function repairTournaments(blockedHashes) {
  const tierTours = tournamentsToRepair();
  const byFile = new Map();
  for (const t of tierTours) {
    if (!byFile.has(t.logoFile)) byFile.set(t.logoFile, []);
    byFile.get(t.logoFile).push(t.slug);
  }

  console.log(`\nTorneos S/A/BSC: ${tierTours.length} slugs, ${byFile.size} logos únicos`);
  fs.mkdirSync(TOUR_DIR, { recursive: true });
  const tournamentLocal = [];
  let filesWritten = 0;

  for (const [logoFile, slugs] of byFile) {
    process.stdout.write(`  ${logoFile.slice(0, 40)}... `);
    const png = await downloadByLogoFile(logoFile);
    if (!png || blockedHashes.has(md5(png))) {
      console.log("skip");
      continue;
    }
    const hash = md5(png);
    if (blockedHashes.has(hash)) {
      console.log("generic");
      continue;
    }
    for (const slug of slugs) {
      fs.writeFileSync(path.join(TOUR_DIR, `${slug}.png`), png);
      tournamentLocal.push(slug);
    }
    filesWritten++;
    console.log(`ok → ${slugs.length} slugs (${png.length}b)`);
    await sleep(400);
  }

  const uniqueSlugs = [...new Set(tournamentLocal)];
  console.log(`Torneos: ${uniqueSlugs.length} slugs con PNG real (${filesWritten} fuentes)`);
  return uniqueSlugs;
}

function scanValid(dir, minBytes, blocked) {
  const slugs = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".png") || f === ".png") continue;
    const buf = fs.readFileSync(path.join(dir, f));
    if (!isPng(buf, minBytes) || blocked.has(md5(buf))) continue;
    slugs.push(f.replace(/\.png$/, ""));
  }
  return slugs;
}

async function main() {
  console.log("BrawlForge — reparación de logos PNG\n");

  const tourBlocked = findGenericHashes(TOUR_DIR);
  const teamBlocked = findGenericHashes(TEAMS_DIR, 12);
  const blocked = new Set([...tourBlocked, ...teamBlocked]);
  console.log(`Hashes genéricos bloqueados: ${blocked.size} (torneos ${tourBlocked.size}, equipos ${teamBlocked.size})`);

  const purged = purgeByHashes(TOUR_DIR, tourBlocked);
  console.log(`Eliminados ${purged} PNG de torneo duplicados/genéricos`);

  if (PURGE_ONLY) {
    writeManifest(teamBlocked, tourBlocked);
    console.log("\n--purge-junk: listo.");
    return;
  }

  const teamLocal = await repairTeams(teamBlocked);
  const tournamentLocal = TEAMS_ONLY ? scanValid(TOUR_DIR, MIN_TOUR_BYTES, tourBlocked) : await repairTournaments(blocked);

  writeManifest(teamBlocked, tourBlocked, teamLocal, tournamentLocal);
}

function writeManifest(teamBlocked, tourBlocked, teamLocal = null, tournamentLocal = null) {
  const blocked = new Set([...teamBlocked, ...tourBlocked]);
  const manifest = {
    generatedAt: new Date().toISOString(),
    blockedHashes: [...blocked],
    teamLocal: (teamLocal ?? scanValid(TEAMS_DIR, MIN_TEAM_BYTES, teamBlocked)).sort(),
    tournamentLocal: (tournamentLocal ?? scanValid(TOUR_DIR, MIN_TOUR_BYTES, tourBlocked)).sort(),
  };
  fs.mkdirSync(path.dirname(OUT_MANIFEST), { recursive: true });
  fs.writeFileSync(OUT_MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest → ${OUT_MANIFEST}`);
  console.log(`  teams: ${manifest.teamLocal.length}`);
  console.log(`  tournaments: ${manifest.tournamentLocal.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

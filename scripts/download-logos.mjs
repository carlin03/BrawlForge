/**

 * Download team logos from multiple CDNs (NOT Liquipedia wiki UI):

 * 1. TAIYORO BSC CDN

 * 2. Org official websites

 * 3. RoyaleAPI CDN

 * 4. Wikimedia Commons

 * 5. Liquipedia commons CDN (slow — rate limited)

 * 6. DuckDuckGo org favicons

 * 7. Generated color placeholders

 *

 * Run: npm run logos:download

 * Force re-download: npm run logos:download -- --force

 */

import https from "node:https";

import http from "node:http";

import fs from "node:fs";

import path from "node:path";

import { fileURLToPath } from "node:url";

import { spawnSync } from "node:child_process";

import { ALL_TEAM_SLUGS, logoSourcesForSlug } from "./team-logo-urls.mjs";
import {
  TEAMS_CATALOG,
  TOURNAMENTS_CATALOG,
  CATALOG_TOURNAMENT_LOGO_URLS,
  resolveLiquipediaApiUrl,
} from "./catalog-logos.mjs";



const __dirname = path.dirname(fileURLToPath(import.meta.url));

const root = path.join(__dirname, "..");

const FORCE = process.argv.includes("--force");



const BSC_GAME = "https://taiyoro-prod-media.s3.amazonaws.com/game/mWB0X8mVG2.png";

const TOURNAMENT_LOGOS = {

  "world-finals-2025": BSC_GAME,

  "world-finals-2026": BSC_GAME,

  "bsc-2026-brawl-cup": BSC_GAME,

  "bsc-2026-s3-emea-mf": BSC_GAME,

  "bsc-2026-s3-ea-mf": BSC_GAME,

  "bsc-2026-s3-na-mf": BSC_GAME,

  "bsc-2025-emea": BSC_GAME,

  "brawl-cup-2025": BSC_GAME,

};



let sharp;

try {

  sharp = (await import("sharp")).default;

} catch {

  sharp = null;

}



function sleep(ms) {

  return new Promise((r) => setTimeout(r, ms));

}



function isValidPng(filePath) {

  try {

    const buf = fs.readFileSync(filePath);

    return buf.length > 800 && buf[0] === 0x89 && buf[1] === 0x50;

  } catch {

    return false;

  }

}



async function normalizeToPng(inputBuf, dest) {

  if (inputBuf[0] === 0x89 && inputBuf[1] === 0x50) {

    fs.writeFileSync(dest, inputBuf);

    return inputBuf.length;

  }

  if (!sharp) throw new Error("needs sharp for non-PNG");

  const out = await sharp(inputBuf).png().toBuffer();

  fs.writeFileSync(dest, out);

  return out.length;

}



function downloadBuffer(url) {

  return new Promise((resolve, reject) => {

    const lib = url.startsWith("https") ? https : http;

    const fetch = (u, redirects = 0) => {

      lib

        .get(u, { headers: { "User-Agent": "Mozilla/5.0 BrawlForge/1.0", Accept: "image/*,*/*" } }, (res) => {

          if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && redirects < 8) {

            res.resume();

            const next = res.headers.location.startsWith("http")

              ? res.headers.location

              : new URL(res.headers.location, u).href;

            return fetch(next, redirects + 1);

          }

          if (res.statusCode !== 200) {

            res.resume();

            return reject(new Error(`HTTP ${res.statusCode}`));

          }

          const chunks = [];

          res.on("data", (c) => chunks.push(c));

          res.on("end", () => resolve(Buffer.concat(chunks)));

        })

        .on("error", reject);

    };

    fetch(url);

  });

}



/** curl fallback for rate-limited CDNs */

function downloadWithCurl(url, dest) {

  const r = spawnSync(

    "curl.exe",

    ["-sL", "-A", "Mozilla/5.0 BrawlForge/1.0", "-o", dest, url],

    { encoding: "utf8" },

  );

  if (r.status !== 0) throw new Error("curl failed");

  if (!fs.existsSync(dest) || fs.statSync(dest).size < 500) throw new Error("curl empty");

}



async function downloadTeam(slug) {

  const dir = path.join(root, "public", "logos", "teams");

  fs.mkdirSync(dir, { recursive: true });

  const dest = path.join(dir, `${slug}.png`);

  if (!FORCE && isValidPng(dest)) return "skip";



  const sources = logoSourcesForSlug(slug);

  const team = TEAMS_CATALOG.find((t) => t.slug === slug);
  if (team?.logoFile) {
    try {
      const apiUrl = await resolveLiquipediaApiUrl(team.logoFile);
      if (apiUrl && !sources.includes(apiUrl)) sources.unshift(apiUrl);
    } catch {
      /* continue */
    }
  }

  for (const url of sources) {

    try {

      if (url.includes("liquipedia.net/commons")) {

        await sleep(2500);

        try {

          downloadWithCurl(url, dest);

          if (isValidPng(dest)) return "liquipedia";

        } catch {

          /* try node fetch next */

        }

      }



      const buf = await downloadBuffer(url);

      if (buf.length < 500) throw new Error("too small");

      const size = await normalizeToPng(buf, dest);

      if (size > 1500 && isValidPng(dest)) {

        if (url.includes("taiyoro")) return "taiyoro";

        if (url.includes("wikimedia")) return "wikimedia";

        if (url.includes("liquipedia")) return "liquipedia";

        if (url.includes("royaleapi")) return "royaleapi";

        if (url.includes("unavatar") || url.includes("eternalesports") || url.includes("mitiendanube")) return "org";

        return "ok";

      }

      if (fs.existsSync(dest)) fs.unlinkSync(dest);

    } catch {

      if (fs.existsSync(dest)) fs.unlinkSync(dest);

    }

    await sleep(400);

  }

  return "fail";

}



console.log("Descargando logos — TAIYORO + org + RoyaleAPI + Wikimedia + Liquipedia\n");

let ok = 0;

for (const slug of ALL_TEAM_SLUGS) {

  process.stdout.write(`  ${slug}... `);

  const result = await downloadTeam(slug);

  if (result === "skip") {

    console.log("skip");

    ok++;

  } else if (result === "fail") {

    console.log("FAIL → placeholder");

  } else {

    const size = fs.statSync(path.join(root, "public", "logos", "teams", `${slug}.png`)).size;

    console.log(`ok (${result}, ${size}b)`);

    ok++;

  }

}



console.log("\nGenerando placeholders para faltantes...");

spawnSync(process.execPath, [path.join(__dirname, "generate-placeholder-logos.mjs")], { stdio: "inherit" });



console.log("\nTorneos (catalogo Liquipedia)...");

const tDir = path.join(root, "public", "logos", "tournaments");

fs.mkdirSync(tDir, { recursive: true });

const featuredTournamentSlugs = new Set([
  ...Object.keys(TOURNAMENT_LOGOS),
  "world-finals-2025",
  "world-finals-2026",
  "bsc-2026-brawl-cup",
  "brawl-cup-2025",
]);

for (const slug of featuredTournamentSlugs) {
  const dest = path.join(tDir, `${slug}.png`);
  if (!FORCE && isValidPng(dest)) continue;
  const tour = TOURNAMENTS_CATALOG.find((t) => t.slug === slug);
  const commonsUrl = CATALOG_TOURNAMENT_LOGO_URLS[slug];
  if (!tour?.logoFile && !commonsUrl) continue;
  process.stdout.write(`  ${slug.slice(0, 36)}... `);
  try {
    let buf = null;
    if (tour?.logoFile) {
      const direct = await resolveLiquipediaApiUrl(tour.logoFile);
      if (direct) buf = await downloadBuffer(direct);
    }
    if (!buf && commonsUrl) buf = await downloadBuffer(commonsUrl);
    if (!buf || buf.length < 400) throw new Error("small");
    await normalizeToPng(buf, dest);
    console.log("ok");
  } catch {
    console.log("skip");
  }
  await sleep(1200);
}

for (const [slug, url] of Object.entries(TOURNAMENT_LOGOS)) {

  const dest = path.join(tDir, `${slug}.png`);

  if (!FORCE && isValidPng(dest)) continue;

  try {

    const buf = await downloadBuffer(url);

    await normalizeToPng(buf, dest);

  } catch {

    /* optional */

  }

}



const finalOk = ALL_TEAM_SLUGS.filter((s) => isValidPng(path.join(root, "public", "logos", "teams", `${s}.png`))).length;

console.log(`\nListo: ${finalOk}/${ALL_TEAM_SLUGS.length} equipos con PNG local.`);



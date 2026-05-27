/**
 * Scan Supercell BSC pages/API for taiyoro-prod-media team logo URLs.
 */
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0 BrawlForge/1.0", Accept: "*/*" } }, (res) => {
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
          res.resume();
          return fetchText(res.headers.location).then(resolve).catch(reject);
        }
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} ${url}`));
          resolve(data);
        });
      })
      .on("error", reject);
  });
}

function fetchJson(url) {
  return fetchText(url).then((t) => JSON.parse(t));
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

const urls = [
  "https://event.supercell.com/brawlstars/v1/event",
  "https://event.supercell.com/brawlstars/en/leaderboards",
  "https://event.supercell.com/brawlstars/en/bracket",
];

const taiyoro = new Set();
const teamPairs = [];

for (const url of urls) {
  try {
    console.log("Fetching", url);
    const text = await fetchText(url);
    for (const m of text.matchAll(/https:\/\/taiyoro-prod-media\.s3\.amazonaws\.com\/[^"'\s)]+/g)) {
      taiyoro.add(m[0]);
    }
    // Try JSON parse for API
    try {
      const json = JSON.parse(text);
      walk(json, (node) => {
        for (const v of Object.values(node)) {
          if (typeof v === "string" && v.includes("taiyoro-prod-media")) taiyoro.add(v);
        }
        const name =
          node.name || node.teamName || node.displayName || node.title || node.shortName || "";
        const logo =
          node.logoUrl ||
          node.logo ||
          node.imageUrl ||
          node.teamLogo ||
          node.teamLogoUrl ||
          (typeof node.icon === "string" ? node.icon : null);
        if (name && typeof logo === "string" && logo.includes("taiyoro")) {
          teamPairs.push({ name, logo });
        }
      });
    } catch {
      /* HTML */
    }
  } catch (e) {
    console.log("  FAIL:", e.message);
  }
}

console.log("\nTAIYORO URLs found:", taiyoro.size);
for (const u of [...taiyoro].sort()) console.log(" ", u);

console.log("\nTeam name + logo pairs:", teamPairs.length);
for (const p of teamPairs) console.log(" ", p.name, "→", p.logo);

fs.writeFileSync(
  path.join(__dirname, "discovered-taiyoro-scan.json"),
  JSON.stringify({ urls: [...taiyoro], pairs: teamPairs }, null, 2),
);

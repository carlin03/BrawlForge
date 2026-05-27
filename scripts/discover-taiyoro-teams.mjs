/**
 * Fetch TAIYORO team pages and extract official logo URLs from HTML.
 */
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEAM_PAGES = [
  "bounty-hunters-brawl-stars",
  "bounty-hunters-esports-brawl-stars",
  "only-realm-brawl-stars",
  "eternal-esports-brawl-stars",
  "toxic-lotus-brawl-stars",
  "ace-xero-brawl-stars",
  "skcalalas-brawl-stars",
  "papara-supermassive-brawl-stars",
  "qlash-brawl-stars",
  "bc-gaming-brawl-stars",
  "bc-gaming-sa-brawl-stars",
  "sk-gaming-brawl-stars",
  "hmble-brawl-stars",
  "zeta-division-brawl-stars",
  "natus-vincere-brawl-stars",
  "83H633NaHA",
  "wOYoCWBEWU",
];

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0 BrawlForge/1.0" } }, (res) => {
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
          res.resume();
          return fetchText(res.headers.location).then(resolve).catch(reject);
        }
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
          resolve(data);
        });
      })
      .on("error", reject);
  });
}

const found = {};

for (const page of TEAM_PAGES) {
  const url = `https://taiyoro.gg/en/team/${page}`;
  try {
    const html = await fetchText(url);
    const logos = [
      ...html.matchAll(/https:\/\/taiyoro-prod-media\.s3\.amazonaws\.com\/team(?:_organization)?\/[^"'\s&]+\.png/g),
    ].map((m) => m[0]);
    const decoded = [
      ...html.matchAll(/taiyoro-prod-media\.s3\.amazonaws\.com%2Fteam(?:_organization)?%2F[^&]+\.png/g),
    ].map((m) => decodeURIComponent(m[0].replace(/%2F/g, "/").replace(/^/, "https://")));
    const all = [...new Set([...logos, ...decoded])];
    if (all.length) {
      found[page] = all;
      console.log(page, "→", all[0]);
    } else {
      console.log(page, "→ no logo");
    }
  } catch (e) {
    console.log(page, "→", e.message);
  }
  await new Promise((r) => setTimeout(r, 400));
}

fs.writeFileSync(path.join(__dirname, "discovered-taiyoro-teams.json"), JSON.stringify(found, null, 2));
console.log("\nSaved discovered-taiyoro-teams.json");

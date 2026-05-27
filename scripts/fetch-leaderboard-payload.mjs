import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = "https://event.supercell.com";

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json, text/html" } }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode, body: d }));
    }).on("error", reject);
  });
}

for (const page of ["leaderboards", "bracket", "predictions"]) {
  const r = await get(`${BASE}/brawlstars/en/${page}`);
  const m = r.body.match(/\/brawlstars\/en\/_payload\.json[^"']*/);
  console.log(page, r.status, m ? "has payload" : "no payload");
  if (m) {
    const pr = await get(BASE + m[0]);
    fs.writeFileSync(path.join(__dirname, `payload-${page}.json`), pr.body);
    console.log("  size", pr.body.length);
    if (pr.body.trim().startsWith("{")) {
      const j = JSON.parse(pr.body);
      fs.writeFileSync(path.join(__dirname, `payload-${page}-parsed.json`), JSON.stringify(j, null, 2));
    }
  }
}

// Try leaderboard API variations
for (const u of [
  `${BASE}/brawlstars/v1/leaderboard?eventId=w4Lu1Ua9yIKv2ZBABn6oP`,
  `${BASE}/brawlstars/v1/leaderboards`,
  `${BASE}/brawlstars/v1/leaderboard/w4Lu1Ua9yIKv2ZBABn6oP`,
]) {
  const r = await get(u);
  const isJson = r.body.trim().startsWith("{") || r.body.trim().startsWith("[");
  console.log(isJson ? "JSON" : "HTML", u.replace(BASE, ""), r.body.length);
  if (isJson) fs.writeFileSync(path.join(__dirname, "leaderboard-api.json"), r.body);
}

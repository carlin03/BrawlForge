import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVENT = "w4Lu1Ua9yIKv2ZBABn6oP";
const BASE = "https://event.supercell.com";

function get(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 BrawlForge" } }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode, body: d, json: d.trim().startsWith("{") || d.trim().startsWith("[") }));
    }).on("error", (e) => resolve({ error: e.message }));
  });
}

const endpoints = [
  `/brawlstars/v1/predictions/teams?eventId=${EVENT}`,
  `/brawlstars/v1/predictions/teams`,
  `/brawlstars/v1/event/${EVENT}/predictions/teams`,
  `/brawlstars/v1/partners`,
  `/brawlstars/v1/clubs`,
];

for (const ep of endpoints) {
  const r = await get(BASE + ep);
  console.log(ep, r.status, r.json ? "JSON" : "HTML", r.body?.length ?? r.error);
  if (r.json && r.body) {
    fs.writeFileSync(path.join(__dirname, `bsc-${ep.split("/").pop()?.split("?")[0]}.json`), r.body);
    const parsed = JSON.parse(r.body);
    if (Array.isArray(parsed) && parsed[0]) console.log(" sample keys:", Object.keys(parsed[0]));
    else if (typeof parsed === "object") console.log(" keys:", Object.keys(parsed).slice(0, 15));
  }
}

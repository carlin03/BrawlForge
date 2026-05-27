import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0 BrawlForge", Accept: "application/json" } }, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode, body: data }));
      })
      .on("error", reject);
  });
}

const bracket = await get("https://event.supercell.com/brawlstars/v1/bracket");
fs.writeFileSync(path.join(__dirname, "bracket.json"), bracket.body);
console.log("bracket", bracket.status, bracket.body.length);

const paths = [...new Set([...bracket.body.matchAll(/\/[a-zA-Z0-9/_-]+(?:\.png|\.jpg|\.webp)?/g)].map((m) => m[0]))];
console.log("paths sample:", paths.filter((p) => /team|contest|logo|icon|image|club|partner/i.test(p)).slice(0, 40));

const keys = [...new Set([...bracket.body.matchAll(/"([a-zA-Z]*(?:logo|icon|image|photo|badge|avatar|thumb)[a-zA-Z]*)"/g)].map((m) => m[1]))];
console.log("keys:", keys);

// Try common Supercell asset paths
const guesses = [
  "/brawlstars/images/teams/",
  "/brawlstars/images/contestants/",
  "/brawlstars/images/partners/",
  "/brawlstars/images/clubs/",
  "/brawlstars/images/predictions/",
];
for (const g of guesses) {
  const r = await get(`https://event.supercell.com${g}`);
  console.log(g, r.status, r.body.slice(0, 80).replace(/\n/g, " "));
}

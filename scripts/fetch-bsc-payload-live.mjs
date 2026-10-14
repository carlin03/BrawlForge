import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0 BrawlForge", Accept: "*/*" } }, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve(d));
      })
      .on("error", reject);
  });
}

const page = await get("https://event.supercell.com/brawlstars/en");
const pm = page.match(/\/brawlstars\/en\/_payload\.json[^"']*/);
if (pm) {
  const payload = await get(`https://event.supercell.com${pm[0]}`);
  fs.writeFileSync(path.join(__dirname, "bsc-payload-live.json"), payload);
  console.log("payload bytes:", payload.length);
  const j = JSON.parse(payload);
  const s = JSON.stringify(j);
  const ids = [...new Set([...s.matchAll(/"id":(\d+)/g)].map((m) => +m[1]))].sort((a, b) => a - b);
  console.log("numeric ids sample:", ids.slice(0, 40));
  const names = [...new Set([...s.matchAll(/"name":"([^"]{2,50})"/g)].map((m) => m[1]))];
  console.log("names:", names.filter((n) => !/^[a-z]{2}$/.test(n)).slice(0, 40));
}

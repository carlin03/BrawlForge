import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVENT_ID = "w4Lu1Ua9yIKv2ZBABn6oP";

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0 BrawlForge", Accept: "application/json, text/html" } }, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ url, status: res.statusCode, ct: res.headers["content-type"], body: data }));
      })
      .on("error", reject);
  });
}

const urls = [
  `https://event.supercell.com/brawlstars/v1/event/${EVENT_ID}`,
  `https://event.supercell.com/brawlstars/v1/event/${EVENT_ID}/contestants`,
  `https://event.supercell.com/brawlstars/v1/contestants/${EVENT_ID}`,
  `https://event.supercell.com/brawlstars/v1/contestants?eventId=${EVENT_ID}`,
  `https://event.supercell.com/brawlstars/v1/contestants/all`,
  `https://event.supercell.com/brawlstars/v1/teams/${EVENT_ID}`,
  `https://event.supercell.com/brawlstars/v1/teams?eventId=${EVENT_ID}`,
  `https://event.supercell.com/brawlstars/v1/contestant/4`,
  `https://event.supercell.com/brawlstars/v1/contestants/4`,
  `https://event.supercell.com/brawlstars/contestants/4/logo.png`,
  `https://event.supercell.com/brawlstars/images/contestants/4.png`,
  `https://event.supercell.com/brawlstars/images/teams/4.png`,
  `https://event.supercell.com/brawlstars/images/contestants/crazy-raccoon.png`,
  `https://event.supercell.com/streamers/photos/11D7m26COWMvSS9sXmYqIL`,
];

for (const url of urls) {
  try {
    const r = await get(url);
    const isJson = r.body.trim().startsWith("{") || r.body.trim().startsWith("[");
    console.log(`${r.status} ${isJson ? "JSON" : "HTML"} ${url.slice(0, 90)} (${r.body.length}b)`);
    if (isJson && r.status === 200) {
      fs.writeFileSync(path.join(__dirname, `probe-${urls.indexOf(url)}.json`), r.body);
      const logoFields = r.body.match(/"(?:logo|icon|image|photo|badge|avatar|thumbnail)[^"]*"\s*:\s*"[^"]+"/gi);
      if (logoFields) console.log(" ", logoFields.slice(0, 6));
      const names = r.body.match(/"(?:name|displayName|teamName|title)"\s*:\s*"[^"]+"/gi);
      if (names) console.log(" ", names.slice(0, 8));
    }
    if (!isJson && r.status === 200 && r.body.length > 500 && r.body.length < 500000) {
      const ct = r.headers?.["content-type"] || r.ct || "";
      if (ct.includes("image") || r.body.charCodeAt(0) === 0x89) console.log("  -> IMAGE!");
    }
  } catch (e) {
    console.log(`ERR ${url}: ${e.message}`);
  }
}

// Scrape event page HTML
const page = await get("https://event.supercell.com/brawlstars/en");
fs.writeFileSync(path.join(__dirname, "event-page.html"), page.body);
const scripts = [...page.body.matchAll(/src="([^"]+\.js[^"]*)"/g)].map((m) => m[1]);
console.log("\nJS bundles:", scripts.length);
for (const s of scripts.slice(0, 8)) console.log(" ", s.startsWith("http") ? s : `https://event.supercell.com${s}`);

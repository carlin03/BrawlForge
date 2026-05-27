import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, "event-page.html"), "utf8");
const chunks = [...new Set([...html.matchAll(/\/brawlstars\/_nuxt\/[^"'\s]+\.js/g)].map((m) => m[0]))];
console.log("chunks in html:", chunks.length, chunks);

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(`https://event.supercell.com${url}`, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

// Also fetch build manifest
const manifest = await get("/brawlstars/_nuxt/builds/meta/dev.json").catch(() => null);
if (manifest) console.log("manifest", manifest.slice(0, 200));

for (const c of chunks.slice(0, 15)) {
  const js = await get(c);
  const apis = [...new Set([...js.matchAll(/\/brawlstars\/v1\/[a-zA-Z0-9/_-]+/g)].map((m) => m[0]))];
  const imgs = [...new Set([...js.matchAll(/\/brawlstars\/images\/[a-zA-Z0-9/_-]+/g)].map((m) => m[0]))];
  const photos = js.includes("streamers/photos") || js.includes("contestant");
  if (apis.length || imgs.length || photos) {
    console.log("\n", c, "apis:", apis, "imgs:", imgs.slice(0, 5), "photos:", photos);
  }
}

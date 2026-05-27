import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const js = fs.readFileSync(path.join(__dirname, "nuxt-main.js"), "utf8");

for (const term of ["leaderboard", "streamers/photos", "publicFolderId", "contestantLogo", "teamImage", "cdn.supercell", "images/", ".webp", "organization"]) {
  const idx = js.indexOf(term);
  console.log(term, idx >= 0 ? js.slice(Math.max(0, idx - 80), idx + 120).replace(/\n/g, " ") : "NOT FOUND");
}

// extract unique string literals containing 'images'
const imgs = [...new Set([...js.matchAll(/"([^"]*images[^"]{0,120})"/g)].map((m) => m[1]))];
console.log("\nimage strings:", imgs.slice(0, 30));

const apis = [...new Set([...js.matchAll(/\/brawlstars\/v1\/[a-zA-Z0-9/_-]+/g)].map((m) => m[0]))];
console.log("\napi paths:", apis);

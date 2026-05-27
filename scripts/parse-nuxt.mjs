import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const js = fs.readFileSync(path.join(__dirname, "nuxt-main.js"), "utf8");

const patterns = [
  /\/brawlstars\/images\/[^"'`\s]+/g,
  /contestants?[^"'`\s]{0,80}/gi,
  /teamLogo[^"'`\s]{0,80}/gi,
  /\/contestants\/[^"'`\s]+/g,
  /Crazy Raccoon|SK Gaming|HMBLE|Tribe Gaming/g,
];

for (const p of patterns) {
  const m = [...new Set([...js.matchAll(p)].map((x) => x[0]))];
  console.log(p.toString(), "=>", m.slice(0, 20));
}

// Find all .png paths
const pngs = [...new Set([...js.matchAll(/["'`]([^"'`]*\.png[^"'`]*)["'`]/g)].map((m) => m[1]))];
console.log("\nPNG refs:", pngs.filter((p) => /team|contest|logo|partner|club|leaderboard/i.test(p)).slice(0, 40));
console.log("total png refs:", pngs.length);

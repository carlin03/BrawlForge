import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const js = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "nuxt-main.js"), "utf8");

// Find snippets around contestant + photo/logo/image
for (const term of ["contestantPhoto", "getContestant", "contestantImage", "contestants/", "buildContestant", "teamLogo", "leaderboard/trophies", "photoUrl", "imagePath"]) {
  let idx = 0;
  let count = 0;
  while ((idx = js.indexOf(term, idx)) !== -1 && count < 3) {
    console.log(`\n=== ${term} @ ${idx} ===`);
    console.log(js.slice(Math.max(0, idx - 100), idx + 200).replace(/\s+/g, " "));
    idx += term.length;
    count++;
  }
}

// Search for fetch calls
const fetches = [...js.matchAll(/fetch\(["'`]([^"'`]+)["'`]/g)].map((m) => m[1]);
console.log("\nfetch URLs:", [...new Set(fetches)].filter((u) => /brawl|supercell|event|contest|team|leader/i.test(u)));

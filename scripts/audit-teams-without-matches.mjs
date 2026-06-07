import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { loadPlayedTeamSlugs } from "./lib/played-team-slugs.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { played } = loadPlayedTeamSlugs();
const activeText = readFileSync(resolve(root, "src/lib/data/bsc-2026-active-teams.ts"), "utf8");
const active = [...activeText.matchAll(/"([a-z][a-z0-9-]*)"/g)].map((m) => m[1]);
const excluded = new Set(
  [...(activeText.match(/EXCLUDED[^[]*\[([\s\S]*?)\]/m)?.[1] ?? "").matchAll(/"([a-z][a-z0-9-]*)"/g)].map(
    (m) => m[1],
  ),
);
const uniq = [...new Set(active)].filter((s) => !excluded.has(s));
const no = uniq.filter((s) => !played.has(s));
console.log("BSC active sin partido:", no.join(", ") || "(ninguno)");

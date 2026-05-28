import { apiGet } from "./liquipedia-api.mjs";

const page = process.argv[2] || "SK_Gaming";
const d = await apiGet({ action: "parse", page, prop: "text", format: "json" });
const html = d.parse?.text?.["*"] || "";
const playerLinks = [
  ...html.matchAll(/href="\/brawlstars\/([^"#/]+)"[^>]*class="[^"]*player[^"]*"/gi),
].map((m) => m[1]);
const squadRows = [...html.matchAll(/data-sort-value="([^"]+)"[^>]*>\s*<a[^>]+href="\/brawlstars\/([^"]+)"/gi)];
console.log("page", page);
console.log("player class links", [...new Set(playerLinks)].slice(0, 20));
console.log("sort rows", squadRows.slice(0, 10).map((x) => x[2] || x[1]));

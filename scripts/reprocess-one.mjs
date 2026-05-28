import fs from "node:fs";
import path from "node:path";
import { applyLogoTreatment } from "./logo-process.mjs";
import { TAIYORO_LOGOS } from "./team-logo-urls.mjs";

const slug = process.argv[2];
const treatmentArg = process.argv[3];
const imageUrl = process.argv[4];

if (!slug) {
  console.error("Uso: node scripts/reprocess-one.mjs <slug> [treatment] [url]");
  process.exit(1);
}

async function main() {
  let raw = null;
  if (imageUrl) {
    const res = await fetch(imageUrl, { headers: { "User-Agent": "BrawlForge/1.0" } });
    if (!res.ok) throw new Error("fetch fail");
    raw = Buffer.from(await res.arrayBuffer());
  } else if (TAIYORO_LOGOS[slug]) {
    const res = await fetch(TAIYORO_LOGOS[slug], { headers: { "User-Agent": "BrawlForge/1.0" } });
    raw = Buffer.from(await res.arrayBuffer());
  } else {
    const local = path.join("public", "logos", "teams", `${slug}.png`);
    if (fs.existsSync(local)) raw = fs.readFileSync(local);
  }
  if (!raw) throw new Error("no source");

  const treatment =
    treatmentArg && !treatmentArg.startsWith("http") ? treatmentArg : undefined;
  const png = await applyLogoTreatment(raw, slug, treatment);
  const dest = path.join("public", "logos", "teams", `${slug}.png`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, png);
  console.log("ok", png.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

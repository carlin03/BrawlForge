import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const src = path.join(root, "public/logos/teams/bc-predictions.webp");
const meta = await sharp(src).metadata();
console.log("predictions image:", meta.width, "x", meta.height);

// Try common logo crop regions on predictions banner (901x507)
const crops = [
  { name: "ace-xero-a", left: 40, top: 120, width: 80, height: 80 },
  { name: "ace-xero-b", left: 120, top: 200, width: 100, height: 100 },
  { name: "ace-xero-c", left: 200, top: 80, width: 90, height: 90 },
  { name: "ace-xero-d", left: 350, top: 150, width: 90, height: 90 },
];

for (const c of crops) {
  const out = path.join(root, "public/logos/teams", `crop-${c.name}.png`);
  await sharp(src).extract(c).png().toFile(out);
  console.log("wrote", out);
}

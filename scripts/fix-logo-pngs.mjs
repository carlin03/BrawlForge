/**
 * Convierte logos .png que en realidad son JPEG/WebP/GIF a PNG válidos.
 * Run: npm run logos:fix
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function isValidPng(buf, min = 800) {
  return buf.length >= min && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
}

async function fixDir(dir, minBytes = 800) {
  const sharp = (await import("sharp")).default;
  let fixed = 0;
  let removed = 0;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".png")) continue;
    const p = path.join(dir, f);
    const buf = fs.readFileSync(p);
    if (f === ".png" || f.length < 6) {
      fs.unlinkSync(p);
      removed++;
      continue;
    }
    if (isValidPng(buf, minBytes)) continue;
    try {
      const out = await sharp(buf).png().toBuffer();
      if (out.length >= minBytes) {
        fs.writeFileSync(p, out);
        fixed++;
        console.log("fixed", f, buf.length, "->", out.length);
      }
    } catch (e) {
      console.warn("skip", f, e.message);
    }
  }
  return { fixed, removed };
}

const teams = await fixDir(path.join(root, "public", "logos", "teams"));
const tournaments = await fixDir(path.join(root, "public", "logos", "tournaments"), 400);
console.log("done", { teams, tournaments });

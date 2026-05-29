/**
 * Genera favicon / apple-touch-icon desde el SVG de marca.
 * npm run favicon:gen
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Misma estrella rosa que BrandMark (sin gradiente: se lee bien en pestaña pequeña). */
const BRAND_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">
  <rect width="40" height="40" rx="10" fill="#151C2C"/>
  <path d="M20 5L24.5 15.5H36L27 21.5L30 33L20 27L10 33L13 21.5L4 15.5H15.5L20 5Z" fill="#FF4D5A"/>
</svg>`;

const svgBuf = Buffer.from(BRAND_ICON_SVG);

const outputs = [
  { path: "src/app/icon.png", size: 32 },
  { path: "src/app/apple-icon.png", size: 180 },
  { path: "public/favicon-32x32.png", size: 32 },
  { path: "public/favicon-16x16.png", size: 16 },
  { path: "public/apple-touch-icon.png", size: 180 },
];

async function writePng(rel, size) {
  const out = path.join(root, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp(svgBuf).resize(size, size).png().toFile(out);
  console.log(`✓ ${rel} (${size}×${size})`);
}

fs.writeFileSync(path.join(root, "public", "favicon.svg"), BRAND_ICON_SVG);
fs.writeFileSync(path.join(root, "src", "app", "icon.svg"), BRAND_ICON_SVG);
console.log("✓ public/favicon.svg");
console.log("✓ src/app/icon.svg");

for (const { path: rel, size } of outputs) {
  await writePng(rel, size);
}

// favicon.ico (16 + 32) para pestaña en Windows / navegadores legacy
const ico16 = await sharp(svgBuf).resize(16, 16).png().toBuffer();
const ico32 = await sharp(svgBuf).resize(32, 32).png().toBuffer();
const { default: pngToIco } = await import("to-ico");
const ico = await pngToIco([ico16, ico32]);
fs.writeFileSync(path.join(root, "public", "favicon.ico"), ico);
console.log("✓ public/favicon.ico");

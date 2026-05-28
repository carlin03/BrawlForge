import { getLogoTreatment } from "./logo-branding.mjs";

const sharp = (await import("sharp")).default;

const WHITE_HI = 248;
const WHITE_BG = 242;
const DARK_MAX = 175;

/** Solo margen exterior (~5%) */
export async function borderOnly(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const mx = Math.max(2, Math.floor(width * 0.05));
  const my = Math.max(2, Math.floor(height * 0.05));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const onBorder = x < mx || x >= width - mx || y < my || y >= height - my;
      if (!onBorder) continue;
      const i = (y * width + x) * channels;
      if (data[i] >= WHITE_HI && data[i + 1] >= WHITE_HI && data[i + 2] >= WHITE_HI) {
        data[i + 3] = 0;
      }
    }
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

/** Todo blanco → transparente, conserva color del logo */
export async function stripWhite(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (data[i] >= WHITE_BG && data[i + 1] >= WHITE_BG && data[i + 2] >= WHITE_BG) {
        data[i + 3] = 0;
      }
    }
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

/** Fondo blanco fuera + arte oscuro/gris → blanco sólido */
export async function monoWhite(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = (r + g + b) / 3;

      if (r >= WHITE_BG && g >= WHITE_BG && b >= WHITE_BG) {
        data[i + 3] = 0;
        continue;
      }

      if (lum <= DARK_MAX) {
        const strength = Math.round(255 - (lum / DARK_MAX) * 40);
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = Math.min(255, Math.max(90, strength));
      }
    }
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

export async function applyLogoTreatment(buf, slug, overrideTreatment) {
  const treatment = overrideTreatment ?? getLogoTreatment(slug);
  let out = buf;
  if (treatment === "border-only") out = await borderOnly(buf);
  else if (treatment === "strip-white") out = await stripWhite(buf);
  else if (treatment === "mono-white") out = await monoWhite(buf);

  return sharp(out)
    .resize(256, 256, { fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

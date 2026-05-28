/** Genera PNG de escudo (sin texto) para equipos/torneos sin logo real. */

function slugHue(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function shieldSvg(slug: string, size = 256): string {
  const hue = slugHue(slug);
  const hue2 = (hue + 42) % 360;
  const fill = `hsl(${hue} 58% 42%)`;
  const accent = `hsl(${hue2} 70% 58%)`;
  const mid = size / 2;
  const shield = `
    M ${mid} ${size * 0.08}
    L ${size * 0.88} ${size * 0.22}
    L ${size * 0.78} ${size * 0.82}
    L ${mid} ${size * 0.94}
    L ${size * 0.22} ${size * 0.82}
    L ${size * 0.12} ${size * 0.22} Z`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${fill}"/>
        <stop offset="100%" stop-color="${accent}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" rx="18" fill="#0f141f"/>
    <path d="${shield.trim()}" fill="url(#g)" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
    <circle cx="${mid}" cy="${mid * 0.95}" r="${size * 0.12}" fill="rgba(255,255,255,0.2)"/>
  </svg>`;
}

export async function renderShieldPng(slug: string, size = 256): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return Buffer.from(await sharp(Buffer.from(shieldSvg(slug, size))).png().toBuffer());
}

export function isValidPngBuffer(buf: Buffer, minBytes = 800): boolean {
  return buf.length >= minBytes && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
}

import fs from "node:fs";
import path from "node:path";
import { getTournamentLogoFilename, liquipediaCommonsUrl } from "@/lib/data/tournament-logos";

const ROOT = process.cwd();
const TOURNAMENTS_DIR = path.join(ROOT, "public", "logos", "tournaments");

async function fetchImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "BrawlForge/1.0" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > 400 ? buf : null;
  } catch {
    return null;
  }
}

async function toPng(buf: Buffer): Promise<Buffer> {
  if (buf[0] === 0x89 && buf[1] === 0x50) return buf;
  const sharp = (await import("sharp")).default;
  return Buffer.from(await sharp(buf).png().toBuffer());
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const localPath = path.join(TOURNAMENTS_DIR, `${slug}.png`);

  if (fs.existsSync(localPath)) {
    const buf = fs.readFileSync(localPath);
    if (buf.length > 400 && buf[0] === 0x89) {
      return new Response(new Uint8Array(buf), {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    }
  }

  const logoFile = getTournamentLogoFilename(slug);
  if (!logoFile) {
    return new Response("Logo not found", { status: 404 });
  }

  const commons = liquipediaCommonsUrl(logoFile);
  let buf = commons ? await fetchImage(commons) : null;

  if (!buf) {
    const apiUrl = `https://liquipedia.net/brawlstars/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=File:${encodeURIComponent(logoFile.replace(/ /g, "_"))}`;
    try {
      const res = await fetch(apiUrl, { headers: { "User-Agent": "BrawlForge/1.0" } });
      const data = await res.json();
      const page = Object.values(data.query?.pages ?? {})[0] as { imageinfo?: { url: string }[] };
      const direct = page?.imageinfo?.[0]?.url;
      if (direct) buf = await fetchImage(direct);
    } catch {
      /* fall through */
    }
  }

  if (!buf) {
    return new Response("Upstream logo fetch failed", { status: 502 });
  }

  let png: Buffer;
  try {
    png = await toPng(buf);
  } catch {
    return new Response("Invalid image", { status: 502 });
  }

  fs.mkdirSync(TOURNAMENTS_DIR, { recursive: true });
  fs.writeFileSync(localPath, png);

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}

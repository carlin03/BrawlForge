import fs from "node:fs";
import path from "node:path";
import { buildRemoteLogoChain } from "@/lib/data/team-logo-urls";
import { getGeneratedTeams } from "@/lib/data/catalog";
import { liquipediaCommonsUrl } from "@/lib/data/tournament-logos";

const ROOT = process.cwd();
const TEAMS_DIR = path.join(ROOT, "public", "logos", "teams");

async function resolveLiquipediaApiUrl(logoFile: string): Promise<string | null> {
  const title = `File:${logoFile.replace(/ /g, "_")}`;
  const apiUrl = `https://liquipedia.net/brawlstars/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(title)}`;
  const res = await fetch(apiUrl, { headers: { "User-Agent": "BrawlForge/1.0" } });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    query?: { pages?: Record<string, { imageinfo?: { url: string }[] }> };
  };
  const page = Object.values(data.query?.pages ?? {})[0];
  return page?.imageinfo?.[0]?.url ?? null;
}

function teamRemoteChain(slug: string): string[] {
  const team = getGeneratedTeams().find((t) => t.slug === slug);
  const chain = [...buildRemoteLogoChain(slug)];
  if (team?.logoFile) {
    const commons = liquipediaCommonsUrl(team.logoFile);
    if (commons && !chain.includes(commons)) chain.unshift(commons);
  }
  return [...new Set(chain)];
}

async function fetchRemoteLogo(url: string): Promise<Buffer | null> {
  const res = await fetch(url, {
    headers: { "User-Agent": "BrawlForge/1.0" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 500) return null;

  if (buf[0] === 0x89 && buf[1] === 0x50) return buf;

  try {
    const sharp = (await import("sharp")).default;
    return Buffer.from(await sharp(buf).png().toBuffer());
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const localPath = path.join(TEAMS_DIR, `${slug}.png`);

  if (fs.existsSync(localPath)) {
    const buf = fs.readFileSync(localPath);
    if (buf.length > 500 && buf[0] === 0x89) {
      return new Response(new Uint8Array(buf), {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    }
  }

  const team = getGeneratedTeams().find((t) => t.slug === slug);
  const chain = teamRemoteChain(slug);
  if (team?.logoFile) {
    const apiDirect = await resolveLiquipediaApiUrl(team.logoFile);
    if (apiDirect) chain.unshift(apiDirect);
  }

  let png: Buffer | null = null;
  for (const remote of chain) {
    png = await fetchRemoteLogo(remote);
    if (png) break;
  }

  if (!png) {
    return new Response("Logo not found", { status: 404 });
  }

  fs.mkdirSync(TEAMS_DIR, { recursive: true });
  fs.writeFileSync(localPath, png);

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}

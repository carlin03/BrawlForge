import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { TAIYORO_LOGOS } from "@/lib/data/team-logo-urls";
import type { LogoTreatment } from "@/lib/data/logo-branding";

const UA = { "User-Agent": "BrawlForge/1.0" };

async function loadLogoProcessor() {
  const modPath = pathToFileURL(path.join(process.cwd(), "scripts", "logo-process.mjs")).href;
  return import(modPath) as Promise<{
    applyLogoTreatment: (buf: Buffer, slug: string, override?: string) => Promise<Buffer>;
  }>;
}

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`No se pudo descargar la imagen (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

export async function fetchTeamLogoSource(
  root: string,
  slug: string,
  imageUrl?: string,
): Promise<Buffer> {
  if (imageUrl?.trim()) return downloadImage(imageUrl.trim());

  if (TAIYORO_LOGOS[slug]) return downloadImage(TAIYORO_LOGOS[slug]);

  const local = path.join(root, "public", "logos", "teams", `${slug}.png`);
  if (fs.existsSync(local)) return fs.readFileSync(local);

  throw new Error("Pega una URL de imagen o elige un club con logo en el servidor.");
}

async function processBuffer(
  raw: Buffer,
  slug: string,
  treatment: LogoTreatment,
): Promise<Buffer> {
  try {
    const { applyLogoTreatment } = await loadLogoProcessor();
    return await applyLogoTreatment(raw, slug, treatment);
  } catch {
    return raw;
  }
}

export async function writeProcessedTeamLogo(
  root: string,
  slug: string,
  treatment: LogoTreatment,
  imageUrl?: string,
): Promise<{ bytes: number; publicPath: string; processed: boolean }> {
  const raw = await fetchTeamLogoSource(root, slug, imageUrl);
  const png = await processBuffer(raw, slug, treatment);

  const dest = path.join(root, "public", "logos", "teams", `${slug}.png`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, png);

  return {
    bytes: png.length,
    publicPath: `/logos/teams/${slug}.png`,
    processed: png.length !== raw.length || png !== raw,
  };
}

export function bumpTeamLogoManifest(root: string, slug: string): string {
  const manifestPath = path.join(root, "src", "lib", "data", "generated", "logo-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
    processedTeamLogos?: string[];
    taiyoroLocal?: string[];
    logoCacheVersion?: number;
  };
  const set = new Set(manifest.processedTeamLogos ?? manifest.taiyoroLocal ?? []);
  set.add(slug);
  manifest.processedTeamLogos = [...set].sort();
  manifest.taiyoroLocal = manifest.processedTeamLogos;
  manifest.logoCacheVersion = Date.now();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return String(manifest.logoCacheVersion);
}

export function writeLogoOverrides(
  root: string,
  overrides: {
    teams: Record<string, { url?: string; treatment?: string }>;
    tournaments: Record<string, { url?: string }>;
  },
): void {
  const overridesPath = path.join(root, "src", "lib", "data", "generated", "logo-overrides.json");
  fs.mkdirSync(path.dirname(overridesPath), { recursive: true });
  fs.writeFileSync(overridesPath, JSON.stringify(overrides, null, 2));
}

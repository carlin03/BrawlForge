import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";
import type { LogoOverridesFile } from "@/lib/data/logo-overrides";
import { LOGO_CACHE_VERSION } from "@/lib/data/logo-manifest";
import {
  bundledLogoOverrides,
  mergeLogoOverridesFile,
  shouldApplyDbLogoUrl,
} from "@/lib/logo-config-merge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function readOverridesFromDisk(root: string): LogoOverridesFile | null {
  const p = path.join(root, "src", "lib", "data", "generated", "logo-overrides.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as LogoOverridesFile;
  } catch {
    return null;
  }
}

function readCacheVersionFromDisk(root: string): string | null {
  const p = path.join(root, "src", "lib", "data", "generated", "logo-manifest.json");
  if (!fs.existsSync(p)) return null;
  try {
    const m = JSON.parse(fs.readFileSync(p, "utf8")) as { logoCacheVersion?: number; generatedAt?: string };
    return String(m.logoCacheVersion ?? m.generatedAt ?? "");
  } catch {
    return null;
  }
}

/** Overrides: JSON empaquetado (CDN) + disco + Supabase sin pisar URLs buenas. */
export async function GET() {
  const root = process.cwd();
  let overrides = bundledLogoOverrides();
  const disk = readOverridesFromDisk(root);
  if (disk) overrides = mergeLogoOverridesFile(overrides, disk);

  let cacheVersion = readCacheVersionFromDisk(root) || LOGO_CACHE_VERSION;

  const supabase = await createClient();
  if (supabase) {
    const [catalogTeamsRes, teamsRes, toursRes] = await Promise.all([
      supabase.from("teams_catalog").select("slug, logo_url").not("logo_url", "is", null),
      supabase.from("team_logo_overrides").select("slug, public_url, treatment, updated_at"),
      supabase.from("tournament_logo_overrides").select("slug, public_url, updated_at"),
    ]);

    for (const row of catalogTeamsRes.data ?? []) {
      if (!row.slug || !row.logo_url) continue;
      const url = String(row.logo_url).split("?")[0];
      const prev = overrides.teams[row.slug]?.url;
      if (shouldApplyDbLogoUrl(prev, url)) {
        overrides.teams[row.slug] = { url, customOnly: true, treatment: "raw" };
      }
    }

    for (const row of teamsRes.data ?? []) {
      if (!row.slug || !row.public_url) continue;
      const url = String(row.public_url).split("?")[0];
      const prev = overrides.teams[row.slug]?.url;
      if (shouldApplyDbLogoUrl(prev, url)) {
        overrides.teams[row.slug] = { url, customOnly: true, treatment: "raw" };
      }
    }

    for (const row of toursRes.data ?? []) {
      if (!row.slug || !row.public_url) continue;
      const url = String(row.public_url).split("?")[0];
      const prev = overrides.tournaments[row.slug]?.url;
      if (shouldApplyDbLogoUrl(prev, url)) {
        overrides.tournaments[row.slug] = { url };
      }
    }

    const latest = [...(teamsRes.data ?? []), ...(toursRes.data ?? [])]
      .map((r) => (r as { updated_at?: string }).updated_at)
      .filter(Boolean)
      .sort()
      .pop();
    if (latest) cacheVersion = String(new Date(latest).getTime());
  }

  return NextResponse.json({
    cacheVersion,
    overrides,
    teamCount: Object.keys(overrides.teams).length,
    at: Date.now(),
  });
}

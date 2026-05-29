import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";
import type { LogoOverridesFile } from "@/lib/data/logo-overrides";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function readOverrides(root: string): LogoOverridesFile {
  const p = path.join(root, "src", "lib", "data", "generated", "logo-overrides.json");
  if (!fs.existsSync(p)) return { teams: {}, tournaments: {} };
  return JSON.parse(fs.readFileSync(p, "utf8")) as LogoOverridesFile;
}

function readCacheVersion(root: string): string {
  const p = path.join(root, "src", "lib", "data", "generated", "logo-manifest.json");
  if (!fs.existsSync(p)) return String(Date.now());
  const m = JSON.parse(fs.readFileSync(p, "utf8")) as { logoCacheVersion?: number; generatedAt?: string };
  return String(m.logoCacheVersion ?? m.generatedAt ?? Date.now());
}

/** Overrides + versión de caché en tiempo real (no el JSON empaquetado en build). */
export async function GET() {
  const root = process.cwd();
  const overrides = readOverrides(root);
  let cacheVersion = readCacheVersion(root);

  const supabase = await createClient();
  if (supabase) {
    const [catalogTeamsRes, teamsRes, toursRes] = await Promise.all([
      supabase.from("teams_catalog").select("slug, logo_url").not("logo_url", "is", null),
      supabase.from("team_logo_overrides").select("slug, public_url, treatment"),
      supabase.from("tournament_logo_overrides").select("slug, public_url"),
    ]);

    for (const row of catalogTeamsRes.data ?? []) {
      if (!row.slug || !row.logo_url) continue;
      const url = String(row.logo_url).split("?")[0];
      if (!overrides.teams[row.slug]?.url) {
        overrides.teams[row.slug] = { url, treatment: "strip-white" };
      }
    }

    for (const row of teamsRes.data ?? []) {
      if (!row.slug || !row.public_url) continue;
      overrides.teams[row.slug] = {
        url: row.public_url.split("?")[0],
        treatment: row.treatment ?? "strip-white",
      };
    }
    for (const row of toursRes.data ?? []) {
      if (!row.slug || !row.public_url) continue;
      overrides.tournaments[row.slug] = { url: row.public_url.split("?")[0] };
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
    at: Date.now(),
  });
}

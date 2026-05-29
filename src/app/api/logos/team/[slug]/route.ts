import { NextResponse } from "next/server";
import { resolveTeamLogoSlug } from "@/lib/data/png-logo-urls";
import { isValidLogoSlug } from "@/lib/data/logo-slugs";
import { defaultTeamLogoConfig, fetchFirstTeamLogo } from "@/lib/team-logo-server";
import { createClient } from "@/lib/supabase/server";
import { bundledLogoOverrides, shouldApplyDbLogoUrl } from "@/lib/logo-config-merge";
import type { LogoOverridesFile } from "@/lib/data/logo-overrides";
import { LOGO_CACHE_VERSION } from "@/lib/data/logo-manifest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadRuntimeOverrides(): Promise<LogoOverridesFile> {
  const overrides = bundledLogoOverrides();
  const supabase = await createClient();
  if (!supabase) return overrides;

  const [catalogRes, teamsRes] = await Promise.all([
    supabase.from("teams_catalog").select("slug, logo_url").not("logo_url", "is", null),
    supabase.from("team_logo_overrides").select("slug, public_url, treatment"),
  ]);

  for (const row of catalogRes.data ?? []) {
    if (!row.slug || !row.logo_url) continue;
    const url = String(row.logo_url).split("?")[0];
    if (shouldApplyDbLogoUrl(overrides.teams[row.slug]?.url, url)) {
      overrides.teams[row.slug] = { url, customOnly: true, treatment: "raw" };
    }
  }
  for (const row of teamsRes.data ?? []) {
    if (!row.slug || !row.public_url) continue;
    const url = String(row.public_url).split("?")[0];
    if (shouldApplyDbLogoUrl(overrides.teams[row.slug]?.url, url)) {
      overrides.teams[row.slug] = {
        url,
        customOnly: true,
        treatment: row.treatment ?? "raw",
      };
    }
  }
  return overrides;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug: rawSlug } = await context.params;
  const slug = resolveTeamLogoSlug(rawSlug);
  if (!isValidLogoSlug(slug)) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 404 });
  }

  const overrides = await loadRuntimeOverrides();
  const cfg = { cacheVersion: LOGO_CACHE_VERSION, overrides };
  const hit = await fetchFirstTeamLogo(slug, cfg);
  if (!hit) {
    return NextResponse.json({ error: "logo_not_found" }, { status: 404 });
  }

  return new NextResponse(hit.body, {
    headers: {
      "Content-Type": hit.contentType,
      "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
    },
  });
}

import { NextResponse } from "next/server";
import { isValidLogoSlug } from "@/lib/data/logo-slugs";
import { defaultTeamLogoConfig, fetchFirstTeamLogo } from "@/lib/team-logo-server";
import { createClient } from "@/lib/supabase/server";
import { bundledLogoOverrides, pickNewerTeamLogoUrl, shouldApplyDbLogoUrl } from "@/lib/logo-config-merge";
import type { LogoOverridesFile } from "@/lib/data/logo-overrides";
import { isHiddenTeamSlug } from "@/lib/data/blocked-team-slugs";
import { LOGO_CACHE_VERSION } from "@/lib/data/logo-manifest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadRuntimeOverrides(): Promise<LogoOverridesFile> {
  const overrides = bundledLogoOverrides();
  const supabase = await createClient();
  if (!supabase) return overrides;

  const [catalogRes, teamsRes] = await Promise.all([
    supabase.from("teams_catalog").select("slug, logo_url, synced_at").not("logo_url", "is", null),
    supabase.from("team_logo_overrides").select("slug, public_url, treatment, updated_at"),
  ]);

  const catalogBySlug = new Map((catalogRes.data ?? []).map((r) => [String(r.slug), r] as const));
  const overrideBySlug = new Map((teamsRes.data ?? []).map((r) => [String(r.slug), r] as const));
  const allSlugs = new Set([...catalogBySlug.keys(), ...overrideBySlug.keys()]);

  for (const slug of allSlugs) {
    if (isHiddenTeamSlug(slug)) continue;
    const cat = catalogBySlug.get(slug);
    const ov = overrideBySlug.get(slug);
    const url = pickNewerTeamLogoUrl(
      cat?.logo_url ? String(cat.logo_url) : null,
      cat?.synced_at ? String(cat.synced_at) : null,
      ov?.public_url ? String(ov.public_url) : null,
      ov?.updated_at ? String(ov.updated_at) : null,
    );
    if (!url) continue;
    const clean = url.split("?")[0];
    if (shouldApplyDbLogoUrl(overrides.teams[slug]?.url, clean)) {
      overrides.teams[slug] = {
        url: clean,
        customOnly: true,
        treatment: (ov?.treatment as string) || "raw",
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
  const key = String(rawSlug).trim().toLowerCase();
  if (isHiddenTeamSlug(key) || !isValidLogoSlug(key)) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 404 });
  }

  try {
    const overrides = await loadRuntimeOverrides();
    const cfg = { cacheVersion: LOGO_CACHE_VERSION, overrides };

    const hit = await fetchFirstTeamLogo(key, cfg);
    if (!hit) {
      return NextResponse.json({ error: "logo_not_found" }, { status: 404 });
    }

    return new NextResponse(hit.body, {
      headers: {
        "Content-Type": hit.contentType,
        "Cache-Control": "private, no-store, must-revalidate",
      },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "logo_fetch_failed";
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}

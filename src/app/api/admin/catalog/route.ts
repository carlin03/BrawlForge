import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logCmsAudit } from "@/lib/cms/audit";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { teams, getTeam } from "@/lib/data/teams";
import { players, getPlayer } from "@/lib/data/players";
import {
  BSC_2026_ADMIN_TEAM_COUNT,
  mergeAdminTeamRows,
} from "@/lib/data/admin-bsc-teams";
import { mergeAdminPlayerRows } from "@/lib/data/admin-bsc-players";
import {
  buildPlayerMeta,
  buildTeamMeta,
  parseAchievements,
  parsePlayerMeta,
  parseSocial,
  parseTeamMeta,
  pruneSocial,
} from "@/lib/data/profile-wiki";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "all";
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      source: "local",
      teams: mergeAdminTeamRows(null),
      teamCount: BSC_2026_ADMIN_TEAM_COUNT,
      players: mergeAdminPlayerRows(null),
      news: [],
    });
  }

  const out: Record<string, unknown> = { ok: true, source: "supabase" };

  if (type === "all" || type === "teams") {
    const { data, error } = await supabase.from("teams_catalog").select("*").order("rank", { ascending: true });
    if (error && error.code !== "42P01") return NextResponse.json({ error: error.message }, { status: 500 });
    out.teams = mergeAdminTeamRows(data?.length ? data : null);
    out.teamCount = BSC_2026_ADMIN_TEAM_COUNT;
  }

  if (type === "all" || type === "players") {
    const { data, error } = await supabase.from("players_catalog").select("*").order("fantasy_points", { ascending: false });
    if (error && error.code !== "42P01") return NextResponse.json({ error: error.message }, { status: 500 });
    out.players = mergeAdminPlayerRows(data?.length ? data : null);
  }

  if (type === "all" || type === "news") {
    const { data, error } = await supabase.from("news_catalog").select("*").order("published_at", { ascending: false });
    if (error && error.code !== "42P01") return NextResponse.json({ error: error.message }, { status: 500 });
    out.news = data ?? [];
  }

  return NextResponse.json(out);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const body = await request.json();
  const entity = String(body.entity || "");
  const row = body.row as Record<string, unknown>;

  if (!row?.slug) {
    return NextResponse.json({ error: "Falta slug" }, { status: 400 });
  }

  const syncedAt = new Date().toISOString();

  if (entity === "team") {
    const profile = parseTeamMeta(row.profile ?? row.meta ?? {});
    const achievements = parseAchievements(row.achievements ?? []);
    const social = pruneSocial(parseSocial(row.social ?? {}));
    const coach = row.coach ? String(row.coach) : null;
    const payload = {
      slug: String(row.slug),
      name: String(row.name ?? getTeam(String(row.slug))?.name ?? row.slug),
      tag: String(row.tag ?? ""),
      region: String(row.region ?? "GLOBAL"),
      country: String(row.country ?? ""),
      earnings: Number(row.earnings ?? 0),
      rank: row.rank != null ? Number(row.rank) : null,
      rank_change: Number(row.rank_change ?? 0),
      form: Array.isArray(row.form) ? row.form : String(row.form ?? "").split(",").map((s) => s.trim()).filter(Boolean),
      roster_slugs: Array.isArray(row.roster_slugs)
        ? row.roster_slugs
        : String(row.roster_slugs ?? "").split(",").map((s) => s.trim()).filter(Boolean),
      logo_url: row.logo_url ? String(row.logo_url) : null,
      description: row.description ? String(row.description) : null,
      liquipedia_page: row.liquipedia_page ? String(row.liquipedia_page) : null,
      liquipedia_url: row.liquipedia_url ? String(row.liquipedia_url) : null,
      coach,
      founded_year: row.founded_year != null && row.founded_year !== "" ? Number(row.founded_year) : null,
      headquarters: row.headquarters ? String(row.headquarters) : null,
      website: row.website ? String(row.website) : null,
      circuit_status: String(row.circuit_status ?? "active"),
      bsc_qualified_2026: row.bsc_qualified_2026 !== false,
      circuit_summary: row.circuit_summary ? String(row.circuit_summary) : null,
      achievements,
      social,
      meta: buildTeamMeta(profile, { coach }),
      synced_at: syncedAt,
    };
    const { error } = await supabase.from("teams_catalog").upsert(payload);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logCmsAudit({
      action: "catalog.upsert",
      entityType: "team",
      entityId: payload.slug,
      diff: { name: payload.name },
    });
    return NextResponse.json({ ok: true, message: `Equipo ${payload.name} guardado` });
  }

  if (entity === "player") {
    const p = getPlayer(String(row.slug));
    const profile = parsePlayerMeta(row.profile ?? row.meta ?? {});
    const photoUrl = row.photo_url ? String(row.photo_url).trim() : null;
    const mains = profile.main_brawlers ?? [];
    const payload = {
      slug: String(row.slug),
      ign: String(row.ign ?? p?.ign ?? row.slug),
      real_name: row.real_name ? String(row.real_name) : null,
      team_slug: row.team_slug ? String(row.team_slug) : null,
      region: String(row.region ?? p?.region ?? "GLOBAL"),
      role: String(row.role ?? "Player"),
      status: String(row.status ?? "active"),
      fantasy_points: Number(row.fantasy_points ?? p?.fantasyPoints ?? 70),
      fantasy_ownership: Number(row.fantasy_ownership ?? p?.fantasyOwnership ?? 30),
      rating: Number(row.rating ?? p?.rating ?? 1),
      bio: row.bio ? String(row.bio) : null,
      photo_url: photoUrl,
      liquipedia_page: row.liquipedia_page ? String(row.liquipedia_page) : null,
      liquipedia_url: row.liquipedia_url ? String(row.liquipedia_url) : null,
      country: row.country ? String(row.country) : null,
      nationality: row.nationality ? String(row.nationality) : null,
      join_date: row.join_date ? String(row.join_date) : null,
      primary_brawler: row.primary_brawler
        ? String(row.primary_brawler)
        : mains[0]
          ? String(mains[0])
          : null,
      secondary_brawler: row.secondary_brawler
        ? String(row.secondary_brawler)
        : mains[1]
          ? String(mains[1])
          : null,
      is_captain: Boolean(row.is_captain),
      previous_teams: Array.isArray(row.previous_teams)
        ? row.previous_teams
        : String(row.previous_teams ?? "")
            .split(/[|,]/)
            .map((s) => s.trim())
            .filter(Boolean),
      social: pruneSocial(parseSocial(row.social ?? {})),
      meta: buildPlayerMeta(profile, photoUrl),
      synced_at: syncedAt,
    };
    let { error } = await supabase.from("players_catalog").upsert(payload);
    if (error?.message?.includes("photo_url")) {
      const { photo_url: _p, ...withoutPhoto } = payload;
      ({ error } = await supabase.from("players_catalog").upsert({
        ...withoutPhoto,
        meta: payload.photo_url ? { photo_url: payload.photo_url } : {},
      }));
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logCmsAudit({
      action: "catalog.upsert",
      entityType: "player",
      entityId: payload.slug,
      diff: { ign: payload.ign },
    });
    return NextResponse.json({ ok: true, message: `Jugador ${payload.ign} guardado` });
  }

  if (entity === "news") {
    const payload = {
      slug: String(row.slug),
      title: String(row.title ?? ""),
      excerpt: String(row.excerpt ?? ""),
      body: Array.isArray(row.body) ? row.body : String(row.body ?? "").split("\n").filter(Boolean),
      category: String(row.category ?? "Esports"),
      published_at: row.published_at ? String(row.published_at) : null,
      author: String(row.author ?? "BrawlForge"),
      read_minutes: Number(row.read_minutes ?? 3),
      cover_accent: String(row.cover_accent ?? "gold"),
      related_teams: Array.isArray(row.related_teams)
        ? row.related_teams
        : String(row.related_teams ?? "").split(",").map((s) => s.trim()).filter(Boolean),
      related_tournament: row.related_tournament ? String(row.related_tournament) : null,
      hot: Boolean(row.hot),
      updated_at: syncedAt,
    };
    const { error } = await supabase.from("news_catalog").upsert(payload);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logCmsAudit({
      action: "catalog.upsert",
      entityType: "news",
      entityId: payload.slug,
      diff: { title: payload.title },
    });
    return NextResponse.json({ ok: true, message: `Noticia ${payload.slug} guardada` });
  }

  return NextResponse.json({ error: "entity debe ser team | player | news" }, { status: 400 });
}

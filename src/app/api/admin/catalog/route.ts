import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logCmsAudit } from "@/lib/cms/audit";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { mergeAdminTournamentRows } from "@/lib/data/admin-tournaments";
import {
  mergeCardThemeIntoMeta,
  parseCardThemeMeta,
} from "@/lib/data/card-theme-meta";
import {
  listMergedPlayers,
  upsertPlayer,
  deletePlayer,
} from "@/lib/services/catalog/players-catalog-svc";
import {
  listMergedTeams,
  upsertTeam,
  deleteTeam,
} from "@/lib/services/catalog/teams-catalog-svc";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "all";
  const supabase = await createClient();

  const out: Record<string, unknown> = { ok: true };

  try {
    if (type === "all" || type === "teams") {
      const teamsResult = await listMergedTeams(supabase);
      out.source = teamsResult.source;
      out.teams = teamsResult.teams;
      out.teamCount = teamsResult.teamCount;
    }

    if (type === "all" || type === "players") {
      const playersResult = await listMergedPlayers(supabase);
      out.source = out.source ?? playersResult.source;
      out.players = playersResult.players;
    }

    if (!supabase) {
      if (type === "all" || type === "tournaments") {
        out.tournaments = mergeAdminTournamentRows(null);
      }
      if (type === "all" || type === "news") out.news = [];
      return NextResponse.json(out);
    }

    if (type === "all" || type === "tournaments") {
      const { data, error } = await supabase
        .from("tournaments_catalog")
        .select("*")
        .order("name", { ascending: true });
      if (error && error.code !== "42P01") {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      out.tournaments = mergeAdminTournamentRows(data?.length ? data : null);
    }

    if (type === "all" || type === "news") {
      const { data, error } = await supabase
        .from("news_catalog")
        .select("*")
        .order("published_at", { ascending: false });
      if (error && error.code !== "42P01") {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      out.news = data ?? [];
    }

    out.source = "supabase";
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const entity = searchParams.get("entity");
  const slug = String(searchParams.get("slug") ?? "").trim().toLowerCase();
  if (!entity || !slug) {
    return NextResponse.json({ error: "Faltan entity y slug" }, { status: 400 });
  }

  try {
    if (entity === "team") {
      const result = await deleteTeam(supabase, slug);
      return NextResponse.json({ ok: true, ...result });
    }
    if (entity === "player") {
      const result = await deletePlayer(supabase, slug);
      return NextResponse.json({ ok: true, ...result });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }

  const table =
    entity === "tournament"
      ? "tournaments_catalog"
      : entity === "news"
        ? "news_catalog"
        : null;

  if (!table) {
    return NextResponse.json({ error: "entity inválida" }, { status: 400 });
  }

  const { error } = await supabase.from(table).delete().eq("slug", slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logCmsAudit({
    action: "catalog.delete",
    entityType: entity,
    entityId: slug,
  });

  return NextResponse.json({ ok: true, message: `${slug} eliminado del catálogo` });
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

  try {
    if (entity === "team") {
      const result = await upsertTeam(supabase, row);
      return NextResponse.json({ ok: true, ...result });
    }
    if (entity === "player") {
      const result = await upsertPlayer(supabase, row);
      return NextResponse.json({ ok: true, ...result });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }

  if (entity === "tournament") {
    const rawMeta =
      row.meta && typeof row.meta === "object" && !Array.isArray(row.meta)
        ? (row.meta as Record<string, unknown>)
        : {};
    const participants = row.participant_slugs;
    const payload = {
      slug: String(row.slug),
      name: String(row.name ?? row.slug),
      short_name: row.short_name ? String(row.short_name) : null,
      region: String(row.region ?? "GLOBAL"),
      prize_pool: row.prize_pool ? String(row.prize_pool) : null,
      teams_count: Number(row.teams_count ?? 0),
      status: String(row.status ?? "upcoming"),
      start_date: row.start_date ? String(row.start_date) : null,
      end_date: row.end_date ? String(row.end_date) : null,
      location: row.location ? String(row.location) : null,
      stage: row.stage ? String(row.stage) : null,
      tier: row.tier != null && row.tier !== "" ? Number(row.tier) : null,
      logo_url: row.logo_url ? String(row.logo_url) : null,
      participant_slugs: Array.isArray(participants)
        ? participants
        : String(participants ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
      meta: rawMeta,
      synced_at: syncedAt,
    };
    const { error } = await supabase.from("tournaments_catalog").upsert(payload);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logCmsAudit({
      action: "catalog.upsert",
      entityType: "tournament",
      entityId: payload.slug,
      diff: { name: payload.name },
    });
    return NextResponse.json({ ok: true, message: `Torneo ${payload.name} guardado` });
  }

  if (entity === "card_theme") {
    const entityType = String(row.entity_type ?? "team");
    const entitySlug = String(row.entity_slug ?? row.slug ?? "");
    if (!entitySlug) {
      return NextResponse.json({ error: "Falta slug del equipo o jugador" }, { status: 400 });
    }
    const theme = {
      primary: String(row.primary ?? "#ffc82e"),
      secondary: String(row.secondary ?? "#1a1608"),
      glow: String(row.glow ?? "#ffd54f"),
    };
    const table = entityType === "player" ? "players_catalog" : "teams_catalog";
    const { data: existing } = await supabase.from(table).select("meta").eq("slug", entitySlug).maybeSingle();
    const prevMeta =
      existing?.meta && typeof existing.meta === "object"
        ? (existing.meta as Record<string, unknown>)
        : {};
    const meta = mergeCardThemeIntoMeta(prevMeta, theme);
    const { error } = await supabase.from(table).update({ meta, synced_at: syncedAt }).eq("slug", entitySlug);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: `Colores de carta guardados para ${entitySlug}` });
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

  return NextResponse.json(
    {
      error:
        "entity debe ser team | player | tournament | news | card_theme. Equipos/jugadores: prefer /api/admin/teams y /api/admin/players",
    },
    { status: 400 },
  );
}

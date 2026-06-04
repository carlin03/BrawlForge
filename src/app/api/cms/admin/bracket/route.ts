import { NextRequest, NextResponse } from "next/server";
import { auditWrite, getSupabaseAdmin, requireCmsAdmin } from "@/lib/cms/admin-api";
import type { PlayoffBracketConfig, PlayoffBracketsStore } from "@/lib/data/bracket-config";

const SETTINGS_KEY = "playoff_brackets";

export const dynamic = "force-dynamic";

async function loadStore(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseAdmin>>["supabase"]>,
): Promise<PlayoffBracketsStore> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", SETTINGS_KEY).maybeSingle();
  if (!data?.value || typeof data.value !== "object") return {};
  return data.value as PlayoffBracketsStore;
}

export async function GET() {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const brackets = await loadStore(supabase!);
  return NextResponse.json({ ok: true, brackets });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const body = (await request.json()) as { config?: PlayoffBracketConfig };
  const config = body.config;
  if (!config?.tournament_slug) {
    return NextResponse.json({ error: "config.tournament_slug requerido" }, { status: 400 });
  }

  const store = await loadStore(supabase!);
  store[config.tournament_slug] = {
    ...config,
    updated_at: new Date().toISOString(),
  };

  const { error: dbErr } = await supabase!.from("site_settings").upsert(
    {
      key: SETTINGS_KEY,
      value: store,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  await auditWrite("bracket.update", "site_settings", config.tournament_slug);
  return NextResponse.json({ ok: true, config: store[config.tournament_slug] });
}

/** Genera partidos en matches_catalog desde la configuración del bracket. */
export async function POST(request: NextRequest) {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const body = (await request.json()) as { tournament_slug: string; scheduled_at?: string };
  const slug = body.tournament_slug;
  if (!slug) return NextResponse.json({ error: "tournament_slug requerido" }, { status: 400 });

  const store = await loadStore(supabase!);
  const config = store[slug];
  if (!config) return NextResponse.json({ error: "No hay bracket guardado para este torneo" }, { status: 404 });

  const baseDate = body.scheduled_at ? new Date(body.scheduled_at) : new Date();
  const created: string[] = [];
  const format = config.format ?? "Bo5";

  async function createSlot(teamA: string, teamB: string, stage: string, offsetHours: number) {
    if (!teamA || !teamB) return;
    const d = new Date(baseDate.getTime() + offsetHours * 3600000);
    const id = `${teamA}-vs-${teamB}-${d.toISOString().slice(0, 10).replace(/-/g, "")}-${stage}`
      .replace(/[^a-z0-9-]/gi, "-")
      .toLowerCase();
    const payload = {
      id,
      team_a_slug: teamA,
      team_b_slug: teamB,
      tournament_slug: slug,
      scheduled_at: d.toISOString(),
      status: "upcoming",
      stage,
      format,
      score_a: 0,
      score_b: 0,
      published: true,
      meta: {
        importance: "featured",
        schedule_trust: "generated",
        predictions: { winner: true, exact_score: true },
      },
      updated_at: new Date().toISOString(),
    };
    const { error: insErr } = await supabase!.from("matches_catalog").upsert(payload);
    if (!insErr) {
      created.push(id);
      await auditWrite("match.upsert", "match", id);
    }
  }

  let h = 0;
  if (config.rounds.quarters) {
    for (const slot of config.slots.quarters) {
      await createSlot(slot.team_a_slug, slot.team_b_slug, "Quarterfinal", h++);
    }
  }
  if (config.rounds.semis) {
    for (const slot of config.slots.semis) {
      await createSlot(slot.team_a_slug, slot.team_b_slug, "Semifinal", h++);
    }
  }
  if (config.rounds.final && config.slots.final) {
    const f = config.slots.final;
    await createSlot(f.team_a_slug, f.team_b_slug, "Grand Final", h++);
  }
  if (config.rounds.third_place && config.slots.third_place) {
    const t = config.slots.third_place;
    await createSlot(t.team_a_slug, t.team_b_slug, "Third Place Match", h++);
  }

  return NextResponse.json({ ok: true, created, count: created.length });
}

import { NextResponse } from "next/server";
import { DEFAULT_THEME_TOKENS } from "@/lib/cms/defaults";
import { auditWrite, getSupabaseAdmin, requireCmsAdmin } from "@/lib/cms/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const { data: sets } = await supabase!.from("theme_token_sets").select("*").order("id");
  const { data: scopes } = await supabase!.from("theme_token_scopes").select("*").order("priority", { ascending: false });

  return NextResponse.json({ ok: true, sets: sets ?? [], scopes: scopes ?? [], defaults: DEFAULT_THEME_TOKENS });
}

export async function PATCH(request: Request) {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const body = await request.json();
  if (body.tokens && body.id) {
    const { error: dbErr } = await supabase!
      .from("theme_token_sets")
      .update({ tokens: body.tokens, updated_at: new Date().toISOString() })
      .eq("id", body.id);
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    await auditWrite("theme.update", "theme_token_set", body.id);
  }

  return NextResponse.json({ ok: true, message: "Tema actualizado" });
}

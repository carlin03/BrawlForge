import { NextResponse } from "next/server";
import { auditWrite, getSupabaseAdmin, requireCmsAdmin } from "@/lib/cms/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const [{ data: templates }, { data: assignments }] = await Promise.all([
    supabase!.from("card_templates").select("*"),
    supabase!.from("card_template_assignments").select("*").limit(200),
  ]);

  return NextResponse.json({ ok: true, templates: templates ?? [], assignments: assignments ?? [] });
}

export async function PATCH(request: Request) {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const body = await request.json();
  if (body.template) {
    const t = body.template;
    await supabase!.from("card_templates").upsert({
      id: t.id,
      entity_type: t.entity_type,
      name: t.name,
      layout: t.layout ?? {},
      is_default: Boolean(t.is_default),
    });
    await auditWrite("card.template", "card_template", t.id);
  }

  return NextResponse.json({ ok: true, message: "Card template guardado" });
}

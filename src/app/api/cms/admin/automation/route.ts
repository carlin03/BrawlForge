import { NextResponse } from "next/server";
import { auditWrite, getSupabaseAdmin, requireCmsAdmin } from "@/lib/cms/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const [{ data: rules }, { data: jobs }, { data: runs }] = await Promise.all([
    supabase!.from("automation_rules").select("*"),
    supabase!.from("scheduled_jobs").select("*"),
    supabase!.from("automation_runs").select("*").order("started_at", { ascending: false }).limit(30),
  ]);

  return NextResponse.json({ ok: true, rules: rules ?? [], jobs: jobs ?? [], runs: runs ?? [] });
}

export async function PATCH(request: Request) {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const body = await request.json();
  if (body.rule) {
    const r = body.rule;
    await supabase!.from("automation_rules").upsert({
      id: r.id,
      name: r.name,
      trigger_type: r.trigger_type,
      trigger_config: r.trigger_config ?? {},
      action_type: r.action_type,
      action_config: r.action_config ?? {},
      enabled: Boolean(r.enabled),
    });
    await auditWrite("automation.rule", "automation_rule", r.id);
  }

  return NextResponse.json({ ok: true, message: "Regla guardada" });
}

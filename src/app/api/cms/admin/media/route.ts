import { NextResponse } from "next/server";
import { auditWrite, getSupabaseAdmin, requireCmsAdmin } from "@/lib/cms/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const [{ data: assets }, { data: folders }] = await Promise.all([
    supabase!.from("media_assets").select("*").order("created_at", { ascending: false }).limit(100),
    supabase!.from("media_folders").select("*"),
  ]);

  return NextResponse.json({ ok: true, assets: assets ?? [], folders: folders ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireCmsAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, error } = await getSupabaseAdmin();
  if (error) return error;

  const body = await request.json();
  const { error: dbErr } = await supabase!.from("media_assets").insert({
    name: body.name ?? "asset",
    asset_type: body.asset_type ?? "image",
    public_url: body.public_url ?? null,
    storage_path: body.storage_path ?? null,
    folder_id: body.folder_id ?? null,
    meta: body.meta ?? {},
  });
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  await auditWrite("media.create", "media_asset");
  return NextResponse.json({ ok: true, message: "Asset registrado" });
}

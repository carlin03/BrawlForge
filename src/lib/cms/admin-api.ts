import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { logCmsAudit } from "./audit";

export async function requireCmsAdmin() {
  return requireAdmin();
}

export async function getSupabaseAdmin() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, error: NextResponse.json({ error: "supabase_not_configured" }, { status: 503 }) };
  return { supabase, error: null };
}

export async function auditWrite(action: string, entityType: string, entityId?: string, meta?: Record<string, unknown>) {
  await logCmsAudit({ action, entityType, entityId, meta });
}

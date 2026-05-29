import { createClient } from "@/lib/supabase/server";

export type CmsAuditParams = {
  action: string;
  entityType: string;
  entityId?: string | null;
  diff?: Record<string, unknown> | null;
  meta?: Record<string, unknown>;
  actorId?: string | null;
};

/** Registra acción en cms_audit_log (no lanza si la tabla no existe). */
export async function logCmsAudit(params: CmsAuditParams): Promise<void> {
  const supabase = await createClient();
  if (!supabase) return;

  let actorId = params.actorId ?? null;
  if (!actorId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    actorId = user?.id ?? null;
  }

  const { error } = await supabase.from("cms_audit_log").insert({
    actor_id: actorId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    diff: params.diff ?? null,
    meta: params.meta ?? {},
  });

  if (error && error.code !== "42P01") {
    console.warn("[cms_audit]", error.message);
  }
}

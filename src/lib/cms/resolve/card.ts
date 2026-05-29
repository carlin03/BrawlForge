import { createClient } from "@/lib/supabase/server";
import { isCmsResolverActive, isFlagEnabled, mergeFlags } from "../flags";
import { loadFlagsFromDb } from "../db";

export interface ResolvedCardTemplate {
  id: string;
  entityType: string;
  name: string;
  layout: Record<string, unknown>;
}

const DEFAULT_TEMPLATES: Record<string, ResolvedCardTemplate> = {
  team: { id: "team-default", entityType: "team", name: "Equipo estándar", layout: { variant: "platform" } },
  player: { id: "player-default", entityType: "player", name: "Jugador estándar", layout: { variant: "platform" } },
};

export async function resolveCardTemplate(
  entityType: string,
  entitySlug?: string,
): Promise<ResolvedCardTemplate> {
  const fallback = DEFAULT_TEMPLATES[entityType] ?? {
    id: `${entityType}-default`,
    entityType,
    name: "Default",
    layout: { variant: "platform" },
  };

  const dbFlags = await loadFlagsFromDb();
  const flags = mergeFlags(dbFlags);
  if (!isCmsResolverActive(flags) || !isFlagEnabled(flags, "cms.cards.enabled")) {
    return fallback;
  }

  const supabase = await createClient();
  if (!supabase) return fallback;

  if (entitySlug) {
    const { data: assigned } = await supabase
      .from("card_template_assignments")
      .select("template_id")
      .eq("entity_type", entityType)
      .eq("entity_slug", entitySlug)
      .order("priority", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assigned?.template_id) {
      const { data: tpl } = await supabase
        .from("card_templates")
        .select("id, entity_type, name, layout")
        .eq("id", assigned.template_id)
        .maybeSingle();
      if (tpl) {
        return {
          id: tpl.id,
          entityType: tpl.entity_type,
          name: tpl.name,
          layout: (tpl.layout as Record<string, unknown>) ?? fallback.layout,
        };
      }
    }
  }

  const { data: def } = await supabase
    .from("card_templates")
    .select("id, entity_type, name, layout")
    .eq("entity_type", entityType)
    .eq("is_default", true)
    .limit(1)
    .maybeSingle();

  if (def) {
    return {
      id: def.id,
      entityType: def.entity_type,
      name: def.name,
      layout: (def.layout as Record<string, unknown>) ?? fallback.layout,
    };
  }

  return fallback;
}

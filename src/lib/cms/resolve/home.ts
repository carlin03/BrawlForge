import { createClient } from "@/lib/supabase/server";
import { isCmsResolverActive, isFlagEnabled, mergeFlags } from "../flags";
import { loadFlagsFromDb } from "../db";

export type HomeBlockType =
  | "hero"
  | "clubs_marquee"
  | "matches_strip"
  | "vote_strip"
  | "news"
  | "tournaments"
  | "fantasy_teaser"
  | "rankings_teaser"
  | "custom_json";

export interface ResolvedHomeBlock {
  id: string;
  blockType: HomeBlockType;
  sortOrder: number;
  enabled: boolean;
  props: Record<string, unknown>;
}

export interface ResolvedHomePage {
  enabled: boolean;
  sections: { id: string; label: string | null; blocks: ResolvedHomeBlock[] }[];
  clubSlugs: string[];
  matchLimits: { live: number; upcoming: number; results: number };
}

const DEFAULT_BLOCKS: ResolvedHomeBlock[] = [
  { id: "hero", blockType: "hero", sortOrder: 0, enabled: true, props: {} },
  { id: "clubs", blockType: "clubs_marquee", sortOrder: 10, enabled: true, props: {} },
  { id: "matches", blockType: "matches_strip", sortOrder: 20, enabled: true, props: { limit: 8 } },
  { id: "vote", blockType: "vote_strip", sortOrder: 30, enabled: true, props: {} },
  { id: "news", blockType: "news", sortOrder: 40, enabled: true, props: { limit: 6 } },
  { id: "tournaments", blockType: "tournaments", sortOrder: 50, enabled: true, props: { limit: 12 } },
];

const DEFAULT_CLUBS = [
  "sk-gaming",
  "team-heretics",
  "hmble",
  "fut-esports",
  "natus-vincere",
  "totem-esports",
  "big",
  "crazy-raccoon",
  "zeta-division",
  "reject",
  "skcalalas-ea",
  "tribe-gaming",
  "kds-esports",
  "loud",
  "skcalalas",
  "new-heights-gaming",
  "kaioperro",
  "only-realm",
  "bounty-hunters-esports",
];

export async function resolveHomePage(): Promise<ResolvedHomePage> {
  const dbFlags = await loadFlagsFromDb();
  const flags = mergeFlags(dbFlags);
  const builderOff =
    !isCmsResolverActive(flags) || !isFlagEnabled(flags, "cms.home_builder.enabled");

  const supabase = await createClient();
  let clubSlugs = DEFAULT_CLUBS;
  let matchLimits = { live: 8, upcoming: 8, results: 8 };

  if (supabase) {
    const { data: curated } = await supabase
      .from("home_curated_config")
      .select("club_slugs, match_limits")
      .eq("id", "default")
      .maybeSingle();
    if (curated?.club_slugs && Array.isArray(curated.club_slugs)) {
      clubSlugs = curated.club_slugs as string[];
    }
    if (curated?.match_limits && typeof curated.match_limits === "object") {
      const ml = curated.match_limits as Record<string, number>;
      matchLimits = {
        live: ml.live ?? 8,
        upcoming: ml.upcoming ?? 8,
        results: ml.results ?? 8,
      };
    }
  }

  if (builderOff) {
    return {
      enabled: false,
      sections: [{ id: "main", label: "Home", blocks: DEFAULT_BLOCKS }],
      clubSlugs,
      matchLimits,
    };
  }

  if (!supabase) {
    return { enabled: false, sections: [], clubSlugs, matchLimits };
  }

  const { data: page } = await supabase
    .from("cms_pages")
    .select("slug, status")
    .eq("slug", "home")
    .eq("status", "published")
    .maybeSingle();

  if (!page) {
    return {
      enabled: true,
      sections: [{ id: "main", label: "Home", blocks: DEFAULT_BLOCKS }],
      clubSlugs,
      matchLimits,
    };
  }

  const { data: version } = await supabase
    .from("cms_page_versions")
    .select("id")
    .eq("page_slug", "home")
    .eq("status", "published")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!version) {
    return {
      enabled: true,
      sections: [{ id: "main", label: "Home", blocks: DEFAULT_BLOCKS }],
      clubSlugs,
      matchLimits,
    };
  }

  const { data: sections } = await supabase
    .from("cms_sections")
    .select("id, label, sort_order, enabled")
    .eq("page_version_id", version.id)
    .eq("enabled", true)
    .order("sort_order");

  const resolvedSections: ResolvedHomePage["sections"] = [];

  for (const sec of sections ?? []) {
    const { data: blocks } = await supabase
      .from("cms_blocks")
      .select("id, block_type, sort_order, enabled, props")
      .eq("section_id", sec.id)
      .eq("enabled", true)
      .order("sort_order");

    resolvedSections.push({
      id: sec.id,
      label: sec.label,
      blocks: (blocks ?? []).map((b) => ({
        id: b.id,
        blockType: b.block_type as HomeBlockType,
        sortOrder: b.sort_order,
        enabled: b.enabled,
        props: (b.props as Record<string, unknown>) ?? {},
      })),
    });
  }

  if (!resolvedSections.length) {
    return {
      enabled: true,
      sections: [{ id: "main", label: "Home", blocks: DEFAULT_BLOCKS }],
      clubSlugs,
      matchLimits,
    };
  }

  return { enabled: true, sections: resolvedSections, clubSlugs, matchLimits };
}

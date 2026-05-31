import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mergeJsonField(
  existing: unknown,
  incoming: unknown,
  incomingProvided: boolean,
): Record<string, unknown> {
  if (!incomingProvided) return asRecord(existing);
  return { ...asRecord(existing), ...asRecord(incoming) };
}

/** Preserva historia/meta/redes del admin cuando el CSV solo trae columnas básicas. */
export async function mergeTeamRowsWithCatalog(
  supabase: NonNullable<Supabase>,
  rows: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  if (!rows.length) return rows;
  const slugs = rows.map((r) => String(r.slug));
  const { data } = await supabase.from("teams_catalog").select("*").in("slug", slugs);
  const bySlug = new Map((data ?? []).map((r) => [String(r.slug), r]));

  return rows.map((row) => {
    const ex = bySlug.get(String(row.slug));
    if (!ex) return row;
    const hasAchievements = Array.isArray(row.achievements) && row.achievements.length > 0;
    return {
      ...ex,
      ...row,
      description: "description" in row ? row.description : ex.description,
      meta: mergeJsonField(ex.meta, row.meta, row.meta !== undefined),
      social: mergeJsonField(ex.social, row.social, row.social !== undefined),
      achievements: hasAchievements ? row.achievements : ex.achievements ?? [],
    };
  });
}

export async function mergePlayerRowsWithCatalog(
  supabase: NonNullable<Supabase>,
  rows: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  if (!rows.length) return rows;
  const slugs = rows.map((r) => String(r.slug));
  const { data } = await supabase.from("players_catalog").select("*").in("slug", slugs);
  const bySlug = new Map((data ?? []).map((r) => [String(r.slug), r]));

  return rows.map((row) => {
    const ex = bySlug.get(String(row.slug));
    if (!ex) return row;
    return {
      ...ex,
      ...row,
      bio: "bio" in row ? row.bio : ex.bio,
      photo_url: "photo_url" in row ? row.photo_url : ex.photo_url,
      meta: mergeJsonField(ex.meta, row.meta, row.meta !== undefined),
      social: mergeJsonField(ex.social, row.social, row.social !== undefined),
    };
  });
}

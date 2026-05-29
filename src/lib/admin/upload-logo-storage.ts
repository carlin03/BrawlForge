import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "logos";

export async function uploadTeamLogoPng(
  supabase: SupabaseClient,
  slug: string,
  png: Buffer,
): Promise<{ publicUrl: string } | { error: string }> {
  const objectPath = `teams/${slug}.png`;
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, png, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return { publicUrl: data.publicUrl };
}

export async function uploadTournamentLogoPng(
  supabase: SupabaseClient,
  slug: string,
  png: Buffer,
): Promise<{ publicUrl: string } | { error: string }> {
  const objectPath = `tournaments/${slug}.png`;
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, png, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return { publicUrl: data.publicUrl };
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { isHiddenTeam, isHiddenTeamSlug } from "@/lib/data/blocked-team-slugs";
import { createServiceClient } from "@/lib/supabase/service";

export type PhantomPurgeResult = {
  removedTeams: string[];
  clearedPlayerTeams: number;
  removedLogoOverrides: string[];
};

async function dbClient(preferred: SupabaseClient | null): Promise<SupabaseClient | null> {
  return createServiceClient() ?? preferred;
}

/** Borra de Supabase equipos fantasma (p. ej. slug ".", nombre "punto (.)"). */
export async function purgePhantomTeamsFromDb(
  supabase: SupabaseClient | null,
): Promise<PhantomPurgeResult> {
  const client = await dbClient(supabase);
  if (!client) {
    return { removedTeams: [], clearedPlayerTeams: 0, removedLogoOverrides: [] };
  }

  const removedTeams: string[] = [];
  const removedLogoOverrides: string[] = [];

  const { data: teams } = await client.from("teams_catalog").select("slug, name").limit(500);
  for (const row of teams ?? []) {
    if (!isHiddenTeam(row)) continue;
    const slug = String(row.slug);
    const { error } = await client.from("teams_catalog").delete().eq("slug", slug);
    if (!error) removedTeams.push(slug);
  }

  const { data: logos } = await client.from("team_logo_overrides").select("slug").limit(500);
  for (const row of logos ?? []) {
    if (!isHiddenTeamSlug(row.slug)) continue;
    const slug = String(row.slug);
    const { error } = await client.from("team_logo_overrides").delete().eq("slug", slug);
    if (!error) removedLogoOverrides.push(slug);
  }

  let clearedPlayerTeams = 0;
  const { data: players } = await client
    .from("players_catalog")
    .select("slug, team_slug")
    .not("team_slug", "is", null)
    .limit(2000);

  for (const p of players ?? []) {
    if (!isHiddenTeamSlug(p.team_slug)) continue;
    const { error } = await client
      .from("players_catalog")
      .update({ team_slug: null })
      .eq("slug", p.slug);
    if (!error) clearedPlayerTeams += 1;
  }

  return { removedTeams, clearedPlayerTeams, removedLogoOverrides };
}

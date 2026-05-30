import type { createClient } from "@/lib/supabase/server";

export type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createClient>>>;

/** Mantiene roster_slugs del equipo al cambiar club de un jugador. */
export async function syncPlayerRosterOnTeamChange(
  supabase: SupabaseServerClient,
  playerSlug: string,
  newTeamSlug: string | null,
  oldTeamSlug: string | null,
) {
  if (!oldTeamSlug && !newTeamSlug) return;
  if (oldTeamSlug === newTeamSlug) return;

  const pullRoster = async (teamSlug: string) => {
    const { data } = await supabase
      .from("teams_catalog")
      .select("roster_slugs")
      .eq("slug", teamSlug)
      .maybeSingle();
    return Array.isArray(data?.roster_slugs) ? [...data.roster_slugs] : [];
  };

  if (oldTeamSlug) {
    const roster = (await pullRoster(oldTeamSlug)).filter((s) => s !== playerSlug);
    await supabase.from("teams_catalog").update({ roster_slugs: roster }).eq("slug", oldTeamSlug);
  }
  if (newTeamSlug) {
    const roster = await pullRoster(newTeamSlug);
    if (!roster.includes(playerSlug)) {
      roster.push(playerSlug);
      await supabase.from("teams_catalog").update({ roster_slugs: roster }).eq("slug", newTeamSlug);
    }
  }
}

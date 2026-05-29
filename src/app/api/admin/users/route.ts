import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type PageViews = Record<string, number>;

function topPages(views: PageViews, limit = 5): { path: string; hits: number }[] {
  return Object.entries(views)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([path, hits]) => ({ path, hits }));
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json(
      {
        error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor para listar emails y actividad.",
        setupRequired: true,
      },
      { status: 503 },
    );
  }

  const [{ data: profiles, error: profErr }, { data: entries }, { data: votes }, authList] =
    await Promise.all([
      service.from("profiles").select("*").order("created_at", { ascending: false }),
      service.from("fantasy_entries").select("id, user_id, tournament_slug, team_name, total_points, updated_at"),
      service.from("prediction_votes").select("user_id, match_id, created_at"),
      service.auth.admin.listUsers({ perPage: 1000 }),
    ]);

  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  const authById = new Map(
    (authList.data.users ?? []).map((u) => [
      u.id,
      {
        email: u.email ?? null,
        authCreatedAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        emailConfirmed: Boolean(u.email_confirmed_at),
      },
    ]),
  );

  const entriesByUser = new Map<string, typeof entries>();
  for (const e of entries ?? []) {
    const list = entriesByUser.get(e.user_id) ?? [];
    list.push(e);
    entriesByUser.set(e.user_id, list);
  }

  const votesByUser = new Map<string, number>();
  for (const v of votes ?? []) {
    votesByUser.set(v.user_id, (votesByUser.get(v.user_id) ?? 0) + 1);
  }

  const { data: slotRows } = await service.from("fantasy_squad_slots").select("entry_id");
  const entryIdsWithSquad = new Set((slotRows ?? []).map((s) => s.entry_id));
  const usersWithSquad = new Set<string>();
  for (const e of entries ?? []) {
    if (entryIdsWithSquad.has(e.id)) usersWithSquad.add(e.user_id);
  }

  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  const users = (profiles ?? []).map((p) => {
    const auth = authById.get(p.id);
    const pageViews = (p.page_views as PageViews) ?? {};
    const fe = entriesByUser.get(p.id) ?? [];
    const lastSeen = p.last_seen_at ? new Date(p.last_seen_at).getTime() : 0;

    return {
      id: p.id,
      email: auth?.email ?? null,
      displayName: p.display_name,
      ign: p.ign,
      favoriteTeamSlug: p.favorite_team_slug,
      isAdmin: Boolean(p.is_admin),
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      lastSeenAt: p.last_seen_at,
      lastPath: p.last_path,
      topPages: topPages(pageViews),
      pageViews,
      authCreatedAt: auth?.authCreatedAt ?? null,
      lastSignInAt: auth?.lastSignInAt ?? null,
      emailConfirmed: auth?.emailConfirmed ?? false,
      predictPoints: p.predict_points ?? 0,
      predictStreak: p.predict_streak ?? 0,
      predictCorrect: p.predict_correct ?? 0,
      predictAttempts: p.predict_attempts ?? 0,
      predictVotes: votesByUser.get(p.id) ?? 0,
      fantasyEntries: fe.length,
      fantasyTournaments: fe.map((x) => x.tournament_slug),
      hasFantasySquad: usersWithSquad.has(p.id),
      fantasyUpdatedAt: fe[0]?.updated_at ?? null,
    };
  });

  const registered = users.length;
  const withSquad = users.filter((u) => u.hasFantasySquad).length;
  const activeLast7d = users.filter((u) => u.lastSeenAt && now - new Date(u.lastSeenAt).getTime() < weekMs).length;

  return NextResponse.json({
    ok: true,
    totals: { registered, withSquad, activeLast7d, predictVotes: votes?.length ?? 0 },
    users,
  });
}

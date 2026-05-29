-- Pega en Supabase SQL Editor (mismo contenido que migrations/20260529700000_user_activity_admin.sql)

alter table public.profiles
  add column if not exists last_seen_at timestamptz,
  add column if not exists last_path text,
  add column if not exists page_views jsonb not null default '{}'::jsonb;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  v_name := coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Jugador');
  insert into public.profiles (id, display_name, ign)
  values (new.id, v_name, coalesce(new.raw_user_meta_data->>'ign', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  insert into public.fantasy_entries (user_id, tournament_slug, team_name, total_points)
  values (new.id, 'bsc-2026-brawl-cup', v_name, 0)
  on conflict (user_id, tournament_slug) do nothing;
  return new;
end;
$$;

insert into public.fantasy_entries (user_id, tournament_slug, team_name, total_points)
select p.id, 'bsc-2026-brawl-cup', coalesce(p.display_name, 'Mi Equipo'), 0
from public.profiles p
where not exists (
  select 1 from public.fantasy_entries fe
  where fe.user_id = p.id and fe.tournament_slug = 'bsc-2026-brawl-cup'
)
on conflict (user_id, tournament_slug) do nothing;

-- (Copia también fantasy_leaderboard + registered_users_count desde ALL_IN_ONE si aún no los tienes)

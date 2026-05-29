-- Actividad de usuarios, conteo de registrados y lectura admin de perfiles.

alter table public.profiles
  add column if not exists last_seen_at timestamptz,
  add column if not exists last_path text,
  add column if not exists page_views jsonb not null default '{}'::jsonb;

-- Nuevas cuentas: perfil + fantasy (torneo por defecto)
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
  values (
    new.id,
    v_name,
    coalesce(new.raw_user_meta_data->>'ign', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  insert into public.fantasy_entries (user_id, tournament_slug, team_name, total_points)
  values (new.id, 'bsc-2026-brawl-cup', v_name, 0)
  on conflict (user_id, tournament_slug) do nothing;

  return new;
end;
$$;

-- Cuentas sin entrada fantasy
insert into public.fantasy_entries (user_id, tournament_slug, team_name, total_points)
select p.id, 'bsc-2026-brawl-cup', coalesce(p.display_name, 'Mi Equipo'), 0
from public.profiles p
where not exists (
  select 1 from public.fantasy_entries fe
  where fe.user_id = p.id and fe.tournament_slug = 'bsc-2026-brawl-cup'
)
on conflict (user_id, tournament_slug) do nothing;

-- Ranking: todos los perfiles registrados
create or replace function public.fantasy_leaderboard(p_tournament text, p_limit int default 100)
returns table (
  rank bigint,
  user_id uuid,
  team_name text,
  total_points int,
  display_name text,
  ign text
)
language sql
stable
security definer
set search_path = public
as $$
  with managers as (
    select
      p.id as user_id,
      coalesce(fe.team_name, p.display_name, 'Mi Equipo') as team_name,
      coalesce(fe.total_points, 0)::int as total_points,
      p.display_name,
      p.ign,
      fe.updated_at
    from public.profiles p
    left join public.fantasy_entries fe
      on fe.user_id = p.id and fe.tournament_slug = p_tournament
  ),
  ranked as (
    select
      user_id,
      team_name,
      total_points,
      display_name,
      ign,
      rank() over (order by total_points desc, coalesce(updated_at, '1970-01-01'::timestamptz) asc) as rk
    from managers
  )
  select rk, user_id, team_name, total_points, display_name, ign
  from ranked
  order by rk
  limit greatest(p_limit, 1);
$$;

grant execute on function public.fantasy_leaderboard(text, int) to anon, authenticated;

create or replace function public.registered_users_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint from public.profiles;
$$;

grant execute on function public.registered_users_count() to anon, authenticated;

drop policy if exists "profiles admin read all" on public.profiles;
create policy "profiles admin read all"
  on public.profiles for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

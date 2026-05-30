-- =============================================================================
-- BrawlForge — ARREGLA "infinite recursion detected in policy for relation profiles"
-- Pega TODO en Supabase → SQL Editor → Run (una sola vez; idempotente).
-- =============================================================================
-- Causa: políticas que hacen SELECT en public.profiles dentro de políticas
-- de la misma tabla (o en checks admin). Solución: public.is_cms_admin()
-- SECURITY DEFINER (lee profiles sin disparar RLS).
-- =============================================================================

-- ─── 1) Función admin (sin recursión) ───────────────────────────────────────

create or replace function public.is_cms_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return false;
  end if;

  return exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = v_uid
      and (
        coalesce(p.is_admin, false) = true
        or lower(coalesce(u.email, '')) = lower('carlinperez022@gmail.com')
      )
  );
end;
$$;

comment on function public.is_cms_admin() is
  'Admin/CMS check; SECURITY DEFINER evita recursión RLS en profiles.';

grant execute on function public.is_cms_admin() to anon, authenticated, service_role;

-- Alias legacy (mismo comportamiento)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_cms_admin();
$$;

grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ─── 2) Perfiles: columnas + políticas sin subquery recursiva ───────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Jugador',
  ign text,
  favorite_team_slug text,
  avatar_url text,
  is_admin boolean not null default false,
  predict_points int not null default 0,
  predict_streak int not null default 0,
  predict_correct int not null default 0,
  predict_attempts int not null default 0,
  last_seen_at timestamptz,
  last_path text,
  page_views jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists predict_points int not null default 0,
  add column if not exists predict_streak int not null default 0,
  add column if not exists predict_correct int not null default 0,
  add column if not exists predict_attempts int not null default 0,
  add column if not exists last_seen_at timestamptz,
  add column if not exists last_path text,
  add column if not exists page_views jsonb not null default '{}'::jsonb;

alter table public.profiles enable row level security;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles admin read all" on public.profiles;
create policy "profiles admin read all"
  on public.profiles for select
  using (public.is_cms_admin());

drop policy if exists "profiles admin update all" on public.profiles;
create policy "profiles admin update all"
  on public.profiles for update
  using (public.is_cms_admin());

-- ─── 3) Catálogo, logos overrides, storage ──────────────────────────────────

drop policy if exists "team logos admin write" on public.team_logo_overrides;
create policy "team logos admin write"
  on public.team_logo_overrides for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

drop policy if exists "tournament logos admin write" on public.tournament_logo_overrides;
create policy "tournament logos admin write"
  on public.tournament_logo_overrides for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

drop policy if exists "news catalog admin write" on public.news_catalog;
create policy "news catalog admin write"
  on public.news_catalog for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

drop policy if exists "teams catalog admin insert" on public.teams_catalog;
create policy "teams catalog admin insert"
  on public.teams_catalog for insert
  with check (public.is_cms_admin());

drop policy if exists "teams catalog admin update" on public.teams_catalog;
create policy "teams catalog admin update"
  on public.teams_catalog for update
  using (public.is_cms_admin());

drop policy if exists "teams catalog admin delete" on public.teams_catalog;
create policy "teams catalog admin delete"
  on public.teams_catalog for delete
  using (public.is_cms_admin());

drop policy if exists "players catalog admin insert" on public.players_catalog;
create policy "players catalog admin insert"
  on public.players_catalog for insert
  with check (public.is_cms_admin());

drop policy if exists "players catalog admin update" on public.players_catalog;
create policy "players catalog admin update"
  on public.players_catalog for update
  using (public.is_cms_admin());

drop policy if exists "players catalog admin delete" on public.players_catalog;
create policy "players catalog admin delete"
  on public.players_catalog for delete
  using (public.is_cms_admin());

drop policy if exists "tournaments catalog admin insert" on public.tournaments_catalog;
create policy "tournaments catalog admin insert"
  on public.tournaments_catalog for insert
  with check (public.is_cms_admin());

drop policy if exists "tournaments catalog admin update" on public.tournaments_catalog;
create policy "tournaments catalog admin update"
  on public.tournaments_catalog for update
  using (public.is_cms_admin());

drop policy if exists "tournaments catalog admin delete" on public.tournaments_catalog;
create policy "tournaments catalog admin delete"
  on public.tournaments_catalog for delete
  using (public.is_cms_admin());

drop policy if exists "tournament rosters admin insert" on public.tournament_team_rosters;
create policy "tournament rosters admin insert"
  on public.tournament_team_rosters for insert
  with check (public.is_cms_admin());

drop policy if exists "tournament rosters admin update" on public.tournament_team_rosters;
create policy "tournament rosters admin update"
  on public.tournament_team_rosters for update
  using (public.is_cms_admin());

drop policy if exists "tournament rosters admin delete" on public.tournament_team_rosters;
create policy "tournament rosters admin delete"
  on public.tournament_team_rosters for delete
  using (public.is_cms_admin());

drop policy if exists "fantasy market catalog admin insert" on public.fantasy_market_catalog;
create policy "fantasy market catalog admin insert"
  on public.fantasy_market_catalog for insert
  with check (public.is_cms_admin());

drop policy if exists "fantasy market catalog admin update" on public.fantasy_market_catalog;
create policy "fantasy market catalog admin update"
  on public.fantasy_market_catalog for update
  using (public.is_cms_admin());

drop policy if exists "fantasy market catalog admin delete" on public.fantasy_market_catalog;
create policy "fantasy market catalog admin delete"
  on public.fantasy_market_catalog for delete
  using (public.is_cms_admin());

drop policy if exists "logos admin write" on storage.objects;
create policy "logos admin write"
  on storage.objects for all
  using (bucket_id = 'logos' and public.is_cms_admin())
  with check (bucket_id = 'logos' and public.is_cms_admin());

-- ─── 4) CMS audit / settings (por si quedaron mal) ──────────────────────────

drop policy if exists "cms audit admin read" on public.cms_audit_log;
create policy "cms audit admin read"
  on public.cms_audit_log for select
  using (public.is_cms_admin());

drop policy if exists "cms audit admin insert" on public.cms_audit_log;
create policy "cms audit admin insert"
  on public.cms_audit_log for insert
  with check (public.is_cms_admin());

drop policy if exists "site settings admin write" on public.site_settings;
create policy "site settings admin write"
  on public.site_settings for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

drop policy if exists "feature flags admin write" on public.site_feature_flags;
create policy "feature flags admin write"
  on public.site_feature_flags for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

-- ─── 5) Tablas de juego (si faltan en producción) ───────────────────────────

create table if not exists public.prediction_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  match_id text not null,
  pick text not null check (pick in ('A', 'B')),
  exact_score text,
  created_at timestamptz not null default now(),
  unique (user_id, match_id)
);

alter table public.prediction_votes
  add column if not exists exact_score text,
  add column if not exists pick_meta jsonb not null default '{}'::jsonb;

create table if not exists public.fantasy_squad_slots (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null,
  player_slug text not null,
  slot_index int not null check (slot_index between 0 and 4),
  unique (entry_id, slot_index)
);

alter table public.prediction_votes enable row level security;
alter table public.fantasy_squad_slots enable row level security;

drop policy if exists "prediction votes public read" on public.prediction_votes;
create policy "prediction votes public read"
  on public.prediction_votes for select using (true);

drop policy if exists "prediction votes insert own" on public.prediction_votes;
create policy "prediction votes insert own"
  on public.prediction_votes for insert
  with check (auth.uid() = user_id);

drop policy if exists "prediction votes update own" on public.prediction_votes;
create policy "prediction votes update own"
  on public.prediction_votes for update
  using (auth.uid() = user_id);

-- ─── 6) Super admin + perfiles huérfanos ────────────────────────────────────

insert into public.profiles (id, display_name, ign, is_admin)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1), 'Jugador'),
  coalesce(u.raw_user_meta_data->>'ign', split_part(u.email, '@', 1)),
  lower(u.email) = lower('carlinperez022@gmail.com')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

update public.profiles
set is_admin = true,
    updated_at = now()
where id in (
  select u.id
  from auth.users u
  where lower(u.email) = lower('carlinperez022@gmail.com')
);

-- ─── 7) Comprobación (debe devolver 0 filas) ────────────────────────────────

select schemaname, tablename, policyname
from pg_policies
where (
  coalesce(qual, '') ilike '%from public.profiles%is_admin%'
  or coalesce(with_check, '') ilike '%from public.profiles%is_admin%'
)
and tablename <> 'profiles'
order by tablename, policyname;

-- Si la consulta anterior devuelve filas, avisa en el chat.
-- Tras ejecutar: cierra sesión en brawlforge, vuelve a /login y prueba /admin.

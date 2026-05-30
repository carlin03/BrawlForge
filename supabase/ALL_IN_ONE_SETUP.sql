-- =============================================================================
-- BrawlForge — PEGA TODO ESTO EN SUPABASE → SQL Editor → New query → RUN
-- Proyecto nuevo o con errores a medias: este script es idempotente (re-ejecutable).
-- =============================================================================

-- ─── 1) Perfiles y logos ───────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Jugador',
  ign text,
  favorite_team_slug text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_logo_overrides (
  slug text primary key,
  public_url text not null,
  treatment text not null default 'strip-white',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

create table if not exists public.tournament_logo_overrides (
  slug text primary key,
  public_url text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

alter table public.profiles enable row level security;
alter table public.team_logo_overrides enable row level security;
alter table public.tournament_logo_overrides enable row level security;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "team logos public read" on public.team_logo_overrides;
create policy "team logos public read" on public.team_logo_overrides for select using (true);

drop policy if exists "tournament logos public read" on public.tournament_logo_overrides;
create policy "tournament logos public read" on public.tournament_logo_overrides for select using (true);

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
    select 1 from public.profiles p
    where p.id = v_uid and coalesce(p.is_admin, false) = true
  );
end;
$$;

grant execute on function public.is_cms_admin() to anon, authenticated, service_role;

drop policy if exists "team logos admin write" on public.team_logo_overrides;
create policy "team logos admin write" on public.team_logo_overrides for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

drop policy if exists "tournament logos admin write" on public.tournament_logo_overrides;
create policy "tournament logos admin write" on public.tournament_logo_overrides for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_name text;
begin
  v_name := coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Jugador');
  insert into public.profiles (id, display_name, ign)
  values (
    new.id,
    v_name,
    coalesce(new.raw_user_meta_data->>'ign', split_part(new.email, '@', 1))
  );
  insert into public.fantasy_entries (user_id, tournament_slug, team_name, total_points)
  values (new.id, 'bsc-2026-brawl-cup', v_name, 0)
  on conflict (user_id, tournament_slug) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Perfiles para usuarios que ya existían antes de la migración
insert into public.profiles (id, display_name, ign)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1), 'Jugador'),
  coalesce(u.raw_user_meta_data->>'ign', split_part(u.email, '@', 1))
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- ─── 2) Fantasy + predicciones ─────────────────────────────────────────────

alter table public.profiles
  add column if not exists predict_points int not null default 0,
  add column if not exists predict_streak int not null default 0,
  add column if not exists predict_correct int not null default 0,
  add column if not exists predict_attempts int not null default 0,
  add column if not exists last_seen_at timestamptz,
  add column if not exists last_path text,
  add column if not exists page_views jsonb not null default '{}'::jsonb;

create table if not exists public.fantasy_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tournament_slug text not null,
  team_name text not null default 'Mi Equipo',
  total_points int not null default 0,
  transfers_used int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tournament_slug)
);

create table if not exists public.fantasy_squad_slots (
  entry_id uuid not null references public.fantasy_entries (id) on delete cascade,
  player_slug text not null,
  is_captain boolean not null default false,
  event_points int not null default 0,
  primary key (entry_id, player_slug)
);

create table if not exists public.prediction_votes (
  user_id uuid not null references auth.users (id) on delete cascade,
  match_id text not null,
  pick text not null check (pick in ('A', 'B')),
  reward_points int not null default 0,
  points_awarded int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

create index if not exists fantasy_entries_tournament_idx on public.fantasy_entries (tournament_slug, total_points desc);
create index if not exists prediction_votes_match_idx on public.prediction_votes (match_id);

alter table public.fantasy_entries enable row level security;
alter table public.fantasy_squad_slots enable row level security;
alter table public.prediction_votes enable row level security;

drop policy if exists "fantasy entries public read" on public.fantasy_entries;
create policy "fantasy entries public read" on public.fantasy_entries for select using (true);

drop policy if exists "fantasy entries insert own" on public.fantasy_entries;
create policy "fantasy entries insert own" on public.fantasy_entries for insert with check (auth.uid() = user_id);

drop policy if exists "fantasy entries update own" on public.fantasy_entries;
create policy "fantasy entries update own" on public.fantasy_entries for update using (auth.uid() = user_id);

drop policy if exists "fantasy entries delete own" on public.fantasy_entries;
create policy "fantasy entries delete own" on public.fantasy_entries for delete using (auth.uid() = user_id);

drop policy if exists "fantasy squad read via entry" on public.fantasy_squad_slots;
create policy "fantasy squad read via entry" on public.fantasy_squad_slots for select using (
  exists (select 1 from public.fantasy_entries e where e.id = entry_id)
);

drop policy if exists "fantasy squad insert own entry" on public.fantasy_squad_slots;
create policy "fantasy squad insert own entry" on public.fantasy_squad_slots for insert with check (
  exists (select 1 from public.fantasy_entries e where e.id = entry_id and e.user_id = auth.uid())
);

drop policy if exists "fantasy squad update own entry" on public.fantasy_squad_slots;
create policy "fantasy squad update own entry" on public.fantasy_squad_slots for update using (
  exists (select 1 from public.fantasy_entries e where e.id = entry_id and e.user_id = auth.uid())
);

drop policy if exists "fantasy squad delete own entry" on public.fantasy_squad_slots;
create policy "fantasy squad delete own entry" on public.fantasy_squad_slots for delete using (
  exists (select 1 from public.fantasy_entries e where e.id = entry_id and e.user_id = auth.uid())
);

drop policy if exists "prediction votes public read" on public.prediction_votes;
create policy "prediction votes public read" on public.prediction_votes for select using (true);

drop policy if exists "prediction votes insert own" on public.prediction_votes;
create policy "prediction votes insert own" on public.prediction_votes for insert with check (auth.uid() = user_id);

drop policy if exists "prediction votes update own" on public.prediction_votes;
create policy "prediction votes update own" on public.prediction_votes for update using (auth.uid() = user_id);

create or replace function public.prediction_vote_aggregates()
returns table (match_id text, votes_a bigint, votes_b bigint, total_votes bigint)
language sql stable security definer set search_path = public as $$
  select match_id,
    count(*) filter (where pick = 'A'),
    count(*) filter (where pick = 'B'),
    count(*)
  from public.prediction_votes
  group by match_id;
$$;

grant execute on function public.prediction_vote_aggregates() to anon, authenticated;

create or replace function public.fantasy_leaderboard(p_tournament text, p_limit int default 100)
returns table (rank bigint, user_id uuid, team_name text, total_points int, display_name text, ign text)
language sql stable security definer set search_path = public as $$
  with managers as (
    select p.id as user_id,
      coalesce(fe.team_name, p.display_name, 'Mi Equipo') as team_name,
      coalesce(fe.total_points, 0)::int as total_points,
      p.display_name, p.ign, fe.updated_at
    from public.profiles p
    left join public.fantasy_entries fe on fe.user_id = p.id and fe.tournament_slug = p_tournament
  ),
  ranked as (
    select user_id, team_name, total_points, display_name, ign,
      rank() over (order by total_points desc, coalesce(updated_at, '1970-01-01'::timestamptz) asc) as rk
    from managers
  )
  select rk, user_id, team_name, total_points, display_name, ign
  from ranked order by rk limit greatest(p_limit, 1);
$$;

grant execute on function public.fantasy_leaderboard(text, int) to anon, authenticated;

create or replace function public.registered_users_count()
returns bigint language sql stable security definer set search_path = public as $$
  select count(*)::bigint from public.profiles;
$$;
grant execute on function public.registered_users_count() to anon, authenticated;

drop policy if exists "profiles admin read all" on public.profiles;
create policy "profiles admin read all"
  on public.profiles for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

-- ─── 3) Catálogo (equipos, jugadores, torneos) ─────────────────────────────

create table if not exists public.teams_catalog (
  slug text primary key,
  name text not null,
  tag text not null default '',
  region text not null,
  country text default '',
  earnings bigint not null default 0,
  rank int,
  rank_change int not null default 0,
  form text[] not null default '{}',
  liquipedia_page text,
  logo_file text,
  logo_url text,
  roster_slugs text[] not null default '{}',
  achievements jsonb not null default '[]'::jsonb,
  description text,
  coach text,
  founded_year int,
  headquarters text,
  website text,
  liquipedia_url text,
  circuit_status text not null default 'active',
  bsc_qualified_2026 boolean not null default true,
  circuit_summary text,
  social jsonb not null default '{}'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now()
);

create table if not exists public.players_catalog (
  slug text primary key,
  ign text not null,
  real_name text,
  team_slug text,
  region text not null,
  role text not null default 'Player',
  status text not null default 'active',
  liquipedia_page text,
  fantasy_points int not null default 0,
  fantasy_ownership int not null default 0,
  rating numeric(5, 2) not null default 1.0,
  country text,
  join_date text,
  nationality text,
  primary_brawler text,
  secondary_brawler text,
  is_captain boolean not null default false,
  liquipedia_url text,
  previous_teams text[] not null default '{}',
  bio text,
  social jsonb not null default '{}'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now()
);

create table if not exists public.tournaments_catalog (
  slug text primary key,
  name text not null,
  short_name text,
  region text not null,
  prize_pool text,
  teams_count int not null default 0,
  status text not null default 'upcoming',
  start_date text,
  end_date text,
  location text,
  stage text,
  tier int,
  liquipedia_page text,
  logo_file text,
  participant_slugs text[] not null default '{}',
  meta jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now()
);

create table if not exists public.tournament_team_rosters (
  tournament_slug text not null references public.tournaments_catalog (slug) on delete cascade,
  team_slug text not null references public.teams_catalog (slug) on delete cascade,
  player_slugs text[] not null default '{}',
  primary key (tournament_slug, team_slug)
);

create table if not exists public.fantasy_market_catalog (
  tournament_slug text not null,
  player_slug text not null references public.players_catalog (slug) on delete cascade,
  team_slug text not null,
  price numeric(6, 2) not null default 0,
  price_change numeric(5, 2) not null default 0,
  pick_rate int not null default 0,
  form text[] not null default '{}',
  meta jsonb not null default '{}'::jsonb,
  primary key (tournament_slug, player_slug)
);

alter table public.players_catalog
  add column if not exists photo_url text;

create table if not exists public.news_catalog (
  slug text primary key,
  title text not null,
  excerpt text not null default '',
  body jsonb not null default '[]'::jsonb,
  category text not null default 'Esports',
  published_at date,
  author text default 'BrawlForge',
  read_minutes int not null default 3,
  cover_accent text not null default 'gold',
  related_teams text[] not null default '{}',
  related_tournament text,
  hot boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists players_catalog_team_idx on public.players_catalog (team_slug);
create index if not exists players_catalog_region_idx on public.players_catalog (region);
create index if not exists fantasy_market_tournament_idx on public.fantasy_market_catalog (tournament_slug);

alter table public.teams_catalog enable row level security;
alter table public.players_catalog enable row level security;
alter table public.tournaments_catalog enable row level security;
alter table public.tournament_team_rosters enable row level security;
alter table public.fantasy_market_catalog enable row level security;
alter table public.news_catalog enable row level security;

drop policy if exists "teams catalog public read" on public.teams_catalog;
create policy "teams catalog public read" on public.teams_catalog for select using (true);

drop policy if exists "players catalog public read" on public.players_catalog;
create policy "players catalog public read" on public.players_catalog for select using (true);

drop policy if exists "tournaments catalog public read" on public.tournaments_catalog;
create policy "tournaments catalog public read" on public.tournaments_catalog for select using (true);

drop policy if exists "tournament rosters public read" on public.tournament_team_rosters;
create policy "tournament rosters public read" on public.tournament_team_rosters for select using (true);

drop policy if exists "fantasy market catalog public read" on public.fantasy_market_catalog;
create policy "fantasy market catalog public read" on public.fantasy_market_catalog for select using (true);

drop policy if exists "news catalog public read" on public.news_catalog;
create policy "news catalog public read" on public.news_catalog for select using (true);

drop policy if exists "news catalog admin write" on public.news_catalog;
create policy "news catalog admin write" on public.news_catalog for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

drop policy if exists "teams catalog admin insert" on public.teams_catalog;
create policy "teams catalog admin insert" on public.teams_catalog for insert
  with check (public.is_cms_admin());

drop policy if exists "teams catalog admin update" on public.teams_catalog;
create policy "teams catalog admin update" on public.teams_catalog for update
  using (public.is_cms_admin());

drop policy if exists "teams catalog admin delete" on public.teams_catalog;
create policy "teams catalog admin delete" on public.teams_catalog for delete
  using (public.is_cms_admin());

drop policy if exists "players catalog admin insert" on public.players_catalog;
create policy "players catalog admin insert" on public.players_catalog for insert
  with check (public.is_cms_admin());

drop policy if exists "players catalog admin update" on public.players_catalog;
create policy "players catalog admin update" on public.players_catalog for update
  using (public.is_cms_admin());

drop policy if exists "players catalog admin delete" on public.players_catalog;
create policy "players catalog admin delete" on public.players_catalog for delete
  using (public.is_cms_admin());

-- ─── 6) Storage logos (admin en Vercel) ─────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos',
  'logos',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "logos public read" on storage.objects;
create policy "logos public read"
  on storage.objects for select
  using (bucket_id = 'logos');

drop policy if exists "logos admin write" on storage.objects;
create policy "logos admin write"
  on storage.objects for all
  using (bucket_id = 'logos' and public.is_cms_admin())
  with check (bucket_id = 'logos' and public.is_cms_admin());

-- =============================================================================
-- FIN — Si ves "Success", la base está lista.
-- Siguiente: Authentication → URL Configuration (ver guía abajo)
-- =============================================================================

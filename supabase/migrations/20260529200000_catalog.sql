-- BrawlForge: catálogo completo (equipos, jugadores, torneos, mercado fantasy)

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

create index if not exists players_catalog_team_idx on public.players_catalog (team_slug);
create index if not exists players_catalog_region_idx on public.players_catalog (region);
create index if not exists fantasy_market_tournament_idx on public.fantasy_market_catalog (tournament_slug);

alter table public.teams_catalog enable row level security;
alter table public.players_catalog enable row level security;
alter table public.tournaments_catalog enable row level security;
alter table public.tournament_team_rosters enable row level security;
alter table public.fantasy_market_catalog enable row level security;

create policy "teams catalog public read"
  on public.teams_catalog for select using (true);

create policy "players catalog public read"
  on public.players_catalog for select using (true);

create policy "tournaments catalog public read"
  on public.tournaments_catalog for select using (true);

create policy "tournament rosters public read"
  on public.tournament_team_rosters for select using (true);

create policy "fantasy market catalog public read"
  on public.fantasy_market_catalog for select using (true);

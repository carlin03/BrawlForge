-- BrawlForge: datos de juego 100% en Supabase (fantasy + predicciones)

alter table public.profiles
  add column if not exists predict_points int not null default 0,
  add column if not exists predict_streak int not null default 0,
  add column if not exists predict_correct int not null default 0,
  add column if not exists predict_attempts int not null default 0;

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

-- Fantasy: leer todas las entradas (ranking público), escribir solo la tuya
create policy "fantasy entries public read"
  on public.fantasy_entries for select using (true);

create policy "fantasy entries insert own"
  on public.fantasy_entries for insert
  with check (auth.uid() = user_id);

create policy "fantasy entries update own"
  on public.fantasy_entries for update
  using (auth.uid() = user_id);

create policy "fantasy entries delete own"
  on public.fantasy_entries for delete
  using (auth.uid() = user_id);

create policy "fantasy squad read via entry"
  on public.fantasy_squad_slots for select using (
    exists (select 1 from public.fantasy_entries e where e.id = entry_id)
  );

create policy "fantasy squad insert own entry"
  on public.fantasy_squad_slots for insert
  with check (
    exists (select 1 from public.fantasy_entries e where e.id = entry_id and e.user_id = auth.uid())
  );

create policy "fantasy squad update own entry"
  on public.fantasy_squad_slots for update
  using (
    exists (select 1 from public.fantasy_entries e where e.id = entry_id and e.user_id = auth.uid())
  );

create policy "fantasy squad delete own entry"
  on public.fantasy_squad_slots for delete
  using (
    exists (select 1 from public.fantasy_entries e where e.id = entry_id and e.user_id = auth.uid())
  );

-- Votos: leer todos (porcentajes reales), escribir solo el tuyo
create policy "prediction votes public read"
  on public.prediction_votes for select using (true);

create policy "prediction votes insert own"
  on public.prediction_votes for insert
  with check (auth.uid() = user_id);

create policy "prediction votes update own"
  on public.prediction_votes for update
  using (auth.uid() = user_id);

-- Agregados de votos (lectura pública)
create or replace function public.prediction_vote_aggregates()
returns table (
  match_id text,
  votes_a bigint,
  votes_b bigint,
  total_votes bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    match_id,
    count(*) filter (where pick = 'A'),
    count(*) filter (where pick = 'B'),
    count(*)
  from public.prediction_votes
  group by match_id;
$$;

grant execute on function public.prediction_vote_aggregates() to anon, authenticated;

-- Ranking fantasy por torneo
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
  with ranked as (
    select
      fe.user_id,
      fe.team_name,
      fe.total_points,
      p.display_name,
      p.ign,
      rank() over (order by fe.total_points desc, fe.updated_at asc) as rk
    from public.fantasy_entries fe
    join public.profiles p on p.id = fe.user_id
    where fe.tournament_slug = p_tournament
  )
  select rk, user_id, team_name, total_points, display_name, ign
  from ranked
  order by rk
  limit greatest(p_limit, 1);
$$;

grant execute on function public.fantasy_leaderboard(text, int) to anon, authenticated;

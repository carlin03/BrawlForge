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

alter table public.news_catalog enable row level security;

drop policy if exists "news catalog public read" on public.news_catalog;
create policy "news catalog public read"
  on public.news_catalog for select using (true);

drop policy if exists "news catalog admin write" on public.news_catalog;
create policy "news catalog admin write"
  on public.news_catalog for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "teams catalog admin insert" on public.teams_catalog;
create policy "teams catalog admin insert"
  on public.teams_catalog for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "teams catalog admin update" on public.teams_catalog;
create policy "teams catalog admin update"
  on public.teams_catalog for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "teams catalog admin delete" on public.teams_catalog;
create policy "teams catalog admin delete"
  on public.teams_catalog for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "players catalog admin insert" on public.players_catalog;
create policy "players catalog admin insert"
  on public.players_catalog for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "players catalog admin update" on public.players_catalog;
create policy "players catalog admin update"
  on public.players_catalog for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "players catalog admin delete" on public.players_catalog;
create policy "players catalog admin delete"
  on public.players_catalog for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

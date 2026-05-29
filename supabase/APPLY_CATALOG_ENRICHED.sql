-- Pegar en Supabase → SQL Editor (proyecto ya existente).
-- Añade columnas extra a teams_catalog y players_catalog.

alter table public.teams_catalog
  add column if not exists coach text,
  add column if not exists founded_year int,
  add column if not exists headquarters text,
  add column if not exists website text,
  add column if not exists liquipedia_url text,
  add column if not exists circuit_status text not null default 'active',
  add column if not exists bsc_qualified_2026 boolean not null default true,
  add column if not exists circuit_summary text;

alter table public.players_catalog
  add column if not exists nationality text,
  add column if not exists primary_brawler text,
  add column if not exists secondary_brawler text,
  add column if not exists is_captain boolean not null default false,
  add column if not exists liquipedia_url text,
  add column if not exists previous_teams text[] not null default '{}';

create index if not exists teams_catalog_region_idx on public.teams_catalog (region);
create index if not exists teams_catalog_circuit_status_idx on public.teams_catalog (circuit_status);

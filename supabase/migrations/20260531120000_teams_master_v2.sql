-- Teams Master CSV v2: columnas dedicadas en teams_catalog

alter table public.teams_catalog
  add column if not exists manager text,
  add column if not exists captain_slug text,
  add column if not exists peak_rank int,
  add column if not exists sponsors_json jsonb not null default '[]'::jsonb;

comment on column public.teams_catalog.manager is 'Manager del club (CSV v2 / admin)';
comment on column public.teams_catalog.captain_slug is 'Slug del capitán en players_catalog';
comment on column public.teams_catalog.peak_rank is 'Mejor ranking histórico global';
comment on column public.teams_catalog.sponsors_json is 'Patrocinadores [{name,category?,logo_url?}]';

create index if not exists teams_catalog_captain_slug_idx on public.teams_catalog (captain_slug)
  where captain_slug is not null;

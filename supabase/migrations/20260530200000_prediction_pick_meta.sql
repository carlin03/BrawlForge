-- Predicciones avanzadas por partido (MVP, primer mapa, brawler, etc.)
alter table public.prediction_votes
  add column if not exists pick_meta jsonb not null default '{}'::jsonb;

comment on column public.prediction_votes.pick_meta is
  'MVP, primer mapa, mapa decisivo, brawler más usado (json)';

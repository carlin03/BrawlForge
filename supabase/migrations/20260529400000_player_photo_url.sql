-- Foto del jugador (URL) — editable desde Admin

alter table public.players_catalog
  add column if not exists photo_url text;

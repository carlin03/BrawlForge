-- Resultado exacto en predicciones (BO3/BO5/BO7)
alter table public.prediction_votes
  add column if not exists exact_score text;

comment on column public.prediction_votes.exact_score is 'Marcador exacto predicho, ej. 2-1, 3-2';

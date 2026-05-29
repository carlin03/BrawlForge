-- Pick'em bracket + puntos por fase (ejecutar en Supabase SQL Editor tras APPLY_CMS_ALL.sql)
-- Bracket web: 4 VS cuartos · 2 VS semis · 1 VS final grande

insert into public.prediction_scoring (id, base_points, streak_bonus, rules, is_active) values
  (
    'default',
    10,
    '{"3":5,"5":10}'::jsonb,
    '{
      "correct_winner": 10,
      "points_group": 35,
      "points_quarter": 55,
      "points_semi": 70,
      "points_final": 85
    }'::jsonb,
    true
  )
on conflict (id) do update set
  base_points = excluded.base_points,
  streak_bonus = excluded.streak_bonus,
  rules = excluded.rules,
  is_active = true,
  updated_at = now();

-- Asegurar flag CMS predicciones
insert into public.site_feature_flags (flag, enabled, description)
values ('cms.predictions_config.enabled', true, 'Predictions config')
on conflict (flag) do update set enabled = true, updated_at = now();

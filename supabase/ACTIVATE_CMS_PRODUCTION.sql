-- Pegar en Supabase SQL Editor DESPUÉS de APPLY_CMS_ALL.sql
-- Activa todos los módulos CMS + super admin (carlinperez022@gmail.com)

create or replace function public.is_cms_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = auth.uid()
      and (
        p.is_admin = true
        or lower(u.email) = lower('carlinperez022@gmail.com')
      )
  );
$$;

update public.site_feature_flags set enabled = true, updated_at = now();

insert into public.site_feature_flags (flag, enabled, description)
select flag, true, description
from (values
  ('cms.resolver.enabled', 'Motor CMS'),
  ('cms.nav.enabled', 'Navegación DB'),
  ('cms.theme.enabled', 'Theme tokens'),
  ('cms.home_builder.enabled', 'Home Builder'),
  ('cms.matches.enabled', 'Partidos DB'),
  ('cms.catalog.primary', 'Catálogo DB primario'),
  ('cms.seo.enabled', 'SEO CMS'),
  ('cms.cards.enabled', 'Card Builder'),
  ('cms.fantasy_config.enabled', 'Fantasy config'),
  ('cms.predictions_config.enabled', 'Predictions config'),
  ('cms.media.enabled', 'Media DAM'),
  ('cms.automation.enabled', 'Automation')
) as v(flag, description)
on conflict (flag) do update set enabled = true, updated_at = now();

update public.profiles
set is_admin = true
where id = (
  select id from auth.users
  where lower(email) = lower('carlinperez022@gmail.com')
  limit 1
);

insert into public.profile_cms_roles (profile_id, role_id)
select p.id, 'super_admin'
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) = lower('carlinperez022@gmail.com')
on conflict do nothing;

-- Corregir budget fantasy (100M, no 50000000)
update public.fantasy_rulesets set budget = 100 where id = 'bsc-2026-default';

-- Pick'em: puntos por fase (grupos / cuartos / semis / final) — bracket 4+2+1 VS
insert into public.prediction_scoring (id, base_points, streak_bonus, rules, is_active) values
  (
    'default',
    10,
    '{"3":5,"5":10}'::jsonb,
    '{"correct_winner":10,"points_group":35,"points_quarter":55,"points_semi":70,"points_final":85}'::jsonb,
    true
  )
on conflict (id) do update set
  base_points = excluded.base_points,
  streak_bonus = excluded.streak_bonus,
  rules = excluded.rules,
  is_active = true,
  updated_at = now();

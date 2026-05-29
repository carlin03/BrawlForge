-- Activar CMS en producción + super admin RLS alineado con la app

-- Super admin: is_admin en perfil O email dueño (mismo que BUILTIN_OWNER_EMAILS)
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

-- Activar todos los feature flags CMS
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

-- Super admin en Supabase (ejecutar si ya tienes cuenta registrada)
update public.profiles
set is_admin = true
where id = (
  select id from auth.users
  where lower(email) = lower('carlinperez022@gmail.com')
  limit 1
);

-- Rol CMS super_admin en perfil (si existe el usuario)
insert into public.profile_cms_roles (profile_id, role_id)
select p.id, 'super_admin'
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) = lower('carlinperez022@gmail.com')
on conflict do nothing;

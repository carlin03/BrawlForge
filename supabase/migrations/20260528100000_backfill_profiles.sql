-- Usuarios creados ANTES de la migración inicial no tienen fila en profiles.
-- Ejecuta esto en SQL Editor si ves usuarios en Auth pero no tu fila en profiles.

insert into public.profiles (id, display_name, ign)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1), 'Jugador'),
  coalesce(u.raw_user_meta_data->>'ign', split_part(u.email, '@', 1))
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

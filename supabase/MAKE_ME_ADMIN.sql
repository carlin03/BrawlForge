-- Activa admin SOLO para tu cuenta (ejecutar en Supabase → SQL Editor)
-- Sustituye el email por el que usas en /login o Google

update public.profiles
set is_admin = true
where id = (
  select id from auth.users
  where email = 'TU-EMAIL@ejemplo.com'
  limit 1
);

-- Comprobar (debe devolver is_admin = true):
-- select id, display_name, is_admin from public.profiles
-- where id = (select id from auth.users where email = 'TU-EMAIL@ejemplo.com');

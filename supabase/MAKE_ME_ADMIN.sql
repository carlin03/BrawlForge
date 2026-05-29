-- Activa admin para carlinperez022@gmail.com (ejecutar en Supabase → SQL Editor)

update public.profiles
set is_admin = true
where id = (
  select id from auth.users
  where lower(email) = lower('carlinperez022@gmail.com')
  limit 1
);

-- Comprobar:
-- select p.id, p.display_name, p.is_admin, u.email
-- from public.profiles p
-- join auth.users u on u.id = p.id
-- where lower(u.email) = lower('carlinperez022@gmail.com');

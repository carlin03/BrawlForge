-- Opcional: borrar el equipo fantasma slug "." en Supabase (la web ya lo ignora en código).
-- Ejecutar en SQL Editor si quieres limpiar la base.

delete from public.team_logo_overrides where slug in ('.', '');
delete from public.teams_catalog where slug in ('.', '');
update public.players_catalog set team_slug = null where team_slug in ('.', '');

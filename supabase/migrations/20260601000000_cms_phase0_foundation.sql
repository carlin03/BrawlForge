-- BrawlForge CMS — Fase 0: fundación (settings, flags, audit, RBAC base, nav/theme stubs)

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_cms_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin = true
  );
$$;

-- ---------------------------------------------------------------------------
-- Site settings (key → jsonb value)
-- ---------------------------------------------------------------------------

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create index if not exists site_settings_updated_idx on public.site_settings (updated_at desc);

alter table public.site_settings enable row level security;

drop policy if exists "site settings public read" on public.site_settings;
create policy "site settings public read"
  on public.site_settings for select using (true);

drop policy if exists "site settings admin write" on public.site_settings;
create policy "site settings admin write"
  on public.site_settings for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

-- ---------------------------------------------------------------------------
-- Feature flags (Strangler: off = legacy JSON/TS behavior)
-- ---------------------------------------------------------------------------

create table if not exists public.site_feature_flags (
  flag text primary key,
  enabled boolean not null default false,
  rollout_percent int not null default 100 check (rollout_percent >= 0 and rollout_percent <= 100),
  description text,
  meta jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_feature_flags enable row level security;

drop policy if exists "feature flags public read" on public.site_feature_flags;
create policy "feature flags public read"
  on public.site_feature_flags for select using (true);

drop policy if exists "feature flags admin write" on public.site_feature_flags;
create policy "feature flags admin write"
  on public.site_feature_flags for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------

create table if not exists public.cms_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  diff jsonb,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cms_audit_log_created_idx on public.cms_audit_log (created_at desc);
create index if not exists cms_audit_log_entity_idx on public.cms_audit_log (entity_type, entity_id);

alter table public.cms_audit_log enable row level security;

drop policy if exists "cms audit admin read" on public.cms_audit_log;
create policy "cms audit admin read"
  on public.cms_audit_log for select
  using (public.is_cms_admin());

drop policy if exists "cms audit admin insert" on public.cms_audit_log;
create policy "cms audit admin insert"
  on public.cms_audit_log for insert
  with check (public.is_cms_admin());

-- ---------------------------------------------------------------------------
-- RBAC foundation (maps to is_admin today; expandable in later phases)
-- ---------------------------------------------------------------------------

create table if not exists public.cms_roles (
  id text primary key,
  name text not null,
  level int not null default 0,
  description text
);

create table if not exists public.cms_permissions (
  id text primary key,
  resource text not null,
  action text not null,
  description text
);

create table if not exists public.cms_role_permissions (
  role_id text not null references public.cms_roles (id) on delete cascade,
  permission_id text not null references public.cms_permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.profile_cms_roles (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role_id text not null references public.cms_roles (id) on delete cascade,
  primary key (profile_id, role_id)
);

alter table public.cms_roles enable row level security;
alter table public.cms_permissions enable row level security;
alter table public.cms_role_permissions enable row level security;
alter table public.profile_cms_roles enable row level security;

drop policy if exists "cms roles public read" on public.cms_roles;
create policy "cms roles public read" on public.cms_roles for select using (true);

drop policy if exists "cms roles admin write" on public.cms_roles;
create policy "cms roles admin write"
  on public.cms_roles for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

drop policy if exists "cms permissions public read" on public.cms_permissions;
create policy "cms permissions public read" on public.cms_permissions for select using (true);

drop policy if exists "cms permissions admin write" on public.cms_permissions;
create policy "cms permissions admin write"
  on public.cms_permissions for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

drop policy if exists "cms role perms public read" on public.cms_role_permissions;
create policy "cms role perms public read" on public.cms_role_permissions for select using (true);

drop policy if exists "cms role perms admin write" on public.cms_role_permissions;
create policy "cms role perms admin write"
  on public.cms_role_permissions for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

drop policy if exists "profile cms roles own read" on public.profile_cms_roles;
create policy "profile cms roles own read"
  on public.profile_cms_roles for select
  using (auth.uid() = profile_id or public.is_cms_admin());

drop policy if exists "profile cms roles admin write" on public.profile_cms_roles;
create policy "profile cms roles admin write"
  on public.profile_cms_roles for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

-- ---------------------------------------------------------------------------
-- Navigation (Phase 3 prep — seed from nav-config)
-- ---------------------------------------------------------------------------

create table if not exists public.navigation_menus (
  id text primary key,
  label text not null,
  location text not null default 'header',
  meta jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  menu_id text not null references public.navigation_menus (id) on delete cascade,
  label text not null,
  href text not null,
  sort_order int not null default 0,
  accent text,
  visible boolean not null default true,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists navigation_items_menu_order_idx
  on public.navigation_items (menu_id, sort_order);

alter table public.navigation_menus enable row level security;
alter table public.navigation_items enable row level security;

drop policy if exists "navigation menus public read" on public.navigation_menus;
create policy "navigation menus public read" on public.navigation_menus for select using (true);

drop policy if exists "navigation menus admin write" on public.navigation_menus;
create policy "navigation menus admin write"
  on public.navigation_menus for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

drop policy if exists "navigation items public read" on public.navigation_items;
create policy "navigation items public read" on public.navigation_items for select using (true);

drop policy if exists "navigation items admin write" on public.navigation_items;
create policy "navigation items admin write"
  on public.navigation_items for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

-- ---------------------------------------------------------------------------
-- Theme tokens (Phase 2 prep — global set)
-- ---------------------------------------------------------------------------

create table if not exists public.theme_token_sets (
  id text primary key,
  name text not null,
  scope text not null default 'global',
  scope_id text,
  tokens jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists theme_token_sets_scope_idx on public.theme_token_sets (scope, scope_id);

alter table public.theme_token_sets enable row level security;

drop policy if exists "theme tokens public read" on public.theme_token_sets;
create policy "theme tokens public read" on public.theme_token_sets for select using (true);

drop policy if exists "theme tokens admin write" on public.theme_token_sets;
create policy "theme tokens admin write"
  on public.theme_token_sets for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

-- ---------------------------------------------------------------------------
-- CMS module registry (Studio roadmap UI)
-- ---------------------------------------------------------------------------

create table if not exists public.cms_modules (
  id text primary key,
  label text not null,
  phase text not null default '0',
  status text not null default 'active',
  description text,
  sort_order int not null default 0
);

alter table public.cms_modules enable row level security;

drop policy if exists "cms modules public read" on public.cms_modules;
create policy "cms modules public read" on public.cms_modules for select using (true);

drop policy if exists "cms modules admin write" on public.cms_modules;
create policy "cms modules admin write"
  on public.cms_modules for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

-- ---------------------------------------------------------------------------
-- Catalog admin write (Phase 0 — tournaments + fantasy market)
-- ---------------------------------------------------------------------------

drop policy if exists "tournaments catalog admin insert" on public.tournaments_catalog;
create policy "tournaments catalog admin insert"
  on public.tournaments_catalog for insert
  with check (public.is_cms_admin());

drop policy if exists "tournaments catalog admin update" on public.tournaments_catalog;
create policy "tournaments catalog admin update"
  on public.tournaments_catalog for update
  using (public.is_cms_admin());

drop policy if exists "tournaments catalog admin delete" on public.tournaments_catalog;
create policy "tournaments catalog admin delete"
  on public.tournaments_catalog for delete
  using (public.is_cms_admin());

drop policy if exists "tournament rosters admin insert" on public.tournament_team_rosters;
create policy "tournament rosters admin insert"
  on public.tournament_team_rosters for insert
  with check (public.is_cms_admin());

drop policy if exists "tournament rosters admin update" on public.tournament_team_rosters;
create policy "tournament rosters admin update"
  on public.tournament_team_rosters for update
  using (public.is_cms_admin());

drop policy if exists "tournament rosters admin delete" on public.tournament_team_rosters;
create policy "tournament rosters admin delete"
  on public.tournament_team_rosters for delete
  using (public.is_cms_admin());

drop policy if exists "fantasy market catalog admin insert" on public.fantasy_market_catalog;
create policy "fantasy market catalog admin insert"
  on public.fantasy_market_catalog for insert
  with check (public.is_cms_admin());

drop policy if exists "fantasy market catalog admin update" on public.fantasy_market_catalog;
create policy "fantasy market catalog admin update"
  on public.fantasy_market_catalog for update
  using (public.is_cms_admin());

drop policy if exists "fantasy market catalog admin delete" on public.fantasy_market_catalog;
create policy "fantasy market catalog admin delete"
  on public.fantasy_market_catalog for delete
  using (public.is_cms_admin());

-- ---------------------------------------------------------------------------
-- Seed: roles, permissions, flags (legacy off), modules, default nav/theme stubs
-- ---------------------------------------------------------------------------

insert into public.cms_roles (id, name, level, description) values
  ('super_admin', 'Super Admin', 100, 'Control total del CMS'),
  ('admin', 'Administrador', 80, 'Catálogo, contenido y configuración'),
  ('editor', 'Editor', 50, 'Noticias y media'),
  ('moderator', 'Moderador', 40, 'Partidos y resultados')
on conflict (id) do nothing;

insert into public.cms_permissions (id, resource, action, description) values
  ('catalog.read', 'catalog', 'read', 'Ver catálogo'),
  ('catalog.write', 'catalog', 'write', 'Editar equipos/jugadores/torneos'),
  ('content.write', 'content', 'write', 'Noticias y páginas'),
  ('settings.write', 'settings', 'write', 'Configuración global'),
  ('users.read', 'users', 'read', 'Ver usuarios'),
  ('studio.access', 'studio', 'access', 'Acceso BrawlForge Studio')
on conflict (id) do nothing;

insert into public.cms_role_permissions (role_id, permission_id)
select 'super_admin', id from public.cms_permissions
on conflict do nothing;

insert into public.site_feature_flags (flag, enabled, description) values
  ('cms.resolver.enabled', false, 'Master: usar capa CMS resolve (Strangler)'),
  ('cms.nav.enabled', false, 'Navegación desde navigation_items'),
  ('cms.theme.enabled', false, 'Inyectar theme_token_sets en la web'),
  ('cms.home_builder.enabled', false, 'Home Builder (Fase 4)'),
  ('cms.matches.enabled', false, 'Partidos desde matches_catalog (Fase 1)'),
  ('cms.catalog.primary', false, 'Supabase como fuente primaria de catálogo')
on conflict (flag) do nothing;

insert into public.cms_modules (id, label, phase, status, description, sort_order) values
  ('operations', 'Operaciones', '0', 'active', 'Equipos, jugadores, logos, noticias', 10),
  ('platform', 'Plataforma', '0', 'active', 'Ajustes, flags y auditoría', 20),
  ('matches', 'Partidos', '1', 'planned', 'Gestión de partidos y resultados', 30),
  ('home_builder', 'Home Builder', '4', 'planned', 'Constructor visual del inicio', 40),
  ('theme', 'Theme Engine', '2', 'planned', 'Tokens y temas por entidad', 50),
  ('fantasy_config', 'Fantasy', '7', 'planned', 'Reglas y mercado', 60),
  ('predictions_config', 'Predicciones', '7', 'planned', 'Mercados y puntos', 70),
  ('seo', 'SEO', '3', 'planned', 'Meta, OG y redirects', 80),
  ('media', 'Media', '8', 'planned', 'Biblioteca de assets', 90),
  ('automation', 'Automatización', '10', 'planned', 'Reglas y jobs', 100)
on conflict (id) do nothing;

insert into public.navigation_menus (id, label, location) values
  ('main', 'Navegación principal', 'header')
on conflict (id) do nothing;

insert into public.theme_token_sets (id, name, scope, tokens, is_active) values
  (
    'global-default',
    'BrawlForge Default',
    'global',
    '{
      "colors": {
        "bg": "#0a0c12",
        "surface": "#131824",
        "panel": "#181f2c",
        "text": "#f8fafc",
        "muted": "#9aa8bc",
        "primary": "#0099ff",
        "secondary": "#ffc82e",
        "success": "#34d06a",
        "error": "#ff1744",
        "warning": "#ffc82e"
      },
      "layout": { "maxWidth": "1240px", "navHeight": "52px", "radius": "14px" }
    }'::jsonb,
    true
  )
on conflict (id) do nothing;

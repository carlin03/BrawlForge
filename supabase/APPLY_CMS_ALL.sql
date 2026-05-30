-- BrawlForge CMS â€” Fase 0: fundaciÃ³n (settings, flags, audit, RBAC base, nav/theme stubs)

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
-- Site settings (key â†’ jsonb value)
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
-- Navigation (Phase 3 prep â€” seed from nav-config)
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
-- Theme tokens (Phase 2 prep â€” global set)
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
-- Catalog admin write (Phase 0 â€” tournaments + fantasy market)
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
  ('admin', 'Administrador', 80, 'CatÃ¡logo, contenido y configuraciÃ³n'),
  ('editor', 'Editor', 50, 'Noticias y media'),
  ('moderator', 'Moderador', 40, 'Partidos y resultados')
on conflict (id) do nothing;

insert into public.cms_permissions (id, resource, action, description) values
  ('catalog.read', 'catalog', 'read', 'Ver catÃ¡logo'),
  ('catalog.write', 'catalog', 'write', 'Editar equipos/jugadores/torneos'),
  ('content.write', 'content', 'write', 'Noticias y pÃ¡ginas'),
  ('settings.write', 'settings', 'write', 'ConfiguraciÃ³n global'),
  ('users.read', 'users', 'read', 'Ver usuarios'),
  ('studio.access', 'studio', 'access', 'Acceso BrawlForge Studio')
on conflict (id) do nothing;

insert into public.cms_role_permissions (role_id, permission_id)
select 'super_admin', id from public.cms_permissions
on conflict do nothing;

insert into public.site_feature_flags (flag, enabled, description) values
  ('cms.resolver.enabled', false, 'Master: usar capa CMS resolve (Strangler)'),
  ('cms.nav.enabled', false, 'NavegaciÃ³n desde navigation_items'),
  ('cms.theme.enabled', false, 'Inyectar theme_token_sets en la web'),
  ('cms.home_builder.enabled', false, 'Home Builder (Fase 4)'),
  ('cms.matches.enabled', false, 'Partidos desde matches_catalog (Fase 1)'),
  ('cms.catalog.primary', false, 'Supabase como fuente primaria de catÃ¡logo')
on conflict (flag) do nothing;

insert into public.cms_modules (id, label, phase, status, description, sort_order) values
  ('operations', 'Operaciones', '0', 'active', 'Equipos, jugadores, logos, noticias', 10),
  ('platform', 'Plataforma', '0', 'active', 'Ajustes, flags y auditorÃ­a', 20),
  ('matches', 'Partidos', '1', 'planned', 'GestiÃ³n de partidos y resultados', 30),
  ('home_builder', 'Home Builder', '4', 'planned', 'Constructor visual del inicio', 40),
  ('theme', 'Theme Engine', '2', 'planned', 'Tokens y temas por entidad', 50),
  ('fantasy_config', 'Fantasy', '7', 'planned', 'Reglas y mercado', 60),
  ('predictions_config', 'Predicciones', '7', 'planned', 'Mercados y puntos', 70),
  ('seo', 'SEO', '3', 'planned', 'Meta, OG y redirects', 80),
  ('media', 'Media', '8', 'planned', 'Biblioteca de assets', 90),
  ('automation', 'AutomatizaciÃ³n', '10', 'planned', 'Reglas y jobs', 100)
on conflict (id) do nothing;

insert into public.navigation_menus (id, label, location) values
  ('main', 'NavegaciÃ³n principal', 'header')
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
-- BrawlForge CMS â€” Fases 1â€“11 (schema + RLS + seeds)
-- Ejecutar despuÃ©s de 20260601000000_cms_phase0_foundation.sql

-- ===========================================================================
-- Fase 1 â€” Match Ops
-- ===========================================================================

create table if not exists public.matches_catalog (
  id text primary key,
  tournament_slug text not null,
  team_a_slug text not null,
  team_b_slug text not null,
  scheduled_at timestamptz not null,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'live', 'finished', 'cancelled')),
  stage text,
  region text,
  format text default 'Bo3',
  score_a int not null default 0,
  score_b int not null default 0,
  meta jsonb not null default '{}'::jsonb,
  published boolean not null default true,
  synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists matches_catalog_tournament_idx
  on public.matches_catalog (tournament_slug, scheduled_at);
create index if not exists matches_catalog_status_idx on public.matches_catalog (status);

create table if not exists public.match_streams (
  id uuid primary key default gen_random_uuid(),
  match_id text not null references public.matches_catalog (id) on delete cascade,
  url text not null,
  platform text,
  language text default 'es',
  is_primary boolean not null default false,
  sort_order int not null default 0
);

create table if not exists public.match_sync_state (
  match_id text primary key references public.matches_catalog (id) on delete cascade,
  source text not null default 'manual',
  cursor text,
  last_sync_at timestamptz,
  meta jsonb not null default '{}'::jsonb
);

-- ===========================================================================
-- Fase 2 â€” Theme scopes
-- ===========================================================================

create table if not exists public.theme_token_scopes (
  id uuid primary key default gen_random_uuid(),
  token_set_id text not null references public.theme_token_sets (id) on delete cascade,
  scope text not null check (scope in ('global', 'tournament', 'team', 'player', 'season')),
  scope_id text,
  tokens jsonb not null default '{}'::jsonb,
  priority int not null default 0,
  is_active boolean not null default true
);

create index if not exists theme_token_scopes_lookup_idx
  on public.theme_token_scopes (scope, scope_id, priority desc);

-- ===========================================================================
-- Fase 3 â€” SEO & routing
-- ===========================================================================

create table if not exists public.seo_entries (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  title text,
  description text,
  og_image text,
  canonical_path text,
  robots text,
  structured_data jsonb,
  meta jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_id)
);

create table if not exists public.redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique,
  to_path text not null,
  code int not null default 301,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.announcement_bars (
  id text primary key,
  message text not null,
  href text,
  accent text,
  visible_from timestamptz,
  visible_until timestamptz,
  enabled boolean not null default false,
  sort_order int not null default 0
);

create table if not exists public.legal_pages (
  slug text primary key,
  title text not null,
  body jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ===========================================================================
-- Fase 4 â€” Home Builder
-- ===========================================================================

create table if not exists public.cms_block_registry (
  block_type text primary key,
  label text not null,
  description text,
  default_props jsonb not null default '{}'::jsonb,
  phase text not null default '4'
);

create table if not exists public.cms_pages (
  slug text primary key,
  route text not null,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  meta jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_page_versions (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null references public.cms_pages (slug) on delete cascade,
  version int not null default 1,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (page_slug, version)
);

create table if not exists public.cms_sections (
  id uuid primary key default gen_random_uuid(),
  page_version_id uuid not null references public.cms_page_versions (id) on delete cascade,
  label text,
  sort_order int not null default 0,
  enabled boolean not null default true,
  meta jsonb not null default '{}'::jsonb
);

create table if not exists public.cms_section_schedule (
  section_id uuid primary key references public.cms_sections (id) on delete cascade,
  visible_from timestamptz,
  visible_until timestamptz,
  timezone text default 'UTC'
);

create table if not exists public.cms_blocks (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.cms_sections (id) on delete cascade,
  block_type text not null references public.cms_block_registry (block_type),
  sort_order int not null default 0,
  enabled boolean not null default true,
  props jsonb not null default '{}'::jsonb
);

create table if not exists public.cms_block_templates (
  id text primary key,
  block_type text not null references public.cms_block_registry (block_type),
  name text not null,
  props jsonb not null default '{}'::jsonb
);

-- ===========================================================================
-- Fase 5 â€” News CMS extendido
-- ===========================================================================

create table if not exists public.news_categories (
  id text primary key,
  label text not null,
  sort_order int not null default 0
);

create table if not exists public.news_tags (
  id text primary key,
  label text not null
);

create table if not exists public.news_tag_links (
  news_slug text not null,
  tag_id text not null references public.news_tags (id) on delete cascade,
  primary key (news_slug, tag_id)
);

-- ===========================================================================
-- Fase 6 â€” Card Builder
-- ===========================================================================

create table if not exists public.card_templates (
  id text primary key,
  entity_type text not null,
  name text not null,
  layout jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.card_template_assignments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_slug text,
  template_id text not null references public.card_templates (id) on delete cascade,
  priority int not null default 0
);

create table if not exists public.card_field_visibility (
  template_id text not null references public.card_templates (id) on delete cascade,
  field_key text not null,
  visible boolean not null default true,
  primary key (template_id, field_key)
);

-- ===========================================================================
-- Fase 7 â€” Fantasy & Predictions config
-- ===========================================================================

create table if not exists public.fantasy_seasons (
  id text primary key,
  name text not null,
  tournament_slug text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default false,
  meta jsonb not null default '{}'::jsonb
);

create table if not exists public.fantasy_rulesets (
  id text primary key,
  season_id text references public.fantasy_seasons (id) on delete cascade,
  budget int not null default 50000000,
  squad_size int not null default 5,
  captain_multiplier numeric not null default 2,
  transfers_per_gameweek int not null default 2,
  rules jsonb not null default '{}'::jsonb,
  is_active boolean not null default true
);

create table if not exists public.fantasy_gameweeks (
  id text primary key,
  season_id text not null references public.fantasy_seasons (id) on delete cascade,
  label text not null,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  is_locked boolean not null default false
);

create table if not exists public.prediction_scoring (
  id text primary key default 'default',
  base_points int not null default 10,
  streak_bonus jsonb not null default '{}'::jsonb,
  rules jsonb not null default '{}'::jsonb,
  is_active boolean not null default true
);

create table if not exists public.prediction_markets (
  id text primary key,
  match_id text references public.matches_catalog (id) on delete set null,
  label text not null,
  status text not null default 'open',
  opens_at timestamptz,
  closes_at timestamptz,
  meta jsonb not null default '{}'::jsonb
);

create table if not exists public.prediction_events (
  id text primary key,
  slug text not null unique,
  title text not null,
  status text not null default 'upcoming',
  starts_at timestamptz,
  ends_at timestamptz,
  config jsonb not null default '{}'::jsonb
);

-- ===========================================================================
-- Fase 8 â€” Media DAM
-- ===========================================================================

create table if not exists public.media_folders (
  id text primary key,
  name text not null,
  parent_id text references public.media_folders (id) on delete set null
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  folder_id text references public.media_folders (id) on delete set null,
  name text not null,
  asset_type text not null default 'image',
  storage_path text,
  public_url text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.media_usages (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.media_assets (id) on delete cascade,
  entity_type text not null,
  entity_id text not null
);

-- ===========================================================================
-- Fase 9 â€” Circuits & relations
-- ===========================================================================

create table if not exists public.circuits (
  id text primary key,
  name text not null,
  year int,
  meta jsonb not null default '{}'::jsonb
);

create table if not exists public.circuit_tournaments (
  circuit_id text not null references public.circuits (id) on delete cascade,
  tournament_slug text not null,
  sort_order int not null default 0,
  primary key (circuit_id, tournament_slug)
);

create table if not exists public.home_curated_config (
  id text primary key default 'default',
  club_slugs jsonb not null default '[]'::jsonb,
  match_limits jsonb not null default '{"live":8,"upcoming":8,"results":8}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ===========================================================================
-- Fase 10 â€” Automation
-- ===========================================================================

create table if not exists public.automation_rules (
  id text primary key,
  name text not null,
  trigger_type text not null,
  trigger_config jsonb not null default '{}'::jsonb,
  action_type text not null,
  action_config jsonb not null default '{}'::jsonb,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  rule_id text not null references public.automation_rules (id) on delete cascade,
  status text not null default 'pending',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  log jsonb not null default '{}'::jsonb
);

create table if not exists public.scheduled_jobs (
  id text primary key,
  cron_expr text not null,
  handler text not null,
  enabled boolean not null default false,
  meta jsonb not null default '{}'::jsonb
);

-- ===========================================================================
-- Fase 11 â€” Future fantasy slots (stub)
-- ===========================================================================

create table if not exists public.fantasy_future_slots (
  id uuid primary key default gen_random_uuid(),
  season_id text references public.fantasy_seasons (id) on delete cascade,
  slot_type text not null,
  config jsonb not null default '{}'::jsonb
);

-- ===========================================================================
-- RLS (public read published, admin write)
-- ===========================================================================

alter table public.matches_catalog enable row level security;
alter table public.match_streams enable row level security;
alter table public.match_sync_state enable row level security;
alter table public.theme_token_scopes enable row level security;
alter table public.seo_entries enable row level security;
alter table public.redirects enable row level security;
alter table public.announcement_bars enable row level security;
alter table public.legal_pages enable row level security;
alter table public.cms_block_registry enable row level security;
alter table public.cms_pages enable row level security;
alter table public.cms_page_versions enable row level security;
alter table public.cms_sections enable row level security;
alter table public.cms_section_schedule enable row level security;
alter table public.cms_blocks enable row level security;
alter table public.cms_block_templates enable row level security;
alter table public.news_categories enable row level security;
alter table public.news_tags enable row level security;
alter table public.news_tag_links enable row level security;
alter table public.card_templates enable row level security;
alter table public.card_template_assignments enable row level security;
alter table public.card_field_visibility enable row level security;
alter table public.fantasy_seasons enable row level security;
alter table public.fantasy_rulesets enable row level security;
alter table public.fantasy_gameweeks enable row level security;
alter table public.prediction_scoring enable row level security;
alter table public.prediction_markets enable row level security;
alter table public.prediction_events enable row level security;
alter table public.media_folders enable row level security;
alter table public.media_assets enable row level security;
alter table public.media_usages enable row level security;
alter table public.circuits enable row level security;
alter table public.circuit_tournaments enable row level security;
alter table public.home_curated_config enable row level security;
alter table public.automation_rules enable row level security;
alter table public.automation_runs enable row level security;
alter table public.scheduled_jobs enable row level security;
alter table public.fantasy_future_slots enable row level security;

-- matches
drop policy if exists "matches catalog public read" on public.matches_catalog;
create policy "matches catalog public read"
  on public.matches_catalog for select using (published = true);

drop policy if exists "matches catalog admin write" on public.matches_catalog;
create policy "matches catalog admin write"
  on public.matches_catalog for all
  using (public.is_cms_admin()) with check (public.is_cms_admin());

drop policy if exists "match streams public read" on public.match_streams;
create policy "match streams public read" on public.match_streams for select using (true);

drop policy if exists "match streams admin write" on public.match_streams;
create policy "match streams admin write"
  on public.match_streams for all
  using (public.is_cms_admin()) with check (public.is_cms_admin());

-- macro for cms tables: public read + admin write
do $$
declare
  t text;
begin
  foreach t in array array[
    'match_sync_state','theme_token_scopes','seo_entries','redirects','announcement_bars','legal_pages',
    'cms_block_registry','cms_pages','cms_page_versions','cms_sections','cms_section_schedule','cms_blocks','cms_block_templates',
    'news_categories','news_tags','news_tag_links',
    'card_templates','card_template_assignments','card_field_visibility',
    'fantasy_seasons','fantasy_rulesets','fantasy_gameweeks','prediction_scoring','prediction_markets','prediction_events',
    'media_folders','media_assets','media_usages','circuits','circuit_tournaments','home_curated_config',
    'automation_rules','automation_runs','scheduled_jobs','fantasy_future_slots'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || ' public read', t);
    execute format(
      'create policy %I on public.%I for select using (true)',
      t || ' public read', t
    );
    execute format('drop policy if exists %I on public.%I', t || ' admin write', t);
    execute format(
      'create policy %I on public.%I for all using (public.is_cms_admin()) with check (public.is_cms_admin())',
      t || ' admin write', t
    );
  end loop;
end $$;

-- cms_pages: only published readable for anon (draft admin only via is_cms_admin on write; read all for simplicity in phase 4)
drop policy if exists "cms pages public read" on public.cms_pages;
create policy "cms pages public read" on public.cms_pages for select using (status = 'published' or public.is_cms_admin());

-- ===========================================================================
-- Seeds: flags, modules, block registry, defaults
-- ===========================================================================

insert into public.site_feature_flags (flag, enabled, description) values
  ('cms.seo.enabled', false, 'SEO entries y redirects (Fase 3)'),
  ('cms.cards.enabled', false, 'Card templates (Fase 6)'),
  ('cms.fantasy_config.enabled', false, 'Reglas fantasy desde CMS (Fase 7)'),
  ('cms.predictions_config.enabled', false, 'Scoring predicciones CMS (Fase 7)'),
  ('cms.media.enabled', false, 'Media DAM (Fase 8)'),
  ('cms.automation.enabled', false, 'Reglas automatizaciÃ³n (Fase 10)')
on conflict (flag) do nothing;

update public.cms_modules set status = 'active', phase = '1' where id = 'matches';
update public.cms_modules set status = 'active', phase = '2' where id = 'theme';
update public.cms_modules set status = 'active', phase = '3' where id = 'seo';
update public.cms_modules set status = 'active', phase = '4' where id = 'home_builder';
update public.cms_modules set status = 'active', phase = '7' where id in ('fantasy_config', 'predictions_config');
update public.cms_modules set status = 'active', phase = '8' where id = 'media';
update public.cms_modules set status = 'active', phase = '10' where id = 'automation';

insert into public.cms_modules (id, label, phase, status, description, sort_order) values
  ('news_cms', 'Noticias CMS', '5', 'active', 'CategorÃ­as, tags y workflow', 45),
  ('cards', 'Card Builder', '6', 'active', 'Plantillas de cards', 55)
on conflict (id) do update set status = 'active', phase = excluded.phase;

insert into public.cms_block_registry (block_type, label, description, default_props, phase) values
  ('hero', 'Hero principal', 'Cabecera home', '{"variant":"default"}', '4'),
  ('clubs_marquee', 'Marquee clubes BSC', 'Strip de logos', '{"slugs":[]}', '4'),
  ('matches_strip', 'Strip partidos', 'Live/upcoming/results', '{"limit":8}', '4'),
  ('vote_strip', 'VotaciÃ³n comunidad', 'Predicciones home', '{}', '4'),
  ('news', 'Noticias', 'Ãšltimas noticias', '{"limit":6}', '4'),
  ('tournaments', 'Torneos', 'Grid torneos home', '{"limit":12}', '4'),
  ('fantasy_teaser', 'Fantasy teaser', 'Widget fantasy', '{}', '4'),
  ('rankings_teaser', 'Rankings teaser', 'Widget rankings', '{}', '4'),
  ('custom_json', 'JSON custom', 'Bloque avanzado', '{}', '4')
on conflict (block_type) do nothing;

insert into public.prediction_scoring (id, base_points, streak_bonus, rules, is_active) values
  (
    'default',
    10,
    '{"3":5,"5":10}',
    '{"correct_winner":10,"points_group":35,"points_quarter":55,"points_semi":70,"points_final":85}',
    true
  )
on conflict (id) do update set
  rules = excluded.rules,
  streak_bonus = excluded.streak_bonus,
  is_active = true;

insert into public.fantasy_seasons (id, name, tournament_slug, is_active) values
  ('bsc-2026', 'BSC 2026', 'world-finals-2026', true)
on conflict (id) do nothing;

insert into public.fantasy_rulesets (id, season_id, budget, squad_size, captain_multiplier, transfers_per_gameweek, rules) values
  ('bsc-2026-default', 'bsc-2026', 50000000, 5, 2, 2, '{"source":"legacy"}')
on conflict (id) do nothing;

insert into public.circuits (id, name, year) values
  ('bsc-2026', 'Brawl Stars Championship 2026', 2026)
on conflict (id) do nothing;

insert into public.home_curated_config (id, club_slugs, match_limits) values
  (
    'default',
    '["sk-gaming","team-heretics","hmble","fut-esports","natus-vincere","totem-esports","big","crazy-raccoon","zeta-division","reject","skcalalas-ea","tribe-gaming","kds-esports","loud","skcalalas","new-heights-gaming","kaioperro","only-realm","bounty-hunters-esports"]'::jsonb,
    '{"live":8,"upcoming":8,"results":8}'::jsonb
  )
on conflict (id) do nothing;

insert into public.news_categories (id, label, sort_order) values
  ('Esports', 'Esports', 0),
  ('BSC', 'BSC', 10),
  ('Fantasy', 'Fantasy', 20),
  ('Community', 'Community', 30)
on conflict (id) do nothing;

insert into public.card_templates (id, entity_type, name, layout, is_default) values
  ('team-default', 'team', 'Equipo estÃ¡ndar', '{"variant":"platform"}', true),
  ('player-default', 'player', 'Jugador estÃ¡ndar', '{"variant":"platform"}', true)
on conflict (id) do nothing;

insert into public.automation_rules (id, name, trigger_type, action_type, enabled, trigger_config, action_config) values
  (
    'match-publish-prediction',
    'Crear mercado al publicar partido',
    'match.published',
    'prediction_market.create',
    false,
    '{}',
    '{}'
  )
on conflict (id) do nothing;

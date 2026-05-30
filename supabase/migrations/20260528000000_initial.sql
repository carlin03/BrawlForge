-- BrawlForge: perfiles, overrides de logos, admin

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Jugador',
  ign text,
  favorite_team_slug text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_logo_overrides (
  slug text primary key,
  public_url text not null,
  treatment text not null default 'strip-white',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

create table if not exists public.tournament_logo_overrides (
  slug text primary key,
  public_url text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

alter table public.profiles enable row level security;
alter table public.team_logo_overrides enable row level security;
alter table public.tournament_logo_overrides enable row level security;

create policy "profiles read own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles update own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "team logos public read"
  on public.team_logo_overrides for select
  using (true);

create policy "tournament logos public read"
  on public.tournament_logo_overrides for select
  using (true);

create or replace function public.is_cms_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return false;
  end if;
  return exists (
    select 1 from public.profiles p
    where p.id = v_uid and coalesce(p.is_admin, false) = true
  );
end;
$$;

grant execute on function public.is_cms_admin() to anon, authenticated, service_role;

create policy "team logos admin write"
  on public.team_logo_overrides for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

create policy "tournament logos admin write"
  on public.tournament_logo_overrides for all
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, ign)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Jugador'),
    coalesce(new.raw_user_meta_data->>'ign', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

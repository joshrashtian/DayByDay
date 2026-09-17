-- ---------------------------------------------------------------------------
-- 0200 · Profiles
--
-- One row per auth user. Mirrors the `Profile` type in src/providers/
-- ProfileProvider.tsx and is the row every other table hangs off of.
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  display_name text,
  avatar_url   text,
  -- Public handle for the social screen. Case-insensitive-unique via the
  -- lower() index below; null until the user picks one.
  username     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is
  'Public-facing user record. 1:1 with auth.users.';

create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username))
  where username is not null;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ── Auto-create a profile when a user signs up ────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill for users that already exist (re-runnable).
insert into public.profiles (id, email, display_name)
select u.id, u.email, split_part(coalesce(u.email, ''), '@', 1)
from auth.users u
on conflict (id) do nothing;

-- ── RLS ───────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;

-- Profiles are readable by any signed-in user so the social screen can show
-- names/avatars. Tighten this to `auth.uid() = id` if you'd rather keep them
-- private until friend requests exist.
drop policy if exists "profiles: read for authenticated" on public.profiles;
create policy "profiles: read for authenticated"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles: delete own" on public.profiles;
create policy "profiles: delete own"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = id);

grant select, insert, update, delete on public.profiles to authenticated;

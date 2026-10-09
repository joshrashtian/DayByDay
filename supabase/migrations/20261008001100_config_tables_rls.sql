-- ---------------------------------------------------------------------------
-- 1100 · Bring a hand-made user_categories in line with 0400
--
-- 0400 uses `create table if not exists`, so a user_categories table created
-- by hand in the dashboard was skipped: RLS on, no policies, and every insert
-- failed with 42501. This adds whatever 0400 would have: missing columns,
-- defaults, the per-user name index and the owner-only policies.
-- Safe to run on a database that is already correct. Needs no other migration.
-- ---------------------------------------------------------------------------

alter table public.user_categories
  add column if not exists user_id    uuid references auth.users (id) on delete cascade,
  add column if not exists color      text,
  add column if not exists icon       text,
  add column if not exists sort_order integer,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

alter table public.user_categories
  alter column id         set default gen_random_uuid(),
  alter column user_id    set default auth.uid(),
  alter column color      set default '#64748b',
  alter column sort_order set default 0,
  alter column created_at set default now(),
  alter column updated_at set default now();

update public.user_categories set color      = '#64748b' where color      is null;
update public.user_categories set sort_order = 0         where sort_order is null;
update public.user_categories set created_at = now()     where created_at is null;
update public.user_categories set updated_at = now()     where updated_at is null;

alter table public.user_categories
  alter column name       set not null,
  alter column color      set not null,
  alter column sort_order set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

-- Rows made without an owner are invisible under RLS anyway; only enforce
-- NOT NULL once there are none, rather than deleting anything here.
do $$
begin
  if not exists (select 1 from public.user_categories where user_id is null) then
    alter table public.user_categories alter column user_id set not null;
  else
    raise notice 'user_categories has rows with no user_id; user_id left nullable';
  end if;
end $$;

create unique index if not exists user_categories_user_name_key
  on public.user_categories (user_id, name);

-- ── RLS ───────────────────────────────────────────────────────────────────

alter table public.user_categories enable row level security;

drop policy if exists "user_categories: select own" on public.user_categories;
create policy "user_categories: select own" on public.user_categories
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_categories: insert own" on public.user_categories;
create policy "user_categories: insert own" on public.user_categories
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_categories: update own" on public.user_categories;
create policy "user_categories: update own" on public.user_categories
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_categories: delete own" on public.user_categories;
create policy "user_categories: delete own" on public.user_categories
  for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.user_categories to authenticated;

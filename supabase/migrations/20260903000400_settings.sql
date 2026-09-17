-- ---------------------------------------------------------------------------
-- 0400 · Settings, blocks, categories, custom sounds
--
-- The cloud form of `settingsStore` (localStorage key "risebyday-settings").
-- blockConfigs and categoryConfigs get real tables because tasks reference
-- them by name and the CLI / mobile clients will want to query them; the
-- remaining prefs stay as columns on a single settings row per user.
-- ---------------------------------------------------------------------------

-- ── Blocks (time-of-day ranges) ───────────────────────────────────────────

create table if not exists public.user_blocks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid()
                  references auth.users (id) on delete cascade,
  name          text not null,
  -- Minutes from local midnight. end < start means the block wraps past
  -- midnight (e.g. "Night" 22:00 → 02:00), which the app supports.
  start_minutes integer not null,
  end_minutes   integer not null,
  color         text,   -- hex, e.g. '#ee6c2b'
  icon          text,   -- id from CATEGORY_ICON_OPTIONS
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint user_blocks_name_not_blank check (length(btrim(name)) > 0),
  constraint user_blocks_start_range check (start_minutes between 0 and 1439),
  constraint user_blocks_end_range   check (end_minutes   between 0 and 1440)
);

create unique index if not exists user_blocks_user_name_key
  on public.user_blocks (user_id, name);

drop trigger if exists user_blocks_touch_updated_at on public.user_blocks;
create trigger user_blocks_touch_updated_at
  before update on public.user_blocks
  for each row execute function public.touch_updated_at();

-- ── Categories ────────────────────────────────────────────────────────────

create table if not exists public.user_categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid()
               references auth.users (id) on delete cascade,
  name       text not null,
  color      text not null default '#64748b',
  icon       text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_categories_name_not_blank check (length(btrim(name)) > 0)
);

create unique index if not exists user_categories_user_name_key
  on public.user_categories (user_id, name);

drop trigger if exists user_categories_touch_updated_at on public.user_categories;
create trigger user_categories_touch_updated_at
  before update on public.user_categories
  for each row execute function public.touch_updated_at();

-- ── Keep tasks pointing at renamed blocks / categories ────────────────────
-- tasks.block and tasks.category hold names, not ids. Renaming a config would
-- otherwise orphan every task that referenced it.

create or replace function public.rename_tasks_block()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.name is distinct from old.name then
    update public.tasks
       set block = new.name
     where user_id = new.user_id and block = old.name;
  end if;
  return new;
end;
$$;

drop trigger if exists user_blocks_rename_cascade on public.user_blocks;
create trigger user_blocks_rename_cascade
  after update of name on public.user_blocks
  for each row execute function public.rename_tasks_block();

create or replace function public.rename_tasks_category()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.name is distinct from old.name then
    update public.tasks
       set category = new.name
     where user_id = new.user_id and category = old.name;
  end if;
  return new;
end;
$$;

drop trigger if exists user_categories_rename_cascade on public.user_categories;
create trigger user_categories_rename_cascade
  after update of name on public.user_categories
  for each row execute function public.rename_tasks_category();

-- ── Custom task-click sounds ──────────────────────────────────────────────
-- The desktop app stores these as base64 data URLs. That works but bloats
-- rows fast; prefer uploading to a Storage bucket and filling storage_path
-- instead, leaving data_url null.

create table if not exists public.custom_sounds (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid()
                 references auth.users (id) on delete cascade,
  name         text not null,
  mime_type    text not null,
  data_url     text,
  storage_path text,
  created_at   timestamptz not null default now(),

  constraint custom_sounds_has_payload check (
    data_url is not null or storage_path is not null
  )
);

create index if not exists custom_sounds_user_idx
  on public.custom_sounds (user_id);

-- ── One settings row per user ─────────────────────────────────────────────

create table if not exists public.user_settings (
  user_id                       uuid primary key default auth.uid()
                                  references auth.users (id) on delete cascade,

  theme                         text not null default 'system',
  day_transition_enabled        boolean not null default false,
  zoom_level                    real not null default 1,

  -- { open, width, mode: 'tasks'|'social'|'apps', taskOrder, socialOrder, appOrder }
  sidebar                       jsonb not null default
    '{"open":true,"width":220,"mode":"tasks","taskOrder":[],"socialOrder":[],"appOrder":[]}'::jsonb,

  pinned_toolkit_panels         text[] not null default '{}',

  -- { lat, lon } — null means "use the device's location"
  weather_coords                jsonb,

  -- { soundEnabled, volume, taskClickSoundId }
  audio_prefs                   jsonb not null default
    '{"soundEnabled":true,"volume":80,"taskClickSoundId":"builtin:happy"}'::jsonb,

  -- Global calendar-import prefs (not per provider).
  calendar_import_past_months   integer not null default 1,
  calendar_import_future_months integer not null default 3,
  ics_last_import_at            timestamptz,
  ics_last_import_count         integer,

  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now(),

  constraint user_settings_theme check (theme in ('light', 'dark', 'system')),
  constraint user_settings_zoom  check (zoom_level between 0.7 and 1.6)
);

comment on table public.user_settings is
  'Cloud mirror of settingsStore. One row per user; upsert on user_id.';

drop trigger if exists user_settings_touch_updated_at on public.user_settings;
create trigger user_settings_touch_updated_at
  before update on public.user_settings
  for each row execute function public.touch_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────
-- Same owner-only shape for all four tables.

do $$
declare
  t text;
begin
  foreach t in array array[
    'user_blocks', 'user_categories', 'custom_sounds', 'user_settings'
  ] loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "%s: select own" on public.%I', t, t);
    execute format(
      'create policy "%s: select own" on public.%I for select to authenticated
         using (auth.uid() = user_id)', t, t);

    execute format('drop policy if exists "%s: insert own" on public.%I', t, t);
    execute format(
      'create policy "%s: insert own" on public.%I for insert to authenticated
         with check (auth.uid() = user_id)', t, t);

    execute format('drop policy if exists "%s: update own" on public.%I', t, t);
    execute format(
      'create policy "%s: update own" on public.%I for update to authenticated
         using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);

    execute format('drop policy if exists "%s: delete own" on public.%I', t, t);
    execute format(
      'create policy "%s: delete own" on public.%I for delete to authenticated
         using (auth.uid() = user_id)', t, t);

    execute format(
      'grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

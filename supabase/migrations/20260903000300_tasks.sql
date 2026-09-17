-- ---------------------------------------------------------------------------
-- 0300 · Tasks
--
-- Column-for-column mirror of the `Task` type in src/types/index.ts, in the
-- snake_case shape the sync layer (src/lib/tasksSync.ts) already speaks.
--
-- Two deliberate choices worth knowing before you build on this:
--
--   1. Soft deletes. Deleting a task writes `deleted_at` instead of removing
--      the row, so other devices can learn about the delete on their next
--      delta pull. Purge tombstones with the housekeeping query at the bottom.
--   2. Client-owned `updated_at`. There is NO touch trigger on this table.
--      The client sets updated_at and sync uses it both as the delta cursor
--      (`.gt("updated_at", lastPulledAt)`) and as the last-write-wins token.
--      If you'd rather trust server time, see the commented trigger below —
--      but then also switch the client to store the server's timestamp as its
--      cursor, or clock skew will make it skip rows.
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.task_kind as enum
    ('task', 'event', 'reminder', 'habit', 'class', 'ics');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.task_priority as enum ('low', 'medium', 'high');
exception when duplicate_object then null;
end $$;

-- Adding a kind later:  alter type public.task_kind add value 'goal';
-- (must run outside a transaction block — run it on its own in the SQL editor)

create table if not exists public.tasks (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid()
                        references auth.users (id) on delete cascade,

  kind                public.task_kind not null default 'task',
  title               text not null default '',
  done                boolean not null default false,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  due_date            timestamptz,
  end_date            timestamptz,

  priority            public.task_priority,
  critical            boolean,

  -- Blocks and categories are referenced by name, matching the app model.
  -- Renames are handled by the triggers in 0400, which rewrite these columns.
  block               text,
  category            text,

  description         text,
  notes               text,
  tags                text[],

  -- { class?: { location?: string; grade?: string } }
  metadata            jsonb,

  -- { frequency, interval, weekdays?: number[], untilDate?: iso string }
  recurrence          jsonb,
  last_completed_at   timestamptz,
  -- Template this occurrence was spawned from. Intentionally NOT a foreign
  -- key: the template may be deleted or may not have synced yet.
  recurring_source_id uuid,

  -- Stable UID from an imported .ics event; unique per user for dedup.
  ics_uid             text,

  -- Relational form of Task.children_tasks. DEFERRABLE so a parent and its
  -- children can arrive in the same upsert batch in any order.
  parent_id           uuid references public.tasks (id) on delete cascade
                        deferrable initially deferred,

  -- Soft delete tombstone.
  deleted_at          timestamptz,

  constraint tasks_recurrence_shape check (
    recurrence is null
    or (recurrence ? 'frequency' and recurrence ? 'interval')
  ),
  constraint tasks_not_own_parent check (parent_id is distinct from id)
);

comment on table public.tasks is
  'All user tasks, events, reminders, habits, classes and imported ICS events.';
comment on column public.tasks.updated_at is
  'Client-owned. Delta-sync cursor and last-write-wins token; no server trigger.';
comment on column public.tasks.deleted_at is
  'Soft-delete tombstone so peers can observe the delete on their next pull.';

-- Add columns if the table predates this migration.
alter table public.tasks add column if not exists parent_id uuid;
alter table public.tasks add column if not exists deleted_at timestamptz;

-- Delta pull: .eq(user_id).gt(updated_at, cursor)
create index if not exists tasks_user_updated_idx
  on public.tasks (user_id, updated_at desc);

-- Day / calendar views.
create index if not exists tasks_user_due_idx
  on public.tasks (user_id, due_date)
  where deleted_at is null;

create index if not exists tasks_user_block_idx
  on public.tasks (user_id, block)
  where deleted_at is null and block is not null;

create index if not exists tasks_user_category_idx
  on public.tasks (user_id, category)
  where deleted_at is null and category is not null;

create index if not exists tasks_parent_idx
  on public.tasks (parent_id)
  where parent_id is not null;

-- ICS re-import dedup. Scoped to live rows so an event the user deleted can be
-- imported again later instead of colliding with its own tombstone.
create unique index if not exists tasks_user_ics_uid_key
  on public.tasks (user_id, ics_uid)
  where ics_uid is not null and deleted_at is null;

-- Optional: let the server own updated_at instead of the client.
-- drop trigger if exists tasks_touch_updated_at on public.tasks;
-- create trigger tasks_touch_updated_at
--   before update on public.tasks
--   for each row execute function public.touch_updated_at();

-- Convenience view for CLI / scripts: live tasks only. security_invoker keeps
-- the caller's RLS in force, so this is not a way around the policies below.
-- (security_invoker needs Postgres 15+, which every current Supabase project is.)
-- Dropped first rather than CREATE OR REPLACE: `select *` means the column list
-- changes whenever the table does, which a replace refuses to do.
drop view if exists public.active_tasks;
create view public.active_tasks
  with (security_invoker = on)
  as select * from public.tasks where deleted_at is null;

-- ── RLS ───────────────────────────────────────────────────────────────────

alter table public.tasks enable row level security;

drop policy if exists "tasks: select own" on public.tasks;
create policy "tasks: select own"
  on public.tasks for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "tasks: insert own" on public.tasks;
create policy "tasks: insert own"
  on public.tasks for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "tasks: update own" on public.tasks;
create policy "tasks: update own"
  on public.tasks for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "tasks: delete own" on public.tasks;
create policy "tasks: delete own"
  on public.tasks for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.tasks to authenticated;
grant select on public.active_tasks to authenticated;

-- ── Housekeeping ──────────────────────────────────────────────────────────
-- Tombstones only need to outlive the slowest device's sync interval. Run
-- this on a schedule (pg_cron) or by hand:
--
--   delete from public.tasks
--   where deleted_at is not null and deleted_at < now() - interval '90 days';

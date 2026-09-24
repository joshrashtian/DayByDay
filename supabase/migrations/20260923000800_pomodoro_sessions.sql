-- ---------------------------------------------------------------------------
-- 0800 · Pomodoro sessions
--
-- One row per focus session. Written by the API (`POST /pomodoroapi/pomodoro/
-- session/start` and `/session/end`), which forwards the caller's JWT, so RLS
-- below is what scopes rows to their owner.
--
--   * `id` is client-generated (uuid). The client creates it at session start
--     so `/session/end` can name the same row, and so a retried start after a
--     lost response is an idempotent upsert rather than a duplicate.
--   * `end_time is null` means the session is still in progress.
--   * `focused_task_id` is intentionally NOT a foreign key: the task may not
--     have synced yet, or may be deleted later.
-- ---------------------------------------------------------------------------

-- The first version of this table was created by hand in the dashboard with a
-- bigint identity id. Replace it, but only while it's still empty.
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pomodoro_sessions'
      and column_name = 'id' and data_type = 'bigint'
  ) then
    if exists (select 1 from public.pomodoro_sessions) then
      raise exception 'pomodoro_sessions has a bigint id and is not empty; migrate its rows by hand';
    end if;
    drop table public.pomodoro_sessions;
  end if;
end $$;

create table if not exists public.pomodoro_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid()
                     references auth.users (id) on delete cascade,
  created_at       timestamptz not null default now(),

  start_time       timestamptz not null,
  end_time         timestamptz,

  focused_task_id  uuid,

  constraint pomodoro_sessions_ends_after_start
    check (end_time is null or end_time >= start_time)
);

comment on table public.pomodoro_sessions is
  'Pomodoro focus sessions. end_time is null while a session is in progress.';

create index if not exists pomodoro_sessions_user_start_idx
  on public.pomodoro_sessions (user_id, start_time desc);

create index if not exists pomodoro_sessions_task_idx
  on public.pomodoro_sessions (focused_task_id)
  where focused_task_id is not null;

-- ── RLS ───────────────────────────────────────────────────────────────────

alter table public.pomodoro_sessions enable row level security;

drop policy if exists "pomodoro_sessions: select own" on public.pomodoro_sessions;
create policy "pomodoro_sessions: select own"
  on public.pomodoro_sessions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "pomodoro_sessions: insert own" on public.pomodoro_sessions;
create policy "pomodoro_sessions: insert own"
  on public.pomodoro_sessions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "pomodoro_sessions: update own" on public.pomodoro_sessions;
create policy "pomodoro_sessions: update own"
  on public.pomodoro_sessions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "pomodoro_sessions: delete own" on public.pomodoro_sessions;
create policy "pomodoro_sessions: delete own"
  on public.pomodoro_sessions for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.pomodoro_sessions to authenticated;

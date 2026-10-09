-- Replaces a stray `tasks_user_ics_uid_idx` created outside these migrations.
-- If it was built without the `deleted_at is null` predicate, a tombstoned ICS
-- row blocks the same event from ever being imported again. The canonical
-- index from 20260903000300_tasks.sql is (re)created so this file stands alone.
drop index if exists public.tasks_user_ics_uid_idx;

create unique index if not exists tasks_user_ics_uid_key
  on public.tasks (user_id, ics_uid)
  where ics_uid is not null and deleted_at is null;

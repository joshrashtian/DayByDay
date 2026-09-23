-- ---------------------------------------------------------------------------
-- 0700 · Purge old task tombstones
--
-- Deletes are soft (see 0300): a deleted task keeps its row with deleted_at
-- set so other devices observe the delete on their next pull. After 30 days
-- the tombstone has done its job, so a nightly pg_cron job hard-deletes it.
--
-- Caveat: a device that hasn't synced for longer than 30 days never sees the
-- tombstone and keeps its local copy of the task.
--
-- Safe to re-run: cron.schedule() with an existing job name replaces the job.
-- ---------------------------------------------------------------------------

create extension if not exists pg_cron;

select cron.schedule(
  'purge-task-tombstones',
  '0 4 * * *',  -- daily at 04:00 UTC
  $$delete from public.tasks where deleted_at < now() - interval '30 days'$$
);

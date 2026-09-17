-- ---------------------------------------------------------------------------
-- 0600 · Realtime
--
-- Adds the tables worth pushing live to other devices. RLS still applies to
-- realtime, so a client only receives rows it could have selected.
--
-- Subscribe from any client:
--   supabase.channel('tasks')
--     .on('postgres_changes',
--         { event: '*', schema: 'public', table: 'tasks',
--           filter: `user_id=eq.${userId}` },
--         handler)
--     .subscribe()
--
-- Drop this file if you'd rather stick to interval-based delta pulls.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'tasks', 'user_blocks', 'user_categories', 'user_settings'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;   -- already in the publication
      when undefined_object then null;   -- publication absent (plain Postgres)
    end;
  end loop;
end $$;

-- REPLICA IDENTITY FULL makes DELETE/UPDATE payloads carry the old row, which
-- realtime's RLS check needs in order to deliver them. Costs a little WAL.
alter table public.tasks           replica identity full;
alter table public.user_blocks     replica identity full;
alter table public.user_categories replica identity full;
alter table public.user_settings   replica identity full;

-- ---------------------------------------------------------------------------
-- 0100 · Extensions + shared helpers
--
-- Safe to run on an existing project; every statement is idempotent.
-- Apply order: 0100 → 0200 → 0300 → 0400 → 0500 → 0600
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto" with schema extensions;   -- gen_random_uuid()

-- Sets updated_at on every UPDATE. Attached to tables whose timestamps are
-- owned by the server. NOT attached to public.tasks: the sync client owns
-- tasks.updated_at and uses it as the last-write-wins token (see 0300).
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.touch_updated_at is
  'Trigger helper: stamps NEW.updated_at with now() on UPDATE.';

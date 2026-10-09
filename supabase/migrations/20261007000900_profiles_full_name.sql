-- ---------------------------------------------------------------------------
-- 0900 · Profiles: full_name
--
-- The user's real name, separate from `display_name` (what the social screen
-- shows) and `username` (the public handle). Null until the user or their
-- sign-up metadata provides one.
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists full_name text;

-- Fill it on sign-up from the same metadata keys `display_name` falls back to.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Backfill existing users from their auth metadata (re-runnable: only touches
-- rows that are still null).
update public.profiles p
set full_name = coalesce(
  u.raw_user_meta_data ->> 'full_name',
  u.raw_user_meta_data ->> 'name'
)
from auth.users u
where u.id = p.id
  and p.full_name is null
  and coalesce(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name'
  ) is not null;

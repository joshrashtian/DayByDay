-- ---------------------------------------------------------------------------
-- DESTRUCTIVE — drops every RiseByDay table, type and helper function.
--
-- For wiping a dev project back to a clean slate before re-running the
-- migrations. It does not touch auth.users, so accounts survive.
--
-- Never run this on production.
-- ---------------------------------------------------------------------------

drop view if exists public.active_tasks;

drop table if exists public.calendar_credentials  cascade;
drop table if exists public.calendar_sources      cascade;
drop table if exists public.calendar_connections  cascade;
drop table if exists public.custom_sounds         cascade;
drop table if exists public.user_settings         cascade;
drop table if exists public.user_categories       cascade;
drop table if exists public.user_blocks           cascade;
drop table if exists public.pomodoro_sessions     cascade;
drop table if exists public.tasks                 cascade;

drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.profiles cascade;

drop function if exists public.handle_new_user()      cascade;
drop function if exists public.rename_tasks_block()   cascade;
drop function if exists public.rename_tasks_category() cascade;
drop function if exists public.touch_updated_at()     cascade;

drop type if exists public.calendar_provider cascade;
drop type if exists public.task_priority     cascade;
drop type if exists public.task_kind         cascade;

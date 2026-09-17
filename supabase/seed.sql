-- ---------------------------------------------------------------------------
-- Dev seed — safe to re-run, safe to run on an empty project.
--
--   1. Sign up in the app (or the Supabase dashboard) with the email below.
--   2. Change v_email to that address.
--   3. Run this whole file in the SQL editor.
--
-- If no user matches, it prints a notice and changes nothing. Every id is
-- derived from the user id, so re-running updates the same rows instead of
-- piling up duplicates.
--
-- Do not run this against production.
-- ---------------------------------------------------------------------------

do $$
declare
  v_email text := 'dev@example.com';   -- ← edit me
  v_user  uuid;
  v_today timestamptz := date_trunc('day', now());
  t_review  uuid;
  t_outline uuid;
  t_draft   uuid;
  t_gym     uuid;
  t_lecture uuid;
  t_ics     uuid;
begin
  select id into v_user from auth.users where lower(email) = lower(v_email);

  if v_user is null then
    raise notice 'No auth user for %. Sign up first, then re-run.', v_email;
    return;
  end if;

  t_review  := md5(v_user::text || 'task:review')::uuid;
  t_outline := md5(v_user::text || 'task:outline')::uuid;
  t_draft   := md5(v_user::text || 'task:draft')::uuid;
  t_gym     := md5(v_user::text || 'task:gym')::uuid;
  t_lecture := md5(v_user::text || 'task:lecture')::uuid;
  t_ics     := md5(v_user::text || 'task:ics')::uuid;

  -- ── Blocks ──────────────────────────────────────────────────────────────
  insert into public.user_blocks
    (id, user_id, name, start_minutes, end_minutes, color, icon, sort_order)
  values
    (md5(v_user::text || 'block:morning')::uuid,  v_user, 'Morning',    360,  720, '#f59e0b', 'sun',    0),
    (md5(v_user::text || 'block:deepwork')::uuid, v_user, 'Deep Work',  720, 1020, '#6366f1', 'brain',  1),
    (md5(v_user::text || 'block:evening')::uuid,  v_user, 'Evening',   1020, 1320, '#0ea5e9', 'moon',   2)
  on conflict (id) do update set
    start_minutes = excluded.start_minutes,
    end_minutes   = excluded.end_minutes,
    color         = excluded.color,
    icon          = excluded.icon,
    sort_order    = excluded.sort_order;

  -- ── Categories ──────────────────────────────────────────────────────────
  insert into public.user_categories
    (id, user_id, name, color, icon, sort_order)
  values
    (md5(v_user::text || 'cat:school')::uuid,   v_user, 'School',   '#8b5cf6', 'book',      0),
    (md5(v_user::text || 'cat:work')::uuid,     v_user, 'Work',     '#10b981', 'briefcase', 1),
    (md5(v_user::text || 'cat:personal')::uuid, v_user, 'Personal', '#ef4444', 'heart',     2)
  on conflict (id) do update set
    color      = excluded.color,
    icon       = excluded.icon,
    sort_order = excluded.sort_order;

  -- ── Settings ────────────────────────────────────────────────────────────
  insert into public.user_settings (user_id)
  values (v_user)
  on conflict (user_id) do nothing;

  -- ── Tasks ───────────────────────────────────────────────────────────────
  -- Covers every kind, a parent with two children, a weekly recurrence, and
  -- an imported ICS event.
  insert into public.tasks (
    id, user_id, kind, title, done, created_at, updated_at,
    due_date, end_date, priority, critical, block, category,
    description, notes, tags, metadata, recurrence, ics_uid, parent_id
  ) values
    (t_review, v_user, 'task', 'Review the week', false, now(), now(),
     v_today + interval '9 hours', null, 'high', true, 'Morning', 'Work',
     'Skim last week''s notes and pick three priorities.', null,
     array['weekly','planning'], null, null, null, null),

    (t_outline, v_user, 'task', 'Outline the deck', false, now(), now(),
     v_today + interval '13 hours', null, 'medium', null, 'Deep Work', 'Work',
     null, null, null, null, null, null, t_review),

    (t_draft, v_user, 'task', 'Draft the summary', true, now(), now(),
     v_today + interval '14 hours', null, 'low', null, 'Deep Work', 'Work',
     null, null, null, null, null, null, t_review),

    (t_gym, v_user, 'habit', 'Gym', false, now(), now(),
     v_today + interval '18 hours', null, null, null, 'Evening', 'Personal',
     null, null, null, null,
     '{"frequency":"weekly","interval":1,"weekdays":[1,3,5]}'::jsonb, null, null),

    (t_lecture, v_user, 'class', 'Linear Algebra', false, now(), now(),
     v_today + interval '1 day' + interval '10 hours',
     v_today + interval '1 day' + interval '11 hours',
     null, null, 'Morning', 'School', null, null, null,
     '{"class":{"location":"Boelter 5249","grade":"A-"}}'::jsonb, null, null, null),

    (t_ics, v_user, 'ics', 'Design sync', false, now(), now(),
     v_today + interval '2 days' + interval '15 hours',
     v_today + interval '2 days' + interval '16 hours',
     null, null, null, 'Work', 'Imported from calendar', null, null, null, null,
     'seed-design-sync@risebyday.dev', null)
  on conflict (id) do update set
    title      = excluded.title,
    done       = excluded.done,
    updated_at = now(),
    due_date   = excluded.due_date,
    end_date   = excluded.end_date,
    deleted_at = null;

  raise notice 'Seeded dev data for % (%).', v_email, v_user;
end $$;

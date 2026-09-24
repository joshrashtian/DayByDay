# Supabase

Everything needed to stand up a RiseByDay backend from scratch — on a personal
dev project, on production, or on a local stack. The files are plain
PostgreSQL; nothing here needs the Supabase CLI, though it works with it.

```
supabase/
  migrations/
    20260903000100_extensions.sql             extensions + touch_updated_at()
    20260903000200_profiles.sql               profiles, signup trigger
    20260903000300_tasks.sql                  tasks, enums, indexes, RLS
    20260903000400_settings.sql               settings, blocks, categories, sounds
    20260903000500_calendar_integrations.sql  connections, sources, credentials
    20260903000600_realtime.sql               realtime publication (optional)
    20260922000700_purge_tombstones.sql       nightly pg_cron tombstone purge
    20260923000800_pomodoro_sessions.sql      pomodoro focus sessions, RLS
  seed.sql        dev fixtures — edit the email at the top first
  reset_dev.sql   drops everything this schema created (dev only)
```

Every migration is idempotent: re-running one is a no-op, so you can replay the
whole folder after editing a single file.

## Two projects

Create two Supabase projects — `risebyday-dev` and `risebyday-prod` — and apply
the same migrations to both. Vite picks the right one by mode:

```
.env.development      # bun run dev / bun run tauri dev
.env.production       # bun run build / bun run tauri build
```

Each holds:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<the publishable / anon key>
```

Both are already in `.gitignore` via `.env*`. The publishable key is safe to
ship in a client — RLS is what protects the data. The **service role** key is
not: it bypasses RLS entirely, so it belongs only in Edge Functions or a
server, never in the desktop, CLI, or mobile bundle.

## Applying the schema

**Dashboard.** Open the SQL editor, paste each file from `migrations/` in
filename order, run it. Six pastes.

**CLI.**

```bash
supabase link --project-ref <project-ref>
supabase db push
```

**Local stack.** `supabase start` then `supabase db reset` — the reset applies
every migration and runs `seed.sql` afterwards.

## Seeding a dev account

1. Sign up in the app (or from the dashboard's Authentication tab).
2. Change `v_email` at the top of `seed.sql` to that address.
3. Run the file.

It creates three blocks, three categories, a settings row, and six tasks that
cover every kind — including a parent with two subtasks, a weekly recurrence,
and an imported ICS event. Ids are derived from the user id, so re-running
updates the same rows rather than duplicating them. If no user matches the
email it prints a notice and changes nothing.

To start over on a dev project: run `reset_dev.sql`, then the migrations again.
It drops the tables but leaves `auth.users` alone, so accounts survive.

## Types

Three files carry the whole contract, all pure TypeScript with no runtime
imports. Copy them into a CLI or React Native project as-is:

| File | What it holds |
|---|---|
| `src/types/index.ts` | Domain model — `Task`, `BlockConfig`, `CategoryConfig`, … |
| `src/types/database.ts` | Row / Insert / Update types + the `Database` generic |
| `src/lib/cloud/mappers.ts` | Pure converters between the two |

```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types/database";
import { rowsToTasks, tasksToRows } from "./lib/cloud/mappers";

const supabase = createClient<Database>(url, key);

const { data } = await supabase.from("tasks").select("*").is("deleted_at", null);
const tasks = rowsToTasks(data ?? []);          // rows → domain, subtasks linked
await supabase.from("tasks").upsert(tasksToRows(tasks, userId));
```

The only thing to adjust when porting is the `@/` path alias — swap it for a
relative import, or map `@/*` to `src/*` in the new project's `tsconfig.json`.

`database.ts` is hand-maintained rather than generated so the JSON columns keep
real shapes (`recurrence`, `sidebar`, `audio_prefs`) instead of `Json`. If you
would rather generate it, `supabase gen types typescript --project-id <ref>`
produces a compatible file — you just lose those shapes.

## Contract notes

Things the schema assumes that aren't obvious from the DDL:

- **`tasks.updated_at` is owned by the client.** Sync uses it both as the delta
  cursor (`.gt("updated_at", lastPulledAt)`) and as the last-write-wins token,
  so there is deliberately no `touch_updated_at` trigger on `tasks`. Every
  other table has one. If you switch to server time, switch the client's cursor
  to the server's timestamp at the same time or clock skew will skip rows.
- **Deletes are soft.** Deleting writes `deleted_at` so other devices see the
  delete on their next pull. Purge old tombstones periodically:
  `delete from public.tasks where deleted_at < now() - interval '90 days';`
- **Blocks and categories are referenced by name.** `tasks.block` and
  `tasks.category` hold the name, matching the app model. Renaming a config
  rewrites the matching tasks via trigger (`0400`).
- **`children_tasks` is stored as `tasks.parent_id`.** The FK is
  `deferrable initially deferred`, so a parent and its children can land in the
  same upsert batch in any order. `rowsToTasks()` rebuilds the child lists.
- **RLS is owner-only everywhere** (`auth.uid() = user_id`), except `profiles`,
  which any signed-in user can read so the social screen can show names.
  `calendar_credentials` has RLS on and *no* policies — only the service role
  can touch OAuth tokens.
- **Adding a task kind** needs `alter type public.task_kind add value 'goal';`
  run on its own, outside a transaction, plus the union in `src/types/index.ts`.

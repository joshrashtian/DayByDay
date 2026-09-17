-- ---------------------------------------------------------------------------
-- 0500 · Calendar integrations
--
-- Cloud form of calendarIntegrationsStore. A connection is one linked
-- provider account; a source is one calendar inside it (the `ConnectedCalendar`
-- type in src/types/index.ts).
--
-- OAuth tokens live in calendar_credentials, which has RLS on and NO policies,
-- so it is unreachable with the anon/publishable key. Only the service role
-- (an Edge Function) can read or write it. Never move tokens onto
-- calendar_connections — that table is client-readable.
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.calendar_provider as enum ('google');
exception when duplicate_object then null;
end $$;

create table if not exists public.calendar_connections (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid()
                   references auth.users (id) on delete cascade,
  provider       public.calendar_provider not null,
  connected      boolean not null default true,
  account_email  text,
  last_import_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index if not exists calendar_connections_user_provider_key
  on public.calendar_connections (user_id, provider);

drop trigger if exists calendar_connections_touch_updated_at
  on public.calendar_connections;
create trigger calendar_connections_touch_updated_at
  before update on public.calendar_connections
  for each row execute function public.touch_updated_at();

create table if not exists public.calendar_sources (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid()
                  references auth.users (id) on delete cascade,
  connection_id uuid not null
                  references public.calendar_connections (id) on delete cascade,
  -- Provider's own calendar id ('primary', 'work', an address, …). This is
  -- ConnectedCalendar.id in the app.
  external_id   text not null,
  name          text not null,
  color         text,
  enabled       boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists calendar_sources_connection_external_key
  on public.calendar_sources (connection_id, external_id);

create index if not exists calendar_sources_user_idx
  on public.calendar_sources (user_id);

drop trigger if exists calendar_sources_touch_updated_at on public.calendar_sources;
create trigger calendar_sources_touch_updated_at
  before update on public.calendar_sources
  for each row execute function public.touch_updated_at();

-- ── Secrets: service-role only ────────────────────────────────────────────

create table if not exists public.calendar_credentials (
  connection_id uuid primary key
                  references public.calendar_connections (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  access_token  text,
  refresh_token text,
  expires_at    timestamptz,
  scope         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.calendar_credentials is
  'OAuth tokens. RLS on with zero policies: reachable only by the service role.';

drop trigger if exists calendar_credentials_touch_updated_at
  on public.calendar_credentials;
create trigger calendar_credentials_touch_updated_at
  before update on public.calendar_credentials
  for each row execute function public.touch_updated_at();

alter table public.calendar_credentials enable row level security;
revoke all on public.calendar_credentials from anon, authenticated;

-- ── RLS for the client-visible tables ─────────────────────────────────────

do $$
declare
  t text;
begin
  foreach t in array array['calendar_connections', 'calendar_sources'] loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "%s: select own" on public.%I', t, t);
    execute format(
      'create policy "%s: select own" on public.%I for select to authenticated
         using (auth.uid() = user_id)', t, t);

    execute format('drop policy if exists "%s: insert own" on public.%I', t, t);
    execute format(
      'create policy "%s: insert own" on public.%I for insert to authenticated
         with check (auth.uid() = user_id)', t, t);

    execute format('drop policy if exists "%s: update own" on public.%I', t, t);
    execute format(
      'create policy "%s: update own" on public.%I for update to authenticated
         using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);

    execute format('drop policy if exists "%s: delete own" on public.%I', t, t);
    execute format(
      'create policy "%s: delete own" on public.%I for delete to authenticated
         using (auth.uid() = user_id)', t, t);

    execute format(
      'grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

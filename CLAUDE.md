# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend dev server only (port 1420, hot reload)
bun run dev

# Full Tauri desktop app with hot reload (preferred for development)
bun run tauri dev

# Type-check + Vite build (frontend only)
bun run build

# Full native app bundle
bun run tauri build

# Toggle sidebar: Cmd+\ (keyboard shortcut wired in sidebar.tsx)
```

There is no test suite.

## Architecture

**Stack:** Tauri v2 (Rust shell) + React 19 + TypeScript + Vite + Tailwind CSS v4 + Zustand + React Router (HashRouter) + Framer Motion (`motion/react`)

**`@/` path alias** maps to `src/`.

### Entry point & provider tree

`src/main.tsx` wraps everything in:
```
StyleProvider → ThemeRegistryProvider → GuideProvider → ContextMenuProvider
  → PopupProvider → DayTransitionProvider → ProfileProvider → App
```

`src/App.tsx` owns the top-level router, sidebar layout, and the settings modal (opened as an overlay on top of `/`, not a real route).

### Screens (`src/screens/`)

Each file is a full-page component: `HomeScreen`, `TasksScreen` (nested routes via `/*`), `CalendarScreen`, `BlockScreen`, `PomodoroScreen`, `SettingsScreen`, `ToolkitScreen`, `AppsScreen`, plus integrations under `screens/integrations/`.

### State (`src/stores/`)

All stores use Zustand `persist` to localStorage:

| Store | Key | What it holds |
|---|---|---|
| `tasksStore` | `risebyday-tasks` | All tasks, CRUD, ICS import |
| `settingsStore` | *(settings)* | Visual prefs, sidebar state, blocks, categories, audio, zoom |
| `pomodoroStore` | *(pomodoro)* | Timer state, dock visibility |
| `homeFocusStore` | *(inline)* | Focused task ID, drag state |
| `calendarIntegrationsStore` | *(calendars)* | Connected calendar configs |
| `spotifyStore` | `risebyday-spotify` | Spotify tokens + accumulated play log |

`settingsStore` is the configuration hub — it holds `blockConfigs` (time-of-day blocks), `categoryConfigs`, `homeVisualPrefs`, `sidebar` state (mode, width, nav order), `audioPrefs`, and `customSounds`.

### Cloud (Supabase)

Postgres schema lives in `supabase/migrations/` as six idempotent SQL files
(apply in filename order via the dashboard SQL editor or `supabase db push`);
`supabase/seed.sql` fills a dev account, `supabase/reset_dev.sql` wipes a dev
project. `supabase/README.md` covers the dev/prod split and the sync contract.

| Layer | File |
|---|---|
| Typed client | `src/utils/supabase.ts` (`createClient<Database>`) |
| Auth | `src/stores/authStore.ts` |
| Task sync | `src/lib/tasksSync.ts` — `syncNow()` pushes dirty rows, then pulls a delta |
| Row types | `src/types/database.ts` — hand-maintained mirror of the SQL |
| Row ⇄ domain | `src/lib/cloud/mappers.ts` — pure, no React |

`src/types/index.ts`, `src/types/database.ts` and `src/lib/cloud/mappers.ts` are
the portable set: copy them into a CLI or React Native client and the only
change needed is the `@/` path alias.

Two rules the schema depends on: `tasks.updated_at` is **client-owned** (it is
the delta cursor and the last-write-wins token, so there is no server trigger on
it), and deletes are **soft** — `deleted_at` is set so other devices observe the
delete on their next pull.

### Spotify

Read-only listening history, surfaced as a tab in the right panel.

| Layer | File |
|---|---|
| OAuth loopback listener | `src-tauri/src/spotify_oauth.rs` (`spotify_oauth_listen`) |
| Flow config | `src/lib/integrations/spotify/config.ts` |
| PKCE helpers | `src/lib/integrations/spotify/pkce.ts` |
| Web API client | `src/lib/integrations/spotify/api.ts` |
| Log merge / day grouping | `src/lib/integrations/spotify/history.ts` |
| Store | `src/stores/spotifyStore.ts` |
| Right panel tab | `src/components/global/rightpanel/SpotifyListeningHistory.tsx` |

Auth is **Authorization Code + PKCE** — a desktop app cannot hold a client
secret. Rust binds a one-shot `TcpListener` on `127.0.0.1:14565` to catch the
redirect; that URI is matched by Spotify as an exact string, so the port here
and the one registered in the dashboard must agree.

The constraint that shapes everything: `/me/player/recently-played` returns only
the **last 50 plays** and cannot be queried by date. So the day-by-day timeline
is not fetched but **accumulated** — `useSpotifyHistorySync` polls every 3
minutes while the window is visible, and `mergePlays` dedupes on Spotify's
`played_at`. History cannot be backfilled before the day the account was
connected, and the log is capped at `MAX_STORED_PLAYS` because it lives in
localStorage.

### Providers (`src/providers/`)

- **`StyleProvider`** — clock style registry; `getClockStyle(id)` resolves a `ClockStylePrototype`
- **`ContextMenuProvider`** — right-click menus via `contextMenu.openMenu(event, items)`
- **`PopupProvider`** — modal popup system; consumers call `openPopup(content)` / `closePopup()`
- **`DayTransitionProvider`** — focus mode toggle (current-block vs all-day)
- **`ProfileProvider`** — profile bottom sheet; `openProfile()` from `useProfile()`

### Theme system (`src/themes/`)

`HomeThemeDefinition` bundles a `ClockTemplate` (which renderer to use), Tailwind class tokens for the home surface, and optional `ClockStylePrototype` overrides. Themes register via `ThemeRegistryProvider`. The `clockStyle` field in `homeVisualPrefs` is the active theme ID.

### Sidebar (`src/components/global/sidebar.tsx`)

Three content modes: `"tasks"` | `"social"` | `"apps"`. In tasks mode, `SidebarTasksDrawer` renders a swipe-up panel showing today's tasks (filtered by active block when on `/`). Nav items support drag-to-reorder (Framer Motion `Reorder`). Width snaps to 220 / 240 / 320 / 520 px.

**Adaptive layout.** Independently of the content mode, the sidebar picks a *layout mode* from the app's width (`useAppViewportWidth` → `resolveSidebarLayoutMode` in `src/lib/sidebarLayout.ts`), surfaced as `data-sidebar-layout`:

| Layout mode | App width | Behavior |
|---|---|---|
| `expanded` | ≥ 900 px | Normal sidebar; user controls open state and width (capped at 38% of the window) |
| `rail` | 680–900 px | Icon-only strip (68 px): no labels, no inline task list, tooltips on hover |
| `overlay` | < 680 px | Collapses out of the layout; opening floats it over a scrim, and content keeps the full width |

Thresholds carry ±24 px hysteresis so dragging the window edge doesn't flicker between modes. Auto-collapsing is layered *on top of* the persisted `sidebar.open` preference — `manualOpen` is what gets saved, `overlayOpen` is transient — so shrinking the window never rewrites what the user chose.

### Rust ↔ Frontend bridge (`src-tauri/src/main.rs`)

The Rust shell builds the native macOS menu and emits Tauri events to the frontend:
- `"navigate"` → caught by `useMenuNavigation` hook, calls `navigate()`
- `"create-task"` → caught by `useCreateTaskAction` hook, opens task creator popup
- `"menu-zoom"` → caught by `useAppZoom` hook, adjusts CSS zoom level

### Key domain concepts

- **Blocks** — named time ranges (e.g., "Morning", "Deep Work") stored as `BlockConfig[]` in settings. Tasks have an optional `block` field. The home screen shows tasks scoped to the current active block.
- **Categories** — `CategoryConfig[]` in settings; tasks have an optional `category` string matching a config name.
- **ICS import** — tasks with `kind: "ics"` are imported calendar events; they carry an `icsUid` for dedup and are non-draggable.
- **Recurrence** — tasks carry a `TaskRecurrence` object; `advanceRecurrenceDate` in `src/lib/taskDates.ts` handles the next-date logic.
- **Clock/visual styles** — `ClockTemplate` picks the renderer; `ClockStylePrototype` holds the full Tailwind class tree for layout. The home style window (`/home/style`) is a separate Tauri window for live style editing.

### Utility conventions

- `src/lib/` — pure functions with no React imports (date math, block utils, task filtering, sound loading)
- `src/types/index.ts` — all shared TypeScript types; import via `@/types`
- `src/ui/` — low-level presentational primitives (e.g., `BottomSheet`, `CognitionBar`)
- `tailwind-merge` (`twMerge`) is the standard for conditional class merging

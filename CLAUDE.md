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

`settingsStore` is the configuration hub — it holds `blockConfigs` (time-of-day blocks), `categoryConfigs`, `homeVisualPrefs`, `sidebar` state (mode, width, nav order), `audioPrefs`, and `customSounds`.

### Providers (`src/providers/`)

- **`StyleProvider`** — clock style registry; `getClockStyle(id)` resolves a `ClockStylePrototype`
- **`ContextMenuProvider`** — right-click menus via `contextMenu.openMenu(event, items)`
- **`PopupProvider`** — modal popup system; consumers call `openPopup(content)` / `closePopup()`
- **`DayTransitionProvider`** — focus mode toggle (current-block vs all-day)
- **`ProfileProvider`** — profile bottom sheet; `openProfile()` from `useProfile()`

### Theme system (`src/themes/`)

`HomeThemeDefinition` bundles a `ClockTemplate` (which renderer to use), Tailwind class tokens for the home surface, and optional `ClockStylePrototype` overrides. Themes register via `ThemeRegistryProvider`. The `clockStyle` field in `homeVisualPrefs` is the active theme ID.

### Sidebar (`src/components/global/sidebar.tsx`)

Three modes: `"tasks"` | `"social"` | `"apps"`. In tasks mode, `SidebarTasksDrawer` renders a swipe-up panel showing today's tasks (filtered by active block when on `/`). Nav items support drag-to-reorder (Framer Motion `Reorder`). Width snaps to 220 or 260 px.

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

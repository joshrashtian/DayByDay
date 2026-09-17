// ---------------------------------------------------------------------------
// RiseByDay – domain ⇄ Postgres row mappers
//
// Pure functions. No React, no Zustand, no Supabase client — the whole file is
// portable to a CLI or React Native app alongside `src/types/index.ts` and
// `src/types/database.ts`.
//
// The domain model uses camelCase and `Date`; rows use snake_case and ISO
// strings. Everything that crosses that boundary goes through here so there is
// one place to change when the schema moves.
// ---------------------------------------------------------------------------

import type {
  AudioPrefs,
  BlockConfig,
  CalendarProvider,
  CategoryConfig,
  ConnectedCalendar,
  ManualWeatherCoords,
  Task,
  TaskRecurrence,
} from "@/types";
import type {
  CalendarSourceInsert,
  CalendarSourceRow,
  IsoTimestamp,
  SidebarSettingsJson,
  TaskRecurrenceJson,
  TaskRow,
  ThemePreferenceValue,
  UserBlockInsert,
  UserBlockRow,
  UserCategoryInsert,
  UserCategoryRow,
  UserSettingsInsert,
  UserSettingsRow,
} from "@/types/database";

// ── Dates ─────────────────────────────────────────────────────────────────

function toIso(value: Date | undefined | null): IsoTimestamp | null {
  return value ? value.toISOString() : null;
}

/** Parses a row timestamp, returning undefined for null and for garbage. */
function fromIso(value: IsoTimestamp | null | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

// ── Recurrence ────────────────────────────────────────────────────────────

export function recurrenceToJson(
  recurrence: TaskRecurrence | undefined,
): TaskRecurrenceJson | null {
  if (!recurrence) return null;
  return {
    frequency: recurrence.frequency,
    interval: recurrence.interval,
    weekdays: recurrence.weekdays ?? null,
    untilDate: toIso(recurrence.untilDate),
  };
}

export function recurrenceFromJson(
  json: TaskRecurrenceJson | null,
): TaskRecurrence | undefined {
  if (!json) return undefined;
  const untilDate = fromIso(json.untilDate);
  return {
    frequency: json.frequency,
    interval: json.interval,
    ...(json.weekdays?.length ? { weekdays: json.weekdays } : {}),
    ...(untilDate ? { untilDate } : {}),
  };
}

// ── Tasks ─────────────────────────────────────────────────────────────────

/**
 * childId → parentId, inverted from every task's `children_tasks`.
 * `tasks.parent_id` is the relational form of that list, so a push needs this
 * to fill the column.
 */
export function buildParentIndex(tasks: Task[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const task of tasks) {
    for (const childId of task.children_tasks ?? []) {
      index.set(childId, task.id);
    }
  }
  return index;
}

export function taskToRow(
  task: Task,
  userId: string,
  parentId: string | null = null,
): TaskRow {
  return {
    id: task.id,
    user_id: userId,
    kind: task.kind,
    title: task.title,
    done: task.done,
    created_at: task.createdAt.toISOString(),
    updated_at: task.updatedAt.toISOString(),
    due_date: toIso(task.dueDate),
    end_date: toIso(task.endDate),
    priority: task.priority ?? null,
    critical: task.critical ?? null,
    block: task.block ?? null,
    category: task.category ?? null,
    description: task.description ?? null,
    notes: task.notes ?? null,
    tags: task.tags ?? null,
    metadata: task.metadata ?? null,
    recurrence: recurrenceToJson(task.recurrence),
    last_completed_at: toIso(task.lastCompletedAt),
    recurring_source_id: task.recurringSourceId ?? null,
    ics_uid: task.icsUid ?? null,
    parent_id: parentId,
    deleted_at: null,
  };
}

/** Maps a whole set at once, deriving `parent_id` from `children_tasks`. */
export function tasksToRows(
  tasks: Task[],
  userId: string,
  parentIndex: Map<string, string> = buildParentIndex(tasks),
): TaskRow[] {
  return tasks.map((task) =>
    taskToRow(task, userId, parentIndex.get(task.id) ?? null),
  );
}

/**
 * A delete, expressed as the tombstone row to upsert. Only the columns needed
 * to identify the row are set; the rest fall back to their column defaults.
 */
export function taskTombstoneRow(
  id: string,
  userId: string,
  deletedAt: Date = new Date(),
): Pick<
  TaskRow,
  "id" | "user_id" | "title" | "created_at" | "updated_at" | "deleted_at"
> {
  const iso = deletedAt.toISOString();
  return {
    id,
    user_id: userId,
    title: "",
    created_at: iso,
    updated_at: iso,
    deleted_at: iso,
  };
}

/**
 * `children_tasks` cannot be recovered from a single row, so pass the ids in
 * when you have them (from `rowsToTasks`, or from the task already in the
 * local store) to avoid clearing the list on every pull.
 */
export function rowToTask(row: TaskRow, children: string[] = []): Task {
  const recurrence = recurrenceFromJson(row.recurrence);
  const dueDate = fromIso(row.due_date);
  const endDate = fromIso(row.end_date);
  const lastCompletedAt = fromIso(row.last_completed_at);

  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    done: row.done,
    createdAt: fromIso(row.created_at) ?? new Date(0),
    updatedAt: fromIso(row.updated_at) ?? new Date(0),
    ...(dueDate ? { dueDate } : {}),
    ...(endDate ? { endDate } : {}),
    ...(row.priority ? { priority: row.priority } : {}),
    ...(row.critical ? { critical: true } : {}),
    ...(row.block ? { block: row.block } : {}),
    ...(row.category ? { category: row.category } : {}),
    ...(row.description ? { description: row.description } : {}),
    ...(row.notes ? { notes: row.notes } : {}),
    ...(row.tags?.length ? { tags: row.tags } : {}),
    ...(row.metadata ? { metadata: row.metadata } : {}),
    ...(recurrence ? { recurrence } : {}),
    ...(lastCompletedAt ? { lastCompletedAt } : {}),
    ...(row.recurring_source_id
      ? { recurringSourceId: row.recurring_source_id }
      : {}),
    ...(row.ics_uid ? { icsUid: row.ics_uid } : {}),
    children_tasks: children,
  };
}

/** Maps a full result set, rebuilding `children_tasks` from `parent_id`. */
export function rowsToTasks(rows: TaskRow[]): Task[] {
  const childrenByParent = new Map<string, string[]>();
  for (const row of rows) {
    if (!row.parent_id || row.deleted_at) continue;
    const siblings = childrenByParent.get(row.parent_id);
    if (siblings) siblings.push(row.id);
    else childrenByParent.set(row.parent_id, [row.id]);
  }
  return rows
    .filter((row) => !row.deleted_at)
    .map((row) => rowToTask(row, childrenByParent.get(row.id) ?? []));
}

// ── Blocks ────────────────────────────────────────────────────────────────

export function blockRowToConfig(row: UserBlockRow): BlockConfig {
  return {
    name: row.name,
    startMinutes: row.start_minutes,
    endMinutes: row.end_minutes,
    ...(row.color ? { color: row.color } : {}),
    ...(row.icon ? { icon: row.icon } : {}),
  };
}

export function blockConfigToInsert(
  config: BlockConfig,
  userId: string,
  sortOrder = 0,
): UserBlockInsert {
  return {
    user_id: userId,
    name: config.name,
    start_minutes: config.startMinutes,
    end_minutes: config.endMinutes,
    color: config.color ?? null,
    icon: config.icon ?? null,
    sort_order: sortOrder,
  };
}

// ── Categories ────────────────────────────────────────────────────────────

export function categoryRowToConfig(row: UserCategoryRow): CategoryConfig {
  return {
    name: row.name,
    color: row.color,
    ...(row.icon ? { icon: row.icon } : {}),
  };
}

export function categoryConfigToInsert(
  config: CategoryConfig,
  userId: string,
  sortOrder = 0,
): UserCategoryInsert {
  return {
    user_id: userId,
    name: config.name,
    color: config.color,
    icon: config.icon ?? null,
    sort_order: sortOrder,
  };
}

// ── Calendars ─────────────────────────────────────────────────────────────

export function calendarSourceRowToConnected(
  row: CalendarSourceRow,
  provider: CalendarProvider = "google",
): ConnectedCalendar {
  return {
    id: row.external_id,
    provider,
    name: row.name,
    ...(row.color ? { color: row.color } : {}),
    enabled: row.enabled,
  };
}

export function connectedCalendarToInsert(
  calendar: ConnectedCalendar,
  userId: string,
  connectionId: string,
  sortOrder = 0,
): CalendarSourceInsert {
  return {
    user_id: userId,
    connection_id: connectionId,
    external_id: calendar.id,
    name: calendar.name,
    color: calendar.color ?? null,
    enabled: calendar.enabled,
    sort_order: sortOrder,
  };
}

// ── Settings ──────────────────────────────────────────────────────────────

/** The slice of `settingsStore` that lives in the cloud, in camelCase. */
export type SyncedSettings = {
  theme: ThemePreferenceValue;
  dayTransitionEnabled: boolean;
  zoomLevel: number;
  sidebar: SidebarSettingsJson;
  pinnedToolkitPanels: string[];
  weatherCoords: ManualWeatherCoords | null;
  audioPrefs: AudioPrefs;
  calendarImportPastMonths: number;
  calendarImportFutureMonths: number;
  icsLastImportAt: Date | undefined;
  icsLastImportCount: number | undefined;
};

export function settingsRowToSynced(row: UserSettingsRow): SyncedSettings {
  return {
    theme: row.theme,
    dayTransitionEnabled: row.day_transition_enabled,
    zoomLevel: row.zoom_level,
    sidebar: row.sidebar,
    pinnedToolkitPanels: row.pinned_toolkit_panels,
    weatherCoords: row.weather_coords,
    audioPrefs: row.audio_prefs,
    calendarImportPastMonths: row.calendar_import_past_months,
    calendarImportFutureMonths: row.calendar_import_future_months,
    icsLastImportAt: fromIso(row.ics_last_import_at),
    icsLastImportCount: row.ics_last_import_count ?? undefined,
  };
}

export function syncedSettingsToInsert(
  settings: Partial<SyncedSettings>,
  userId: string,
): UserSettingsInsert {
  const insert: UserSettingsInsert = { user_id: userId };

  if (settings.theme !== undefined) insert.theme = settings.theme;
  if (settings.dayTransitionEnabled !== undefined)
    insert.day_transition_enabled = settings.dayTransitionEnabled;
  if (settings.zoomLevel !== undefined) insert.zoom_level = settings.zoomLevel;
  if (settings.sidebar !== undefined) insert.sidebar = settings.sidebar;
  if (settings.pinnedToolkitPanels !== undefined)
    insert.pinned_toolkit_panels = settings.pinnedToolkitPanels;
  if (settings.weatherCoords !== undefined)
    insert.weather_coords = settings.weatherCoords;
  if (settings.audioPrefs !== undefined) insert.audio_prefs = settings.audioPrefs;
  if (settings.calendarImportPastMonths !== undefined)
    insert.calendar_import_past_months = settings.calendarImportPastMonths;
  if (settings.calendarImportFutureMonths !== undefined)
    insert.calendar_import_future_months = settings.calendarImportFutureMonths;
  if (settings.icsLastImportAt !== undefined)
    insert.ics_last_import_at = toIso(settings.icsLastImportAt);
  if (settings.icsLastImportCount !== undefined)
    insert.ics_last_import_count = settings.icsLastImportCount;

  return insert;
}

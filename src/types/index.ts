// ---------------------------------------------------------------------------
// RiseByDay – shared type definitions
// Copy this file into any project that needs access to the RiseByDay domain
// model. Every declaration is a pure TypeScript type (no runtime, no React).
// ---------------------------------------------------------------------------

// ── Tasks ─────────────────────────────────────────────────────────────────

export type TaskPriority = "low" | "medium" | "high";
export type TaskKind =
  "task" | "event" | "reminder" | "habit" | "class" | "ics";

export type RecurrenceFrequency = "daily" | "weekly" | "monthly";
export type RecurrenceWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type TaskRecurrence = {
  frequency: RecurrenceFrequency;
  interval: number;
  weekdays?: RecurrenceWeekday[];
  untilDate?: Date;
};

export type TaskMetadata = {
  class?: {
    location?: string;
    grade?: string;
  };
};

export type Task = {
  id: string;
  kind: TaskKind;
  title: string;
  done: boolean;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  endDate?: Date;
  priority?: TaskPriority;
  block?: string;
  category?: string;
  description?: string;
  tags?: string[];
  notes?: string;
  metadata?: TaskMetadata;
  classLocation?: string;
  classGrade?: string;
  critical?: boolean;
  recurrence?: TaskRecurrence;
  lastCompletedAt?: Date;
  recurringSourceId?: string;
  /** Stable UID from an imported `.ics` event — used for dedup on re-import. */
  icsUid?: string;
  //sub tasks
  children_tasks: string[];
};

export type ImportIcsTaskPayload = {
  title: string;
  dueDate: Date;
  endDate?: Date;
  category?: string;
  classLocation?: string;
  description?: string;
  icsUid: string;
};

export type AddTaskPayload = {
  kind?: TaskKind;
  title: string;
  dueDate?: Date;
  endDate?: Date;
  priority?: TaskPriority;
  critical?: boolean;
  block?: string;
  context?: string;
  category?: string;
  description?: string;
  notes?: string;
  metadata?: TaskMetadata;
  classLocation?: string;
  classGrade?: string;
  tags?: string[];
  recurrence?: TaskRecurrence;
};

export type UpdateTaskPayload = {
  kind?: TaskKind;
  title: string;
  dueDate?: Date;
  endDate?: Date;
  priority?: TaskPriority;
  critical?: boolean;
  block?: string;
  category?: string;
  description?: string;
  notes?: string;
  metadata?: TaskMetadata;
  classLocation?: string;
  classGrade?: string;
  tags?: string[];
  recurrence?: TaskRecurrence;
};

// ── Blocks ────────────────────────────────────────────────────────────────

export type BlockConfig = {
  name: string;
  startMinutes: number;
  endMinutes: number;
  /** Hex color (e.g. "#ee6c2b") used for the dial arc, legend, and row accent. */
  color?: string;
  /** Icon id from CATEGORY_ICON_OPTIONS. */
  icon?: string;
  customCss?: string;
};

export type BlockVisualStyle =
  | "punchy"
  | "clean"
  | "outline"
  | "capsule"
  | "stacked"
  | "terminal"
  | "neon"
  | "sticker";

export type BlockBannerResolvedClasses = {
  containerClassName: string;
  titleClassName: string;
  timeClassName: string;
};

// ── Categories ────────────────────────────────────────────────────────────

export type CategoryConfig = {
  name: string;
  color: string;
  icon?: string;
};

// ── Calendar ──────────────────────────────────────────────────────────────

export type CalendarTaskRow = {
  task: Task;
  displayDueDate: Date;
  rowKey: string;
};

// ── Toolkit ───────────────────────────────────────────────────────────────

export type ToolkitPanel = {
  id: string;
  label: string;
  description: string;
  route: string;
};

// ── Weather ───────────────────────────────────────────────────────────────

export type ManualWeatherCoords = { lat: number; lon: number };

export type WeatherState =
  | { status: "loading" }
  | { status: "ok"; tempF: number; code: number }
  | { status: "error" };

// ── Clock / Date Corner ───────────────────────────────────────────────────

export type ClockTemplate =
  | "minimal"
  | "p5"
  | "basic"
  | "terminal"
  | "orbit"
  | "neon"
  | "editorial"
  | "pinkBiology";

export type ClockStyleSource = "core" | "user" | "marketplace";

export type ClockStylePrototype = {
  id: string;
  template: ClockTemplate;
  source: ClockStyleSource;
  pageClassName: string;
  pageContentClassName?: string;
  rootClassName: string;
  wrapperClassName: string;
  wrapperIdleClassName: string;
  transformOrigin: string;
  dateRowClassName: string;
  dateRowOverlayClassName?: string;
  dateRowCardClassName?: string;
  dateRowCardInnerClassName?: string;
  dateTextClassName: string;
  monthClassName: string;
  dayClassName: string;
  weekdayRowClassName: string;
  weekdayClassName: string;
  weatherClassName: string;
  weatherIconClassName: string;
  weatherTemperatureClassName: string;
  resizeHandleClassName: string;
};

export type ClockStylePrototypeInput = {
  template?: ClockTemplate;
  source?: ClockStyleSource;
} & Partial<Omit<ClockStylePrototype, "id" | "template" | "source">>;

export type ClockStylePack = Record<string, ClockStylePrototypeInput>;

// ── Calendar integrations ─────────────────────────────────────────────────

export type CalendarProvider = "google";

export type ConnectedCalendar = {
  id: string;
  provider: CalendarProvider;
  name: string;
  color?: string;
  enabled: boolean;
};

// ── Home Visual Styles ────────────────────────────────────────────────────

export type RibbonVisualStyle =
  | "default"
  | "muted"
  | "high-contrast"
  | "solid"
  | "glass"
  | "outline"
  | "classic";

export type TasksVisualStyle =
  | "default"
  | "card"
  | "minimal"
  | "terminal"
  | "neon"
  | "editorial"
  | "outline"
  | "glass";

export type DayFocusMode = "current-block" | "all-day";

export type HomeVisualPrefs = {
  blockStyle: BlockVisualStyle;
  blockScale: number;
  ribbonStyle: RibbonVisualStyle;
  ribbonScale: number;
  tasksStyle: TasksVisualStyle;
  tasksScale: number;
  /** Theme id from the home theme registry (core ids match clock templates). */
  clockStyle: string;
  clockScale: number;
};

/** Tailwind class tokens that paint one sidebar style. */
export type SidebarStyleTokens = {
  /** Outer nav container surface — replaces the default gradient. */
  surface: string;
  /** Active nav item background + text. */
  navItemActive: string;
  /** Idle nav item text + hover treatment. */
  navItemIdle: string;
  /** Active-item accent bar color. */
  navAccent: string;
  /** Divider / section border color. */
  divider: string;
  /** Utility icon button (profile / settings / help) treatment. */
  utilityButton: string;
  /** Primary text on the surface (task titles, etc). */
  primaryText: string;
  /** Muted/secondary text (labels, counts, metadata). */
  mutedText: string;
  /** Subtle chip / pill background + text. */
  softChip: string;
  /** Focused task row background + ring. */
  focusedItem: string;
  /** Hover state for an idle task row. */
  rowHover: string;
  /** Dashed "add task" button treatment. */
  addButton: string;
};

/** One selectable sidebar style — mirrors the home theme registry. */
export type SidebarStyleDefinition = {
  id: string;
  label: string;
  description: string;
  /** Tailwind gradient classes for the picker swatch. */
  swatch: string;
  tokens: SidebarStyleTokens;
};

export type AudioPrefs = {
  soundEnabled: boolean;
  volume: number;
  taskClickSoundId: string;
};

export type CustomSound = {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
};

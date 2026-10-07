import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  getLocalTimeZone,
  parseDate,
  type DateValue,
} from "@internationalized/date";
import { DateTime } from "luxon";
import { useShallow } from "zustand/react/shallow";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import {
  IoChevronBack,
  IoChevronDown,
  IoChevronForward,
  IoGrid,
} from "react-icons/io5";
import {
  DayAgendaView,
  MonthGridView,
  ThreeDayView,
  WeekView,
} from "../components/calendar/calendarViews";
import { taskEditorPopupContent } from "../components/tasks/taskEditorPopupContent";
import {
  dueLocalInputForCalendarDayEnd,
  localInputForDateTime,
} from "../lib/taskDates";
import { usePopup } from "../providers/PopupProvider";
import { useRightPanel } from "../providers/RightPanelProvider";
import { useCalendarTaskDrop } from "../hooks/useCalendarTaskDrop";
import { useResizeObserver } from "../hooks/use-resize-observer";
import { useTasksStore } from "../stores/tasksStore";
import { useSettingsStore } from "../stores/settingsStore";
import { DatePicker } from "../components/application/date-picker/date-picker";
import { CalendarBlocksPage } from "../components/calendar/CalendarBlocksPage";
import { CalendarFilterMenu } from "../components/calendar/CalendarFilterMenu";
import {
  applyCalendarFilter,
  EMPTY_CALENDAR_FILTER,
  type CalendarFilter,
} from "../lib/calendarFilters";
import { CALENDAR_BLOCKS_PATH, CALENDAR_PATH } from "../lib/calendarRoutes";

type CalendarMode = "month" | "week" | "day" | "three" | "custom";

type ModeOption = { id: CalendarMode; label: string };

const primaryModes: ModeOption[] = [
  { id: "month", label: "Grid" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
];

// Less common views live behind a dropdown so the switcher stays compact.
const moreModes: ModeOption[] = [
  { id: "three", label: "3 days" },
  { id: "custom", label: "Custom" },
];

const allModes = [...primaryModes, ...moreModes];

// Below this header width the title, switcher and nav controls collide, so
// the whole switcher collapses into a single dropdown.
const COMPACT_HEADER_WIDTH = 960;

export default function CalendarScreen() {
  return (
    <Routes>
      <Route index element={<CalendarMainPage />} />
      <Route path="blocks" element={<CalendarBlocksPage />} />
      <Route path="*" element={<Navigate to={CALENDAR_PATH} replace />} />
    </Routes>
  );
}

function CalendarMainPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  useCalendarTaskDrop();
  const { open: openPopup, close: closePopup } = usePopup();
  const { openTaskCreator } = useRightPanel();
  const {
    tasks,
    toggleTask,
    removeTask,
    duplicateTask,
    addTask,
    setTaskSchedule,
    updateTask,
  } = useTasksStore(
    useShallow((s) => ({
      tasks: s.tasks,
      toggleTask: s.toggleTask,
      removeTask: s.removeTask,
      duplicateTask: s.duplicateTask,
      addTask: s.addTask,
      setTaskSchedule: s.setTaskSchedule,
      updateTask: s.updateTask,
    })),
  );
  const categoryConfigs = useSettingsStore((s) => s.categoryConfigs);

  const [mode, setMode] = useState<CalendarMode>("week");
  const [calendarFilter, setCalendarFilter] =
    useState<CalendarFilter>(EMPTY_CALENDAR_FILTER);
  const filteredTasks = useMemo(
    () => applyCalendarFilter(tasks, calendarFilter),
    [tasks, calendarFilter],
  );
  const headerRef = useRef<HTMLDivElement>(null);
  const [compactHeader, setCompactHeader] = useState(false);
  const measureHeader = useCallback(() => {
    const width = headerRef.current?.clientWidth;
    if (width) setCompactHeader(width < COMPACT_HEADER_WIDTH);
  }, []);
  useLayoutEffect(measureHeader, [measureHeader]);
  useResizeObserver({ ref: headerRef, onResize: measureHeader });
  const focus = useMemo(() => {
    const day = searchParams.get("day");
    const parsed = day
      ? DateTime.fromISO(day, { zone: "local" }).startOf("day")
      : DateTime.local().startOf("day");
    return parsed.isValid ? parsed : DateTime.local().startOf("day");
  }, [searchParams]);
  const [customDayCount, setCustomDayCount] = useState(7);

  const setFocus = useCallback(
    (next: DateTime | ((current: DateTime) => DateTime)) => {
      const resolved = typeof next === "function" ? next(focus) : next;
      const normalized = resolved.startOf("day");
      const iso = normalized.toISODate();
      if (!iso) return;
      if (searchParams.get("day") === iso) return;
      const updated = new URLSearchParams(searchParams);
      updated.set("day", iso);
      setSearchParams(updated, { replace: true });
    },
    [focus, searchParams, setSearchParams],
  );

  const openAddTaskForDay = useCallback(
    (day: DateTime) => {
      openTaskCreator({
        initialDueLocal: dueLocalInputForCalendarDayEnd(day),
      });
    },
    [openTaskCreator],
  );

  const openAddTaskForRange = useCallback(
    (start: DateTime, end: DateTime, category?: string) => {
      openTaskCreator({
        initialDueLocal: localInputForDateTime(start),
        initialEndLocal: localInputForDateTime(end),
        initialKind: "event",
        initialCategory: category,
      });
    },
    [openTaskCreator],
  );

  const quickAddTaskForRange = useCallback(
    (title: string, start: DateTime, end: DateTime, category?: string) => {
      addTask({
        kind: "event",
        title,
        dueDate: start.toJSDate(),
        endDate: end.toJSDate(),
        category,
      });
    },
    [addTask],
  );

  const openTaskEditor = useCallback(
    (task: (typeof tasks)[number]) => {
      openPopup(
        taskEditorPopupContent({
          task,
          updateTask,
          removeTask,
          closePopup,
        }),
      );
    },
    [openPopup, updateTask, removeTask, closePopup],
  );

  const monthRef = useMemo(() => focus.startOf("month"), [focus]);
  const pickerValue = useMemo(() => {
    const iso = focus.toISODate();
    if (!iso) return undefined;
    try {
      return parseDate(iso);
    } catch {
      return undefined;
    }
  }, [focus]);

  const title = useMemo(() => {
    if (mode === "month") return monthRef.toFormat("MMMM yyyy");
    if (mode === "week") {
      const weekStart = focus.startOf("week");
      const weekEnd = weekStart.plus({ days: 6 });
      return `Week ${weekStart.weekNumber} · ${weekStart.toFormat("d MMM")}–${weekEnd.toFormat("d MMM yyyy")}`;
    }
    if (mode === "day") return focus.toFormat("cccc, d MMMM yyyy");
    if (mode === "custom") {
      const end = focus.plus({ days: Math.max(1, customDayCount) - 1 });
      if (focus.month !== end.month) {
        return `${focus.toFormat("d MMM")} – ${end.toFormat("d MMM yyyy")}`;
      }
      return `${focus.toFormat("d")}–${end.toFormat("d MMM yyyy")} · ${customDayCount} days`;
    }
    const end = focus.plus({ days: 2 });
    if (focus.month !== end.month) {
      return `${focus.toFormat("d MMM")} – ${end.toFormat("d MMM yyyy")}`;
    }
    return `${focus.toFormat("d")}–${end.toFormat("d MMM yyyy")}`;
  }, [mode, focus, monthRef, customDayCount]);

  const goPrev = () => {
    setFocus((f) => {
      const d = f.startOf("day");
      if (mode === "month") return d.startOf("month").minus({ months: 1 });
      if (mode === "week") return d.minus({ weeks: 1 });
      if (mode === "day") return d.minus({ days: 1 });
      if (mode === "custom") return d.minus({ days: customDayCount });
      return d.minus({ days: 3 });
    });
  };

  const goNext = () => {
    setFocus((f) => {
      const d = f.startOf("day");
      if (mode === "month") return d.startOf("month").plus({ months: 1 });
      if (mode === "week") return d.plus({ weeks: 1 });
      if (mode === "day") return d.plus({ days: 1 });
      if (mode === "custom") return d.plus({ days: customDayCount });
      return d.plus({ days: 3 });
    });
  };

  const handlePickDay = (day: DateTime) => {
    setFocus(day.startOf("day"));
    setMode("day");
  };

  const viewKey = `${mode}-${focus.toISODate()}-${monthRef.toISODate()}-${customDayCount}`;

  return (
    <main className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-sunken">
      <div className="relative z-10 flex h-full w-full min-h-0 flex-col">
        {/* Calendar header */}
        <motion.div
          ref={headerRef}
          className="relative z-40 flex shrink-0 items-center justify-between gap-3 border-b border-line/60 px-4 py-2.5"
        >
          {/* Left: title */}
          <AnimatePresence mode="wait">
            <motion.p
              key={title}
              className="min-w-0 flex flex-row truncate z-50 font-display text-2xl font-semibold text-ink"
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {title.split("").map((char, i) => (
                <motion.span
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        type: "spring",
                        stiffness: 100,
                        damping: 10,
                        delay: i * 0.02,
                      },
                    },
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </motion.p>
          </AnimatePresence>

          <div className="flex absolute left-1/2 -translate-x-1/2 items-center gap-0.5 rounded-full  bg-surface/60 p-1 backdrop-blur-sm">
            {!compactHeader &&
              primaryModes.map(({ id, label }) => (
                <motion.button
                  key={id}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setMode(id)}
                  className={`relative rounded-full px-3  py-1.5 text-xs font-black transition-colors ${
                    mode === id ? "text-white" : "text-muted hover:text-ink"
                  }`}
                >
                  {mode === id && <ModePill />}
                  <span className="relative z-10">{label}</span>
                </motion.button>
              ))}
            {compactHeader ? (
              <ModesMenu options={allModes} mode={mode} onSelect={setMode} />
            ) : (
              <ModesMenu
                options={moreModes}
                mode={mode}
                onSelect={setMode}
                fallbackLabel="More"
              />
            )}
            {mode === "custom" && (
              <label className="ml-1 flex items-center gap-1.5 rounded-lg border border-line/80 bg-surface/60 px-2 py-1 text-xs font-semibold text-muted">
                Days
                <input
                  type="number"
                  min={1}
                  max={14}
                  step={1}
                  value={customDayCount}
                  onChange={(e) => {
                    const parsed = Number.parseInt(e.target.value, 10);
                    if (Number.isNaN(parsed)) return;
                    setCustomDayCount(Math.max(1, Math.min(14, parsed)));
                  }}
                  className="w-12 rounded-md border border-line-strong/80 bg-surface/90 px-1.5 py-0.5 text-xs font-bold text-ink outline-none ring-sky-400/40 focus:ring-2"
                  aria-label="Custom day count"
                />
              </label>
            )}
          </div>

          {/* Right: date picker + nav */}
          <div className="flex items-center gap-2">
            {(mode === "month" || mode === "week") && (
              <CalendarFilterMenu
                tasks={tasks}
                filter={calendarFilter}
                onChange={setCalendarFilter}
                compact={compactHeader}
              />
            )}
            <Link
              to={{ pathname: CALENDAR_BLOCKS_PATH, search: location.search }}
              className="flex items-center gap-1.5 rounded-full border border-line/80 bg-surface/60 px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-ink"
            >
              <IoGrid className="h-3.5 w-3.5" aria-hidden />
              Blocks
            </Link>
            <DatePicker
              value={pickerValue}
              onChange={(value: DateValue | null) => {
                if (!value) return;
                const next = DateTime.fromJSDate(
                  value.toDate(getLocalTimeZone()),
                ).startOf("day");
                setFocus(next);
              }}
              size="sm"
            />
            <div className="flex items-center gap-1">
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={goPrev}
                className="rounded-full bg-sunken px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:bg-sunken"
                aria-label="Previous"
              >
                <IoChevronBack />
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => setFocus(DateTime.local().startOf("day"))}
                className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                Today
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={goNext}
                className="rounded-full bg-sunken px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:bg-sunken"
                aria-label="Next"
              >
                <IoChevronForward />
              </motion.button>
            </div>
          </div>
        </motion.div>

        <div className="flex min-h-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="min-h-0 min-w-0 flex-1"
            >
              {mode === "month" ? (
                <div className="h-full overflow-auto">
                  <MonthGridView
                    month={monthRef}
                    tasks={filteredTasks}
                    onToggleTask={toggleTask}
                    onEditTask={openTaskEditor}
                    onDeleteTask={removeTask}
                    onDuplicateTask={duplicateTask}
                    onPickDay={handlePickDay}
                  />
                </div>
              ) : null}
              {mode === "day" ? (
                <DayAgendaView
                  day={focus}
                  tasks={tasks}
                  onToggleTask={toggleTask}
                  onEditTask={openTaskEditor}
                  onDeleteTask={removeTask}
                  onDuplicateTask={duplicateTask}
                  onAddTaskForDay={openAddTaskForDay}
                />
              ) : null}
              {mode === "week" ? (
                <div className="h-full min-h-0">
                  <WeekView
                    startDay={focus}
                    tasks={filteredTasks}
                    onToggleTask={toggleTask}
                    onDeleteTask={removeTask}
                    onDuplicateTask={duplicateTask}
                    onPickDay={handlePickDay}
                    onAddTaskForDay={openAddTaskForDay}
                    onCreateTimedTask={openAddTaskForRange}
                    onQuickAddTimedTask={quickAddTaskForRange}
                    categoryConfigs={categoryConfigs}
                    onUpdateTaskSchedule={(taskId, dueDate, endDate) =>
                      setTaskSchedule(taskId, dueDate, endDate)
                    }
                    onEditTask={openTaskEditor}
                  />
                </div>
              ) : null}
              {mode === "three" ? (
                <ThreeDayView
                  startDay={focus}
                  tasks={tasks}
                  onToggleTask={toggleTask}
                  onEditTask={openTaskEditor}
                  onDeleteTask={removeTask}
                  onDuplicateTask={duplicateTask}
                  onPickDay={handlePickDay}
                  onAddTaskForDay={openAddTaskForDay}
                  onCreateTimedTask={openAddTaskForRange}
                  onQuickAddTimedTask={quickAddTaskForRange}
                  categoryConfigs={categoryConfigs}
                  onUpdateTaskSchedule={(taskId, dueDate, endDate) =>
                    setTaskSchedule(taskId, dueDate, endDate)
                  }
                />
              ) : null}
              {mode === "custom" ? (
                <div className="h-full min-h-0">
                  <WeekView
                    startDay={focus}
                    tasks={tasks}
                    onToggleTask={toggleTask}
                    onDeleteTask={removeTask}
                    onDuplicateTask={duplicateTask}
                    onPickDay={handlePickDay}
                    onAddTaskForDay={openAddTaskForDay}
                    onCreateTimedTask={openAddTaskForRange}
                    onQuickAddTimedTask={quickAddTaskForRange}
                    categoryConfigs={categoryConfigs}
                    onUpdateTaskSchedule={(taskId, dueDate, endDate) =>
                      setTaskSchedule(taskId, dueDate, endDate)
                    }
                    onEditTask={openTaskEditor}
                    dayCount={customDayCount}
                    anchorToWeekStart={false}
                  />
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

function ModePill() {
  return (
    <motion.span
      layoutId="mode-pill"
      className="absolute inset-0 rounded-full dark:bg-zinc-950/90 bg-ink shadow-sm"
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
    />
  );
}

function ModesMenu({
  options,
  mode,
  onSelect,
  fallbackLabel,
}: {
  options: ModeOption[];
  mode: CalendarMode;
  onSelect: (mode: CalendarMode) => void;
  fallbackLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = options.find((m) => m.id === mode);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`relative flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-black transition-colors ${
          active ? "text-white" : "text-muted hover:text-ink"
        }`}
      >
        {active && <ModePill />}
        <span className="relative z-10">{active?.label ?? fallbackLabel}</span>
        <IoChevronDown
          className={`relative z-10 h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-50 mt-2 min-w-32 origin-top-right rounded-xl border border-line/80 bg-surface p-1 shadow-lg"
          >
            {options.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="menuitemradio"
                aria-checked={mode === id}
                onClick={() => {
                  onSelect(id);
                  setOpen(false);
                }}
                className={`flex w-full items-center rounded-lg px-3 py-1.5 text-left text-xs font-bold transition-colors ${
                  mode === id
                    ? "bg-sunken text-ink"
                    : "text-muted hover:bg-sunken hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

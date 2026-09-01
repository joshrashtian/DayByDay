import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  getLocalTimeZone,
  parseDate,
  type DateValue,
} from "@internationalized/date";
import { DateTime } from "luxon";
import { useShallow } from "zustand/react/shallow";
import { useSearchParams } from "react-router-dom";
import {
  DayAgendaView,
  MonthGridView,
  ThreeDayView,
  WeekView,
} from "../components/calendar/calendarViews";
import { taskCreatorPopupContent } from "../components/tasks/taskCreatorPopupContent";
import { taskEditorPopupContent } from "../components/tasks/taskEditorPopupContent";
import {
  dueLocalInputForCalendarDayEnd,
  localInputForDateTime,
} from "../lib/taskDates";
import { usePopup } from "../providers/PopupProvider";
import { useCalendarTaskDrop } from "../hooks/useCalendarTaskDrop";
import { useTasksStore } from "../stores/tasksStore";
import { useSettingsStore } from "../stores/settingsStore";
import { DatePicker } from "../components/application/date-picker/date-picker";

type CalendarMode = "month" | "week" | "day" | "three" | "custom";

const modes: { id: CalendarMode; label: string }[] = [
  { id: "month", label: "Grid" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
  { id: "three", label: "3 days" },
  { id: "custom", label: "Custom" },
];

export default function CalendarScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  useCalendarTaskDrop();
  const { open: openPopup, close: closePopup } = usePopup();
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
      openPopup(
        taskCreatorPopupContent({
          addTask,
          closePopup,
          initialDueLocal: dueLocalInputForCalendarDayEnd(day),
        }),
      );
    },
    [openPopup, closePopup, addTask],
  );

  const openAddTaskForRange = useCallback(
    (start: DateTime, end: DateTime, category?: string) => {
      openPopup(
        taskCreatorPopupContent({
          addTask,
          closePopup,
          initialDueLocal: localInputForDateTime(start),
          initialEndLocal: localInputForDateTime(end),
          initialKind: "event",
          initialCategory: category,
        }),
      );
    },
    [openPopup, closePopup, addTask],
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
      <div
        className="pointer-events-none absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-sky-200/35 blur-3xl dark:bg-sky-900/25"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-1/4 h-72 w-72 rounded-full bg-violet-200/30 blur-3xl dark:bg-violet-950/30"
        aria-hidden
      />

      <div className="relative z-10 flex h-full w-full min-h-0 flex-col">
        {/* Calendar header */}
        <motion.div className="flex shrink-0 items-center justify-between gap-3 border-b border-line/60 px-4 py-2.5">
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
          {/* Center: mode switcher */}
          <div className="flex absolute left-1/2 -translate-x-1/2 items-center gap-0.5 rounded-xl border border-line/80 bg-surface/60 p-1 backdrop-blur-sm">
            {modes.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  mode === id
                    ? "bg-ink text-white shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
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
                ←
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
                →
              </motion.button>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={viewKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="min-h-0 flex-1"
          >
            {mode === "month" ? (
              <div className="h-full overflow-auto">
                <MonthGridView
                  month={monthRef}
                  tasks={tasks}
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
    </main>
  );
}

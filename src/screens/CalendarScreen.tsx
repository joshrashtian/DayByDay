import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DateTime } from "luxon";
import { useShallow } from "zustand/react/shallow";
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
import { useTasksStore } from "../stores/tasksStore";

type CalendarMode = "month" | "week" | "day" | "three";

const modes: { id: CalendarMode; label: string }[] = [
  { id: "month", label: "Grid" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
  { id: "three", label: "3 days" },
];

export default function CalendarScreen() {
  const { open: openPopup, close: closePopup } = usePopup();
  const { tasks, toggleTask, addTask, setTaskSchedule, updateTask } =
    useTasksStore(
      useShallow((s) => ({
        tasks: s.tasks,
        toggleTask: s.toggleTask,
        addTask: s.addTask,
        setTaskSchedule: s.setTaskSchedule,
        updateTask: s.updateTask,
      })),
    );

  const [mode, setMode] = useState<CalendarMode>("month");
  const [focus, setFocus] = useState(() => DateTime.local().startOf("day"));

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
    (start: DateTime, end: DateTime) => {
      openPopup(
        taskCreatorPopupContent({
          addTask,
          closePopup,
          initialDueLocal: localInputForDateTime(start),
          initialEndLocal: localInputForDateTime(end),
        }),
      );
    },
    [openPopup, closePopup, addTask],
  );

  const openTaskEditor = useCallback(
    (task: (typeof tasks)[number]) => {
      openPopup(taskEditorPopupContent({ task, updateTask, closePopup }));
    },
    [openPopup, updateTask, closePopup],
  );

  const monthRef = useMemo(() => focus.startOf("month"), [focus]);

  const title = useMemo(() => {
    if (mode === "month") return monthRef.toFormat("MMMM yyyy");
    if (mode === "week") {
      const weekStart = focus.startOf("week");
      const weekEnd = weekStart.plus({ days: 6 });
      return `Week ${weekStart.weekNumber} · ${weekStart.toFormat("d MMM")}–${weekEnd.toFormat("d MMM yyyy")}`;
    }
    if (mode === "day") return focus.toFormat("cccc, d MMMM yyyy");
    const end = focus.plus({ days: 2 });
    if (focus.month !== end.month) {
      return `${focus.toFormat("d MMM")} – ${end.toFormat("d MMM yyyy")}`;
    }
    return `${focus.toFormat("d")}–${end.toFormat("d MMM yyyy")}`;
  }, [mode, focus, monthRef]);

  const goPrev = () => {
    setFocus((f) => {
      const d = f.startOf("day");
      if (mode === "month") return d.startOf("month").minus({ months: 1 });
      if (mode === "week") return d.minus({ weeks: 1 });
      if (mode === "day") return d.minus({ days: 1 });
      return d.minus({ days: 3 });
    });
  };

  const goNext = () => {
    setFocus((f) => {
      const d = f.startOf("day");
      if (mode === "month") return d.startOf("month").plus({ months: 1 });
      if (mode === "week") return d.plus({ weeks: 1 });
      if (mode === "day") return d.plus({ days: 1 });
      return d.plus({ days: 3 });
    });
  };

  const handlePickDay = (day: DateTime) => {
    setFocus(day.startOf("day"));
    setMode("day");
  };

  const viewKey = `${mode}-${focus.toISODate()}-${monthRef.toISODate()}`;

  return (
    <main className="relative flex h-screen min-h-screen flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <div
        className="pointer-events-none absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-sky-200/35 blur-3xl dark:bg-sky-900/25"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-1/4 h-72 w-72 rounded-full bg-violet-200/30 blur-3xl dark:bg-violet-950/30"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1400px] flex-col gap-4 px-4 pb-4 pt-3 sm:px-6">
        <div className="fixed bottom-8 w-3/5 left-1/2 -translate-x-1/2 z-40 flex flex-col gap-4 pb-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/60 bg-white/70 p-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-white/40 backdrop-blur-xl dark:border-white/15 dark:bg-zinc-900/70 dark:ring-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/35 px-4 py-3 ring-1 ring-white/30 backdrop-blur-xl dark:border-white/15 dark:bg-zinc-900/35 dark:ring-white/10">
              {modes.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={` px-4 py-2 text-sm font-semibold skew-x-6 transition-colors ${
                    mode === id
                      ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900"
                      : "text-zinc-600 hover:bg-white/50 dark:text-zinc-400 dark:hover:bg-white/10"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/35 px-4 py-3 ring-1 ring-white/30 backdrop-blur-xl dark:border-white/15 dark:bg-zinc-900/35 dark:ring-white/10">
              <div className="min-w-0 flex-1">
                <p className="truncate font-quantify text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                  {title}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={goPrev}
                  className="rounded-full bg-blue-300/40 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-white dark:border-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  aria-label="Previous"
                >
                  ←
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setFocus(DateTime.local().startOf("day"))}
                  className=" bg-blue-500 transition-colors px-6 rounded-full py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  Today
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={goNext}
                  className="rounded-full bg-blue-300/40 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-white dark:border-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  aria-label="Next"
                >
                  →
                </motion.button>
              </div>
            </div>
          </div>
        </div>

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
              <div className="h-full overflow-auto rounded-2xl border border-white/70 bg-white/40 p-4 shadow-[0_4px_24px_rgba(15,15,15,0.06)] ring-1 ring-white/30 backdrop-blur-xl sm:p-6 dark:border-white/15 dark:bg-zinc-900/35 dark:ring-white/10">
                <MonthGridView
                  month={monthRef}
                  tasks={tasks}
                  onToggleTask={toggleTask}
                  onEditTask={openTaskEditor}
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
                onAddTaskForDay={openAddTaskForDay}
              />
            ) : null}
            {mode === "week" ? (
              <div className="h-full min-h-0">
                <WeekView
                  startDay={focus}
                  tasks={tasks}
                  onPickDay={handlePickDay}
                  onAddTaskForDay={openAddTaskForDay}
                  onCreateTimedTask={openAddTaskForRange}
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
                onPickDay={handlePickDay}
                onAddTaskForDay={openAddTaskForDay}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

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
  const { tasks, toggleTask, addTask } = useTasksStore(
    useShallow((s) => ({
      tasks: s.tasks,
      toggleTask: s.toggleTask,
      addTask: s.addTask,
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
    <main className="relative flex min-h-screen flex-col gap-6 overflow-hidden bg-zinc-100  p-6 dark:bg-zinc-700">
      <div
        className="pointer-events-none absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-sky-200/35 blur-3xl dark:bg-sky-900/25"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-1/4 h-72 w-72 rounded-full bg-violet-200/30 blur-3xl dark:bg-violet-950/30"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-quantify text-4xl font-black tracking-wide text-zinc-900 sm:text-5xl dark:text-zinc-50">
            Calendar
          </h1>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/70 bg-white/40 p-1.5 shadow-sm ring-1 ring-white/30 backdrop-blur-xl dark:border-white/15 dark:bg-zinc-900/40 dark:ring-white/10">
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
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/35 px-4 py-3 ring-1 ring-white/30 backdrop-blur-xl dark:border-white/15 dark:bg-zinc-900/35 dark:ring-white/10">
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-zinc-800 dark:text-zinc-100">
              {title}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={goPrev}
              className="rounded-xl border border-zinc-300/80 bg-white/60 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-white dark:border-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Previous"
            >
              ←
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => setFocus(DateTime.local().startOf("day"))}
              className="rounded-xl border border-zinc-300/80 bg-white/60 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-white dark:border-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Today
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={goNext}
              className="rounded-xl border border-zinc-300/80 bg-white/60 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-white dark:border-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Next"
            >
              →
            </motion.button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={viewKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="min-h-[320px]"
          >
            {mode === "month" ? (
              <div className="rounded-2xl border border-white/70 bg-white/40 p-4 shadow-[0_4px_24px_rgba(15,15,15,0.06)] ring-1 ring-white/30 backdrop-blur-xl sm:p-6 dark:border-white/15 dark:bg-zinc-900/35 dark:ring-white/10">
                <MonthGridView
                  month={monthRef}
                  tasks={tasks}
                  onToggleTask={toggleTask}
                  onPickDay={handlePickDay}
                />
              </div>
            ) : null}
            {mode === "day" ? (
              <DayAgendaView
                day={focus}
                tasks={tasks}
                onToggleTask={toggleTask}
                onAddTaskForDay={openAddTaskForDay}
              />
            ) : null}
            {mode === "week" ? (
              <WeekView
                startDay={focus}
                tasks={tasks}
                onPickDay={handlePickDay}
                onAddTaskForDay={openAddTaskForDay}
                onCreateTimedTask={openAddTaskForRange}
              />
            ) : null}
            {mode === "three" ? (
              <ThreeDayView
                startDay={focus}
                tasks={tasks}
                onToggleTask={toggleTask}
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

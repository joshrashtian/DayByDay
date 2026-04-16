import { motion } from "motion/react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import type { Task } from "../../types/task";
import {
  buildMonthGrid,
  type CalendarTaskRow,
  tasksByDueDateKeyInRange,
  weekdayLabelsShort,
} from "../../lib/calendarUtils";
import { formatTaskDue } from "../../lib/taskDates";

const cellEase = [0.25, 0.1, 0.25, 1] as const;

function useMdUp() {
  const [mdUp, setMdUp] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setMdUp(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return mdUp;
}

const cellVariants = {
  hidden: { opacity: 0, y: 6 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.012, duration: 0.22, ease: cellEase },
  }),
};

type TaskListProps = {
  items: CalendarTaskRow[];
  onToggle: (id: string) => void;
  compact?: boolean;
};

function TaskDueList({ items, onToggle, compact }: TaskListProps) {
  if (items.length === 0) {
    return (
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        {compact ? "—" : "Nothing due"}
      </p>
    );
  }

  if (compact) {
    return (
      <ul className="flex flex-col gap-1">
        {items.map(({ task, displayDueDate, rowKey }) => (
          <li key={rowKey}>
            <button
              type="button"
              onClick={() => onToggle(task.id)}
              className={`w-full h-32 rounded-lg px-2 py-1 text-left text-xs font-medium border transition-colors hover:bg-white/60 dark:hover:bg-white/10 ${task.critical ? "border-red-500" : "border-white/20"}`}
            >
              {task.critical ? (
                <span className={`text-xs font-display italic text-red-500`}>
                  CRITICAL
                </span>
              ) : null}
              {task.category ? (
                <span className="mb-0.5 block truncate text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                  {task.category}
                </span>
              ) : null}
              <span className="line-clamp-2 text-md font-black">
                {task.title}
              </span>
              <time
                dateTime={displayDueDate.toISOString()}
                className="mt-0.5 block truncate text-[10px] text-zinc-500 dark:text-zinc-400"
              >
                {formatTaskDue(displayDueDate)}
              </time>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={`flex flex-col gap-1 ${compact ? "min-h-0" : ""}`}>
      {items.map(({ task, displayDueDate, rowKey }) => (
        <li key={rowKey}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(task.id);
            }}
            className={`w-full h-32 rounded-lg px-2 py-1 text-left text-2xl font-medium  transition-colors hover:bg-white/60 dark:hover:bg-white/10 `}
          >
            {task.priority && !task.critical ? (
              <span className={`text-2xl font-display italic text-zinc-500`}>
                {task.priority.toUpperCase()} PRIORITY
              </span>
            ) : null}
            {task.critical ? (
              <span className={`text-2xl font-display italic text-red-500`}>
                CRITICAL - {formatTaskDue(displayDueDate)}
              </span>
            ) : null}
            {task.category ? (
              <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                {task.category}
              </span>
            ) : null}
            <span className="line-clamp-2 text-4xl font-black">
              {task.title}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

type MonthGridProps = {
  month: DateTime;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onPickDay: (day: DateTime) => void;
};

export function MonthGridView({
  month,
  tasks,
  onToggleTask,
  onPickDay,
}: MonthGridProps) {
  const gridStart = month.startOf("month").startOf("week");
  const gridEnd = gridStart.plus({ days: 41 }).endOf("day");
  const byDay = tasksByDueDateKeyInRange(tasks, gridStart, gridEnd);
  const weeks = buildMonthGrid(month);
  const labels = weekdayLabelsShort();
  const today = DateTime.local().startOf("day");
  const monthStart = month.startOf("month");

  let cellIndex = 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-7 gap-1.5">
        {labels.map((label) => (
          <div
            key={label}
            className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {weeks.flatMap((week) =>
          week.map((day) => {
            const idx = cellIndex++;
            const key = day.toISODate() ?? "";
            const inMonth = day.hasSame(monthStart, "month");
            const isToday = day.hasSame(today, "day");
            const dayTasks = byDay.get(key) ?? [];

            return (
              <motion.button
                key={key}
                type="button"
                custom={idx}
                variants={cellVariants}
                initial="hidden"
                animate="show"
                onClick={() => onPickDay(day.startOf("day"))}
                className={`flex min-h-[92px] flex-col gap-1 rounded-xl border p-2 text-left ring-1 transition-colors hover:bg-white/50 dark:hover:bg-white/5 ${
                  inMonth
                    ? "border-white/60 bg-white/35 dark:border-white/10 dark:bg-zinc-900/30"
                    : "border-transparent bg-white/15 opacity-60 dark:bg-zinc-900/15 dark:opacity-50"
                } ${
                  isToday
                    ? "ring-2 ring-sky-400/70 dark:ring-sky-500/50"
                    : "ring-white/20 dark:ring-white/5"
                }`}
              >
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    isToday
                      ? "text-sky-600 dark:text-sky-400"
                      : "text-zinc-800 dark:text-zinc-200"
                  } ${!inMonth ? "text-zinc-400 dark:text-zinc-500" : ""}`}
                >
                  {day.day}
                </span>
                <div className="min-h-0 flex-1 overflow-hidden">
                  <TaskDueList
                    items={dayTasks.slice(0, 3)}
                    onToggle={onToggleTask}
                    compact
                  />
                  {dayTasks.length > 3 ? (
                    <p className="mt-0.5 text-[10px] font-medium text-zinc-500">
                      +{dayTasks.length - 3} more
                    </p>
                  ) : null}
                </div>
              </motion.button>
            );
          }),
        )}
      </div>
    </div>
  );
}

type DayViewProps = {
  day: DateTime;
  tasks: Task[];
  onToggleTask: (id: string) => void;
};

export function DayAgendaView({ day, tasks, onToggleTask }: DayViewProps) {
  const byDay = tasksByDueDateKeyInRange(
    tasks,
    day.startOf("day"),
    day.endOf("day"),
  );
  const key = day.toISODate() ?? "";
  const dayTasks = byDay.get(key) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="flex flex-row ">
        {day
          .toLocaleString(DateTime.DATE_FULL)
          .split("")
          .map((part, index) => (
            <motion.p
              key={part}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{
                duration: 0.28,
                delay: index * 0.06,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="font-quantify text-6xl font-black tracking-wide text-zinc-900 dark:text-zinc-50"
            >
              {part}
            </motion.p>
          ))}
      </div>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {dayTasks.length} due {dayTasks.length === 1 ? "task" : "tasks"}
      </p>
      <div className="mt-6 max-w-md">
        <TaskDueList items={dayTasks} onToggle={onToggleTask} />
      </div>
    </motion.div>
  );
}

type ThreeDayProps = {
  startDay: DateTime;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onPickDay: (day: DateTime) => void;
};

export function ThreeDayView({
  startDay,
  tasks,
  onToggleTask,
  onPickDay,
}: ThreeDayProps) {
  const mdUp = useMdUp();
  const rangeStart = startDay.startOf("day");
  const rangeEnd = startDay.plus({ days: 2 }).endOf("day");
  const byDay = tasksByDueDateKeyInRange(tasks, rangeStart, rangeEnd);
  const days = [0, 1, 2].map((i) => startDay.plus({ days: i }).startOf("day"));
  const today = DateTime.local().startOf("day");

  const slantEase = [0.25, 0.1, 0.25, 1] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="md:perspective-[1400px] md:perspective-origin-x-center"
    >
      <div className="grid gap-3 md:grid-cols-3 md:gap-1 md:px-2 md:pb-3 md:pt-1">
        {days.map((day, col) => {
          const key = day.toISODate() ?? "";
          const dayTasks = byDay.get(key) ?? [];
          const isToday = day.hasSame(today, "day");

          const rotateY = mdUp && col === 0 ? 9 : mdUp && col === 2 ? -9 : 0;
          const transformOrigin =
            col === 0
              ? ("right center" as const)
              : col === 2
                ? ("left center" as const)
                : ("center center" as const);

          return (
            <motion.div
              key={key}
              initial={{
                opacity: 0,
                y: 14,
                rotateY: mdUp ? rotateY * 0.35 : 0,
              }}
              animate={{ opacity: 1, y: 0, rotateY }}
              transition={{
                delay: col * 0.06,
                duration: 0.36,
                ease: slantEase,
              }}
              style={{
                transformStyle: "preserve-3d",
                transformOrigin: mdUp ? transformOrigin : "center center",
              }}
              className={`flex flex-col rounded-2xl border border-white/70 bg-white/40 p-4 shadow-[0_4px_24px_rgba(15,15,15,0.06)] ring-1 backdrop-blur-xl dark:border-white/15 dark:bg-zinc-900/35 ${
                isToday
                  ? "ring-2 ring-sky-400/60 dark:ring-sky-500/45"
                  : "ring-white/30 dark:ring-white/10"
              } ${mdUp ? "md:z-[1] md:shadow-[0_12px_40px_rgba(15,15,15,0.12)] dark:md:shadow-[0_16px_48px_rgba(0,0,0,0.35)]" : ""}`}
            >
              <button
                type="button"
                onClick={() => onPickDay(day)}
                className="text-left"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {day.toFormat("ccc")}
                </p>
                <p className="mt-0.5 font-fava text-xl font-black text-zinc-900 dark:text-zinc-50">
                  {day.toFormat("d MMM")}
                </p>
              </button>
              <div className="mt-4 min-h-[120px] flex-1">
                <TaskDueList items={dayTasks} onToggle={onToggleTask} compact />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

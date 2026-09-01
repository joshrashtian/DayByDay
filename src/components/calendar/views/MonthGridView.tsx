import { motion } from "motion/react";
import { DateTime } from "luxon";
import type { Task } from "@/types";
import {
  buildMonthGrid,
  tasksByDueDateKeyInRange,
  weekdayLabelsShort,
} from "../../../lib/calendarUtils";
import { TaskDueList } from "./_shared";

const cellEase = [0.25, 0.1, 0.25, 1] as const;

const cellVariants = {
  hidden: { opacity: 0, y: 6 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.012, duration: 0.22, ease: cellEase },
  }),
};

type MonthGridProps = {
  month: DateTime;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onDuplicateTask?: (taskId: string) => void;
  onPickDay: (day: DateTime) => void;
};

export function MonthGridView({
  month,
  tasks,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onDuplicateTask,
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
            className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wider text-muted"
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
                data-calendar-drop="all-day"
                data-calendar-day={key}
                onClick={() => onPickDay(day.startOf("day"))}
                className={`flex min-h-[92px] flex-col gap-1 rounded-xl border p-2 text-left ring-1 transition-colors hover:bg-surface/50 ${
                  inMonth
                    ? "border-line/60 bg-surface/35 dark:bg-overlay"
                    : "border-transparent bg-surface/15 opacity-60 dark:bg-overlay dark:opacity-50"
                } ${
                  isToday
                    ? "ring-2 ring-sky-400/70 dark:ring-sky-500/50"
                    : "ring-line/20"
                }`}
              >
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    isToday
                      ? "text-sky-600 dark:text-sky-400"
                      : "text-ink"
                  } ${!inMonth ? "text-faint" : ""}`}
                >
                  {day.day}
                </span>
                <div className="min-h-0 flex-1 overflow-hidden">
                  <TaskDueList
                    items={dayTasks.slice(0, 3)}
                    onToggle={onToggleTask}
                    onEditTask={onEditTask}
                    onDeleteTask={onDeleteTask}
                    onDuplicateTask={onDuplicateTask}
                    compact
                  />
                  {dayTasks.length > 3 ? (
                    <p className="mt-0.5 text-[10px] font-medium text-muted">
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

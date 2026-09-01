import { motion } from "motion/react";
import { DateTime } from "luxon";
import { IoAdd } from "react-icons/io5";
import type { Task } from "@/types";
import { tasksByDueDateKeyInRange } from "../../../lib/calendarUtils";
import { TaskDueList } from "./_shared";

type DayViewProps = {
  day: DateTime;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onDuplicateTask?: (taskId: string) => void;
  onAddTaskForDay?: (day: DateTime) => void;
};

export function DayAgendaView({
  day,
  tasks,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onDuplicateTask,
  onAddTaskForDay,
}: DayViewProps) {
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {dayTasks.length} due {dayTasks.length === 1 ? "item" : "items"}
        </p>
        {onAddTaskForDay ? (
          <motion.button
            initial={{ opacity: 0, x: 16, transform: "skewX(-3deg)" }}
            animate={{ opacity: 1, x: 0, transform: "skewX(6deg)" }}
            exit={{ opacity: 0, x: -16, transform: "skewX(-3deg)" }}
            whileHover={{ transform: "skew(-5deg, -5deg)", scale: 1.2 }}
            transition={{
              duration: 0.28,
              delay: 0.06,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            type="button"
            onClick={() => onAddTaskForDay(day)}
            className="shrink-0 shadow-lg flex flex-row items-center justify-center gap-2 bg-sky-500/50 px-4 py-4 text-xl font-semibold text-sky-800 hover:bg-sky-500/25 dark:border-sky-400/35 dark:bg-sky-500/20 dark:text-sky-100 dark:hover:bg-sky-500/30"
          >
            <IoAdd className="text-white drop-shadow-lg -skew-x-3" />{" "}
            <span className="text-xl font-semibold text-sky-800">Add Task</span>
          </motion.button>
        ) : null}
      </div>
      <div
        className="mt-6 max-w-md"
        data-calendar-drop="all-day"
        data-calendar-day={key}
      >
        <TaskDueList
          items={dayTasks}
          onToggle={onToggleTask}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onDuplicateTask={onDuplicateTask}
        />
      </div>
    </motion.div>
  );
}

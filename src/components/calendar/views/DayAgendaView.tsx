import { motion } from "motion/react";
import { DateTime } from "luxon";
import { IoAdd, IoGitBranch, IoGitCommit } from "react-icons/io5";
import type { Task } from "@/types";
import { tasksByDueDateKeyInRange } from "../../../lib/calendarUtils";
import { TaskDueList } from "./_shared";
import { FaWeightScale } from "react-icons/fa6";
import HevyWidget from "@/screens/integrations/HevyWidget";
import DayWidgets from "./DayWidgets";

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
      className="relative"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {dayTasks.length} due {dayTasks.length === 1 ? "item" : "items"}
        </p>

        {onAddTaskForDay ? (
          <motion.button
            initial={{ opacity: 0, x: 40, rotateX: 90 }}
            animate={{ opacity: 1, x: 0, rotateX: 0 }}
            exit={{ opacity: 0, x: 40, rotateX: 90 }}
            transition={{
              duration: 0.28,
              delay: 0.06,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            type="button"
            onClick={() => onAddTaskForDay(day)}
            className="shrink-0 shadow-lg absolute top-5 right-5 flex rounded-full flex-row items-center justify-center gap-2 bg-sky-500/50 px-4 py-4 text-xl font-semibold text-sky-800 hover:bg-sky-500/25 dark:border-sky-400/35 dark:bg-sky-500/20 dark:text-sky-100 dark:hover:bg-sky-500/30"
          >
            <IoAdd className="text-white drop-shadow-lg " />
          </motion.button>
        ) : null}
      </div>
      <DayWidgets day={day} />
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

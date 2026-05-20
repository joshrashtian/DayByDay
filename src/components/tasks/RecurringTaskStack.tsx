import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IoChevronDown, IoRepeatOutline } from "react-icons/io5";
import type { Task } from "@/types";
import { TaskItem } from "./TaskItem";

type Props = {
  tasks: Task[];
  representative: Task;
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onSetTags: (taskId: string, tags: string[] | undefined) => void;
};

export function RecurringTaskStack({
  tasks,
  representative,
  onToggle,
  onDelete,
  onEditTask,
  onSetTags,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = tasks.length - 1;
  const doneCount = tasks.filter((t) => t.done).length;
  const upcomingCount = tasks.length - doneCount;

  const others = tasks
    .filter((t) => t.id !== representative.id)
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const aDue = a.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bDue = b.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aDue - bDue;
    });

  return (
    <li className="list-none">
      <div className="group/stack relative">
        {!expanded && hiddenCount > 0 ? (
          <>
            {hiddenCount >= 2 ? (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-x-3 top-2 bottom-0 rounded-2xl border border-white/50 bg-white/30 shadow-sm transition-transform duration-300 ease-out group-hover/stack:-translate-y-1 dark:border-white/10 dark:bg-zinc-800/40"
                style={{ transform: "translateY(8px) scale(0.97)" }}
              />
            ) : null}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-x-1.5 top-1 bottom-0 rounded-2xl border border-white/60 bg-white/40 shadow-md transition-transform duration-300 ease-out group-hover/stack:-translate-y-0.5 dark:border-white/12 dark:bg-zinc-800/55"
              style={{ transform: "translateY(4px) scale(0.985)" }}
            />
          </>
        ) : null}

        <motion.div layout className="relative z-10">
          <div
            className="absolute -left-0.5 -top-2 z-20 flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-md shadow-indigo-600/30 dark:bg-indigo-500"
            title={`${tasks.length} occurrences in this repeating series`}
          >
            <IoRepeatOutline className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{tasks.length}</span>
          </div>

          <TaskItem
            task={representative}
            onToggle={() => onToggle(representative.id)}
            onDelete={() => onDelete(representative.id)}
            onEditTask={() => onEditTask(representative)}
            onSetTags={(tags) => onSetTags(representative.id, tags)}
          />

          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-1.5 pl-1 text-left text-[11px] font-medium text-indigo-700/90 transition-colors hover:text-indigo-900 dark:text-indigo-300/90 dark:hover:text-indigo-200"
            >
              Repeating · {upcomingCount} upcoming
              {doneCount > 0 ? ` · ${doneCount} done` : ""}
              <span className="text-zinc-500 dark:text-zinc-400">
                {" "}
                · show all
              </span>
            </button>
          ) : null}
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex flex-col gap-2 border-l-2 border-indigo-300/60 pl-3 dark:border-indigo-500/40">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="mb-1 inline-flex w-fit items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-white/10"
              >
                <IoChevronDown className="h-3.5 w-3.5 rotate-180" aria-hidden />
                Collapse series
              </button>
              {others.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => onToggle(task.id)}
                  onDelete={() => onDelete(task.id)}
                  onEditTask={() => onEditTask(task)}
                  onSetTags={(tags) => onSetTags(task.id, tags)}
                />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

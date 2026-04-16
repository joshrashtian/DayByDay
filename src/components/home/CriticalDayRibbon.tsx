import { useMemo } from "react";
import { motion } from "motion/react";
import { DateTime } from "luxon";
import { useShallow } from "zustand/react/shallow";
import type { Task } from "../../types/task";
import { useTasksStore } from "../../stores/tasksStore";

function sortCriticalTasks(a: Task, b: Task): number {
  const da = a.dueDate ? DateTime.fromJSDate(a.dueDate).toMillis() : Infinity;
  const db = b.dueDate ? DateTime.fromJSDate(b.dueDate).toMillis() : Infinity;
  return da - db;
}

export function useCriticalForDay() {
  const tasks = useTasksStore(useShallow((s) => s.tasks));
  return useMemo(() => {
    const today = DateTime.local().startOf("day");
    const list = tasks.filter((t) => {
      if (!t.critical || t.done) return false;
      if (!t.dueDate) return true;
      const d = DateTime.fromJSDate(t.dueDate).startOf("day");
      return d <= today;
    });
    list.sort(sortCriticalTasks);
    return list;
  }, [tasks]);
}

export function criticalBannerLabel(tasks: Task[]): string {
  const today = DateTime.local().startOf("day");
  let overdue = 0;
  let dueToday = 0;
  for (const t of tasks) {
    if (!t.dueDate) continue;
    const d = DateTime.fromJSDate(t.dueDate).startOf("day");
    if (d < today) overdue++;
    else if (d.equals(today)) dueToday++;
  }
  if (overdue > 0) return "OVERDUE";
  if (dueToday > 0) return "DUE TODAY";
  return "CRITICAL";
}

export function CriticalHeaderRibbon() {
  const critical = useCriticalForDay();
  if (critical.length === 0) return null;

  const label = criticalBannerLabel(critical);
  const primary = critical[0]!.title;

  return (
    <motion.div
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="min-w-0 -skew-x-12 max-w-[min(17rem,calc(100vw-12rem))] contain-paint"
    >
      <div className="-skew-x-12">
        <div className=" flex items-stretch gap-2 border border-red-800/40 bg-red-600 py-1.5 pl-3 pr-3">
          <div className="flex shrink-0 flex-col justify-center leading-none">
            <span className=" text-[8px] font-bold tracking-[0.3em] text-red-100">
              {label}
            </span>
            <span className="mt-0.5 font-display text-base font-black tracking-tight text-white sm:text-lg">
              Critical
            </span>
          </div>
          <div className="my-0.5 min-w-0 flex-1 self-center border-l border-white/30 pl-2">
            <p className="truncate font-display text-[10px] font-bold uppercase leading-snug tracking-wide text-white/95 sm:text-[11px]">
              {primary}
            </p>
            {critical.length > 1 ? (
              <p className="mt-0.5 font-baron text-[8px] font-semibold tracking-widest text-red-100">
                +{critical.length - 1} more
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

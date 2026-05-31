import { useMemo } from "react";
import { motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { formatTaskDue } from "../../lib/taskDates";
import { useHomeFocusStore } from "../../stores/homeFocusStore";
import { useTasksStore } from "../../stores/tasksStore";

export function TaskDragGhost() {
  const draggedTaskId = useHomeFocusStore((s) => s.draggedTaskId);
  const isPointerDragging = useHomeFocusStore((s) => s.isPointerDragging);
  const dragPointer = useHomeFocusStore((s) => s.dragPointer);
  const dragGrabOffset = useHomeFocusStore((s) => s.dragGrabOffset);
  const { tasks } = useTasksStore(useShallow((s) => ({ tasks: s.tasks })));

  const draggedTask = useMemo(
    () => tasks.find((task) => task.id === draggedTaskId),
    [draggedTaskId, tasks],
  );

  if (!isPointerDragging || !draggedTask) return null;

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-999 w-56 rounded-xl border border-zinc-300/90 bg-white/95 px-3 py-2 shadow-[0_18px_50px_-20px_rgba(15,23,42,0.55)] sm:w-72 dark:border-zinc-600 dark:bg-zinc-900/90"
      style={{
        left: dragPointer.x - dragGrabOffset.x,
        top: dragPointer.y - dragGrabOffset.y,
      }}
      initial={{ opacity: 0.92 }}
      animate={{ opacity: 1 }}
      transition={{ opacity: { duration: 0.12 } }}
    >
      <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        <span>
          {draggedTask.critical
            ? "Critical"
            : draggedTask.priority
              ? `${draggedTask.priority} priority`
              : "No priority"}
        </span>
        <span>
          {draggedTask.dueDate
            ? formatTaskDue(draggedTask.dueDate)
            : "No time"}
        </span>
      </div>
      <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
        {draggedTask.title}
      </p>
    </motion.div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { useTasksStore } from "../../stores/tasksStore";
import {
  formatTaskDue,
  isCompletedTaskFromPreviousDay,
  isTaskOverdue,
  isTaskDueToday,
} from "../../lib/taskDates";
import { IoCheckmarkCircleOutline, IoPencil } from "react-icons/io5";

type Props = {
  activeBlockName?: string;
};

export const TasksFrontPage = ({ activeBlockName }: Props) => {
  const { tasks } = useTasksStore(useShallow((s) => ({ tasks: s.tasks })));
  const { toggleTask } = useTasksStore(
    useShallow((s) => ({ toggleTask: s.toggleTask })),
  );
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isPointerDragging, setIsPointerDragging] = useState(false);
  const [isDropActive, setIsDropActive] = useState(false);
  const [dragPointer, setDragPointer] = useState({ x: 0, y: 0 });
  const dropZoneRef = useRef<HTMLDivElement | null>(null);

  const tasksInBlock = useMemo(
    () =>
      tasks.filter((task) => {
        if (!activeBlockName) return true;
        return (
          task.block?.trim().toLowerCase() === activeBlockName.toLowerCase()
        );
      }),
    [tasks, activeBlockName],
  );

  const sortedTasks = useMemo(
    () =>
      [...tasksInBlock]
        .filter((task) => {
          if (isCompletedTaskFromPreviousDay(task)) return false;
          if (!task.done) return true;
          return isTaskDueToday(task.dueDate);
        })
        .sort((a, b) => {
          const aDue = a.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
          const bDue = b.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;

          if (aDue !== bDue) return aDue - bDue;

          return b.updatedAt.getTime() - a.updatedAt.getTime();
        }),
    [tasksInBlock],
  );

  useEffect(() => {
    if (sortedTasks.length === 0) {
      setFocusedTaskId(null);
      return;
    }
    const currentFocus = sortedTasks.find((task) => task.id === focusedTaskId);
    if (!currentFocus) {
      const firstActive = sortedTasks.find((task) => !task.done);
      if (firstActive) setFocusedTaskId(firstActive.id);
      else if (focusedTaskId !== null) setFocusedTaskId(null);
      return;
    }
    if (currentFocus.done) {
      const nextActive = sortedTasks.find(
        (task) => !task.done && task.id !== currentFocus.id,
      );
      if (nextActive) {
        setFocusedTaskId(nextActive.id);
      } else {
        setFocusedTaskId(null);
      }
    }
  }, [sortedTasks, focusedTaskId]);

  useEffect(() => {
    if (!isPointerDragging) return;

    const isInDropZone = (x: number, y: number) => {
      const rect = dropZoneRef.current?.getBoundingClientRect();
      if (!rect) return false;
      return (
        x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
      );
    };

    const finishDrag = (x: number, y: number) => {
      const insideDropZone = isInDropZone(x, y);
      if (insideDropZone && draggedTaskId) {
        const exists = sortedTasks.some((task) => task.id === draggedTaskId);
        if (exists) setFocusedTaskId(draggedTaskId);
      }
      setIsPointerDragging(false);
      setDraggedTaskId(null);
      setIsDropActive(false);
    };

    const onPointerMove = (e: PointerEvent) => {
      setDragPointer({ x: e.clientX, y: e.clientY });
      setIsDropActive(isInDropZone(e.clientX, e.clientY));
    };
    const onPointerUp = (e: PointerEvent) => finishDrag(e.clientX, e.clientY);
    const onPointerCancel = () => {
      setIsPointerDragging(false);
      setDraggedTaskId(null);
      setIsDropActive(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [isPointerDragging, draggedTaskId, sortedTasks]);

  const focusedTask = useMemo(
    () => sortedTasks.find((task) => task.id === focusedTaskId),
    [sortedTasks, focusedTaskId],
  );
  const visibleFocusedTask = focusedTask ?? null;

  const activeCount = sortedTasks.filter((task) => !task.done).length;
  const draggedTask = useMemo(
    () =>
      sortedTasks.find((task) => task.id === draggedTaskId) ??
      tasks.find((task) => task.id === draggedTaskId),
    [draggedTaskId, sortedTasks, tasks],
  );

  return (
    <div className="font-eudoxus">
      {isPointerDragging && draggedTask ? (
        <motion.div
          className="pointer-events-none fixed z-999 w-56 rounded-xl border border-zinc-300/90 bg-white/95 px-3 py-2 shadow-[0_18px_50px_-20px_rgba(15,23,42,0.55)] sm:w-72 dark:border-zinc-600 dark:bg-zinc-900/90"
          style={{
            left: dragPointer.x + 12,
            top: dragPointer.y + 12,
          }}
          initial={{ opacity: 0.8, scale: 0.98 }}
          animate={{
            opacity: 1,
            scale: 1.02,
            rotate: [0, -1.6, 1.6, -1, 1, 0],
          }}
          transition={{
            opacity: { duration: 0.12 },
            scale: { duration: 0.12 },
            rotate: { duration: 0.42, repeat: Infinity, ease: "easeInOut" },
          }}
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
      ) : null}
      <div className="flex min-h-120 flex-col gap-4 sm:gap-6">
        <div className="flex flex-col items-start gap-1">
          <p className="font-baron text-lg font-bold uppercase tracking-[0.14em] text-zinc-800 dark:text-zinc-200">
            {activeBlockName ? `${activeBlockName} Tasks` : "All Tasks"}
          </p>
          <p className="font-eudoxus text-xs tracking-wide text-zinc-400 dark:text-zinc-500">
            {sortedTasks.length} total &middot; {activeCount} active
          </p>
        </div>

        <div
          ref={dropZoneRef}
          className={`w-full rounded-2xl px-2 py-3 transition-colors sm:px-4 sm:py-4 ${
            isDropActive
              ? "border border-sky-400 bg-sky-50/60 dark:border-sky-400 dark:bg-sky-950/30"
              : ""
          }`}
        >
          {!visibleFocusedTask ? (
            <p className="text-base font-quantify text-zinc-500 dark:text-zinc-400"></p>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-between gap-4 sm:min-h-44">
              <div>
                <h2 className="wrap-break-word text-center text-3xl font-semibold font-ppneue text-zinc-900 dark:text-zinc-50 sm:text-5xl">
                  {visibleFocusedTask.title}
                </h2>
                {visibleFocusedTask.description ? (
                  <p className="mt-1.5 text-center text-sm font-sans text-zinc-600 dark:text-zinc-300">
                    {visibleFocusedTask.description}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs font-medium">
                  <span className="rounded-md border-b border-blue-500 bg-zinc-100 px-2 py-0.5 font-quantify text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700/70 dark:text-zinc-200">
                    {visibleFocusedTask.critical
                      ? "Critical"
                      : visibleFocusedTask.priority
                        ? visibleFocusedTask.priority.charAt(0).toUpperCase() +
                          visibleFocusedTask.priority.slice(1)
                        : "No priority"}
                  </span>
                  <span className="rounded-md border-b font-quantify bg-zinc-100 px-2 py-0.5 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700/70 dark:text-zinc-200">
                    {visibleFocusedTask.dueDate
                      ? formatTaskDue(visibleFocusedTask.dueDate)
                      : "No Due Date"}
                  </span>
                </div>
              </div>
              <div className="flex w-full flex-col items-center justify-between gap-3 sm:flex-row sm:gap-0">
                <h3
                  className={`text-center font-baron text-2xl tracking-[0.08em] sm:text-3xl ${isTaskOverdue(visibleFocusedTask.dueDate) ? "text-red-500" : "text-zinc-500"}`}
                >
                  {isTaskOverdue(visibleFocusedTask.dueDate)
                    ? "OVERDUE"
                    : "DUE TODAY"}
                </h3>
                <ol className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-full bg-white p-2 text-3xl text-zinc-500 duration-500 hover:bg-yellow-600 hover:text-white sm:text-4xl dark:bg-zinc-700/70 dark:text-zinc-300"
                  >
                    <IoPencil />
                  </button>
                  <button
                    onClick={() => toggleTask(visibleFocusedTask.id)}
                    type="button"
                    className="rounded-full bg-white p-2 text-3xl text-zinc-500 duration-500 hover:bg-green-600 hover:text-white sm:text-4xl dark:bg-zinc-700/70 dark:text-zinc-300"
                    title={
                      visibleFocusedTask.done
                        ? "Mark as active"
                        : "Mark as complete"
                    }
                  >
                    <IoCheckmarkCircleOutline />
                  </button>
                </ol>
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto w-full max-w-full">
          <h3 className="mb-3 font-baron text-xs font-bold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
            Task List
          </h3>
          <div className="max-h-72 max-w-none space-y-2 overflow-y-scroll pr-1 no-scrollbar sm:max-w-sm">
            {sortedTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onPointerDown={(e) => {
                  setDraggedTaskId(task.id);
                  setIsPointerDragging(true);
                  setDragPointer({ x: e.clientX, y: e.clientY });
                }}
                className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                  focusedTaskId === task.id
                    ? "border-sky-400 bg-sky-50 dark:border-sky-500 dark:bg-sky-950/25"
                    : "border-zinc-200/90 bg-white/85 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/65 dark:hover:bg-zinc-900"
                } ${task.done ? "opacity-60" : ""} cursor-grab active:cursor-grabbing`}
              >
                <div className="mb-0.5 flex items-center justify-between gap-2 font-eudoxus text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500">
                  <span>
                    {task.critical
                      ? "Critical"
                      : task.priority
                        ? `${task.priority} priority`
                        : "No priority"}
                  </span>
                  <span>
                    {task.dueDate ? formatTaskDue(task.dueDate) : "No time"}
                  </span>
                </div>
                <p className="truncate font-ppneue text-[13px] font-medium text-zinc-800 dark:text-zinc-100">
                  {task.title}
                </p>
              </button>
            ))}
            {sortedTasks.length === 0 ? (
              <div className="py-6 pl-1">
                <p className="font-ppneue text-base font-medium text-zinc-400 dark:text-zinc-500">
                  Nothing here yet.
                </p>
                <p className="mt-1 font-eudoxus text-xs text-zinc-300 dark:text-zinc-600">
                  Add a task below to get started.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

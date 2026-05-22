import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { usePopup } from "../../providers/PopupProvider";
import { useTasksStore } from "../../stores/tasksStore";
import { taskEditorPopupContent } from "./taskEditorPopupContent";
import { formatTaskDue, isTaskOverdue, isTaskDueToday } from "../../lib/taskDates";
import {
  IoCheckmarkCircle,
  IoCheckmarkCircleOutline,
  IoCreateOutline,
} from "react-icons/io5";
import { HomePomodoroPanel, HomePomodoroToggle } from "../home/HomePomodoroRail";
import { getBlockScopedSidebarTasks } from "../../lib/sidebarTasks";
import { useHomeFocusStore } from "../../stores/homeFocusStore";
import { usePomodoroStore } from "../../stores/pomodoroStore";
import { TASK_ICON_LG_CLASS } from "./taskView";
import { Tooltip, TooltipTrigger } from "../base/tooltip/tooltip";

type Props = {
  activeBlockName?: string;
};

export const TasksFrontPage = ({ activeBlockName }: Props) => {
  const { tasks } = useTasksStore(useShallow((s) => ({ tasks: s.tasks })));
  const { toggleTask, updateTask, removeTask } = useTasksStore(
    useShallow((s) => ({
      toggleTask: s.toggleTask,
      updateTask: s.updateTask,
      removeTask: s.removeTask,
    })),
  );
  const { open: openPopup, close: closePopup } = usePopup();
  const openTaskEditor = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      openPopup(
        taskEditorPopupContent({ task, updateTask, removeTask, closePopup }),
      );
    },
    [tasks, openPopup, updateTask, removeTask, closePopup],
  );
  const focusedTaskId = useHomeFocusStore((s) => s.focusedTaskId);
  const setFocusedTaskId = useHomeFocusStore((s) => s.setFocusedTaskId);
  const draggedTaskId = useHomeFocusStore((s) => s.draggedTaskId);
  const isPointerDragging = useHomeFocusStore((s) => s.isPointerDragging);
  const dragPointer = useHomeFocusStore((s) => s.dragPointer);
  const dragGrabOffset = useHomeFocusStore((s) => s.dragGrabOffset);
  const updateDragPointer = useHomeFocusStore((s) => s.updateDragPointer);
  const endTaskDrag = useHomeFocusStore((s) => s.endTaskDrag);
  const [isDropActive, setIsDropActive] = useState(false);
  const pomodoroPanelOpen = usePomodoroStore((s) => s.panelOpen);
  const setLinkedTaskTitle = usePomodoroStore((s) => s.setLinkedTaskTitle);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);

  const sortedTasks = useMemo(
    () => getBlockScopedSidebarTasks(tasks, activeBlockName),
    [tasks, activeBlockName],
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
      endTaskDrag();
      setIsDropActive(false);
    };

    const onPointerMove = (e: PointerEvent) => {
      updateDragPointer(e.clientX, e.clientY);
      setIsDropActive(isInDropZone(e.clientX, e.clientY));
    };
    const onPointerUp = (e: PointerEvent) => finishDrag(e.clientX, e.clientY);
    const onPointerCancel = () => {
      endTaskDrag();
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
  }, [
    isPointerDragging,
    draggedTaskId,
    sortedTasks,
    setFocusedTaskId,
    endTaskDrag,
    updateDragPointer,
  ]);

  const focusedTask = useMemo(
    () => sortedTasks.find((task) => task.id === focusedTaskId),
    [sortedTasks, focusedTaskId],
  );
  const visibleFocusedTask = focusedTask ?? null;

  useEffect(() => {
    if (visibleFocusedTask && !visibleFocusedTask.done) {
      setLinkedTaskTitle(visibleFocusedTask.title);
    } else {
      setLinkedTaskTitle(undefined);
    }
  }, [visibleFocusedTask, setLinkedTaskTitle]);

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
      ) : null}
      <motion.div layout className="flex min-h-100 flex-col gap-4 sm:min-h-112 sm:gap-5">
        <div className="flex w-full items-start justify-between gap-3">
          <div className="min-w-0 flex flex-col items-start gap-1">
            <p className="font-baron text-lg font-bold uppercase tracking-[0.14em] text-zinc-800 dark:text-zinc-200">
              {activeBlockName ? `${activeBlockName} Tasks` : "All Tasks"}
            </p>
            <p className="font-eudoxus text-xs tracking-wide text-zinc-400 dark:text-zinc-500">
              {sortedTasks.length} total &middot; {activeCount} active
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-zinc-200/60 p-0.5 dark:bg-zinc-800/60">
            <HomePomodoroToggle />
          </div>
        </div>

        <motion.div
          layout
          ref={dropZoneRef}
          className={`relative min-h-44 w-full rounded-2xl px-2 py-4 transition-colors sm:min-h-40 sm:px-4 ${
            isDropActive
              ? "border border-sky-400 bg-sky-50/60 dark:border-sky-400 dark:bg-sky-950/30"
              : ""
          } ${pomodoroPanelOpen ? "bg-zinc-50/50 dark:bg-zinc-900/30" : ""}`}
        >
          <HomePomodoroPanel
            linkedTaskTitle={
              visibleFocusedTask && !visibleFocusedTask.done
                ? visibleFocusedTask.title
                : undefined
            }
          />
          {!visibleFocusedTask ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex min-h-32 flex-col items-center justify-center gap-2 px-4 text-center sm:min-h-28 ${pomodoroPanelOpen ? "pointer-events-none opacity-40" : ""}`}
            >
              <p className="font-ppneue text-xl font-medium text-zinc-500 dark:text-zinc-400">
                {sortedTasks.length === 0
                  ? "Nothing here yet"
                  : activeCount === 0
                    ? "All caught up"
                    : "Pick a task to focus"}
              </p>
              <p className="font-eudoxus text-xs text-zinc-400 dark:text-zinc-500">
                {sortedTasks.length === 0
                  ? "Add a task from the sidebar or Tasks page."
                  : activeCount === 0
                    ? "Every task in this view is done for today."
                    : "Swipe up Today in the sidebar or drag a task here."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              layout
              className={`flex min-h-36 flex-col items-center justify-between gap-4 sm:min-h-32 ${pomodoroPanelOpen ? "pointer-events-none opacity-40" : ""}`}
            >
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
                {isTaskOverdue(visibleFocusedTask.dueDate) ||
                isTaskDueToday(visibleFocusedTask.dueDate) ? (
                  <h3
                    className={`text-center font-baron text-2xl tracking-[0.08em] sm:text-3xl ${isTaskOverdue(visibleFocusedTask.dueDate) ? "text-red-500" : "text-zinc-500"}`}
                  >
                    {isTaskOverdue(visibleFocusedTask.dueDate)
                      ? "OVERDUE"
                      : "DUE TODAY"}
                  </h3>
                ) : null}
                <ol className="flex items-center gap-2">
                  <Tooltip
                    title="Edit task"
                    description="Change title, due date, and details"
                    placement="top"
                    delay={250}
                  >
                    <TooltipTrigger
                      aria-label="Edit task"
                      onPress={() => openTaskEditor(visibleFocusedTask.id)}
                      className="inline-flex items-center justify-center rounded-full bg-white p-3 text-zinc-500 transition-colors hover:bg-amber-500 hover:text-white dark:bg-zinc-700/70 dark:text-zinc-300 dark:hover:bg-amber-600"
                    >
                      <IoCreateOutline className={TASK_ICON_LG_CLASS} aria-hidden />
                    </TooltipTrigger>
                  </Tooltip>
                  <Tooltip
                    title={
                      visibleFocusedTask.done
                        ? "Mark as active"
                        : "Mark complete"
                    }
                    description={
                      visibleFocusedTask.done
                        ? "Move this task back to your active list"
                        : "Finish this task for today"
                    }
                    placement="top"
                    delay={250}
                  >
                    <TooltipTrigger
                      aria-label={
                        visibleFocusedTask.done
                          ? "Mark as active"
                          : "Mark as complete"
                      }
                      onPress={() => toggleTask(visibleFocusedTask.id)}
                      className="inline-flex items-center justify-center rounded-full bg-white p-3 text-zinc-500 transition-colors hover:bg-emerald-600 hover:text-white dark:bg-zinc-700/70 dark:text-zinc-300 dark:hover:bg-emerald-600"
                    >
                      {visibleFocusedTask.done ? (
                        <IoCheckmarkCircle className={TASK_ICON_LG_CLASS} aria-hidden />
                      ) : (
                        <IoCheckmarkCircleOutline
                          className={TASK_ICON_LG_CLASS}
                          aria-hidden
                        />
                      )}
                    </TooltipTrigger>
                  </Tooltip>
                </ol>
              </div>
            </motion.div>
          )}
        </motion.div>

      </motion.div>
    </div>
  );
};

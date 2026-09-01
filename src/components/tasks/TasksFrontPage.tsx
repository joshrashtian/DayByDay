import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { usePopup } from "../../providers/PopupProvider";
import { useTasksStore } from "../../stores/tasksStore";
import { taskEditorPopupContent } from "./taskEditorPopupContent";
import {
  formatTaskDue,
  isTaskOverdue,
  isTaskDueToday,
} from "../../lib/taskDates";
import {
  IoCheckmarkCircle,
  IoCheckmarkCircleOutline,
  IoCreateOutline,
} from "react-icons/io5";
import {
  HomePomodoroPanel,
  HomePomodoroToggle,
} from "../home/HomePomodoroRail";
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
  const updateDragPointer = useHomeFocusStore((s) => s.updateDragPointer);
  const taskDragIntent = useHomeFocusStore((s) => s.taskDragIntent);
  const endTaskDrag = useHomeFocusStore((s) => s.endTaskDrag);
  const [isDropActive, setIsDropActive] = useState(false);
  const pomodoroPanelOpen = usePomodoroStore((s) => s.panelOpen);
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
    if (!isPointerDragging || taskDragIntent !== "focus") return;

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
    taskDragIntent,
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

  const activeCount = sortedTasks.filter((task) => !task.done).length;

  return (
    <div className="font-eudoxus text-ink">
      <motion.div
        layout
        className="flex min-h-100 flex-col gap-4 sm:min-h-112 sm:gap-5"
      >
        <div className="flex w-full items-start justify-between gap-3">
          <div className="min-w-0 flex flex-col items-start gap-1">
            <p className="font-baron text-lg font-bold uppercase tracking-[0.14em]">
              {activeBlockName ? `${activeBlockName} Tasks` : "All Tasks"}
            </p>
            <p className="font-eudoxus text-xs tracking-wide opacity-70">
              {sortedTasks.length} total &middot; {activeCount} active
            </p>
          </div>
          <div
            className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-sunken p-0.5"
          >
            <HomePomodoroToggle />
          </div>
        </div>

        <motion.div
          layout
          ref={dropZoneRef}
          className={`relative min-h-44 w-full rounded-2xl px-2 py-4 transition-colors duration-300 sm:min-h-40 sm:px-4 ${
            isDropActive ? "border border-accent bg-accent-soft" : ""
          } ${pomodoroPanelOpen ? "bg-sunken" : ""}`}
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
              <p className="font-ppneue text-xl font-medium opacity-75">
                {sortedTasks.length === 0
                  ? "Nothing here yet"
                  : activeCount === 0
                    ? "All caught up"
                    : "Pick a task to focus"}
              </p>
              <p className="font-eudoxus text-xs opacity-60">
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
                <h2 className="wrap-break-word text-center text-3xl font-semibold font-eudoxus sm:text-5xl">
                  {visibleFocusedTask.title}
                </h2>
                {visibleFocusedTask.description ? (
                  <p className="mt-1.5 text-center text-sm font-sans opacity-80">
                    {visibleFocusedTask.description}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs font-medium">
                  <span
                    className="rounded-md border-b border-accent bg-sunken px-2 py-0.5 font-quantify text-muted"
                  >
                    {visibleFocusedTask.critical
                      ? "Critical"
                      : visibleFocusedTask.priority
                        ? visibleFocusedTask.priority.charAt(0).toUpperCase() +
                          visibleFocusedTask.priority.slice(1)
                        : "No priority"}
                  </span>
                  <span
                    className="rounded-md border-b border-line bg-sunken px-2 py-0.5 font-quantify text-muted"
                  >
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
                    className={`text-center font-baron text-2xl tracking-[0.08em] sm:text-3xl ${isTaskOverdue(visibleFocusedTask.dueDate) ? "text-red-500" : "text-muted"}`}
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
                      className="inline-flex items-center justify-center rounded-full bg-surface p-3 text-muted transition-colors hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600"
                    >
                      <IoCreateOutline
                        className={TASK_ICON_LG_CLASS}
                        aria-hidden
                      />
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
                      className="inline-flex items-center justify-center rounded-full bg-surface p-3 text-muted transition-colors hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600"
                    >
                      {visibleFocusedTask.done ? (
                        <IoCheckmarkCircle
                          className={TASK_ICON_LG_CLASS}
                          aria-hidden
                        />
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

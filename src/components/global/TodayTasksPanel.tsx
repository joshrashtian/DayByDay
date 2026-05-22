import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { formatTaskDue } from "../../lib/taskDates";
import {
  getBlockScopedSidebarTasks,
  getTodaySidebarTasks,
} from "../../lib/sidebarTasks";
import { useDisplayedBlockName } from "../../hooks/useDisplayedBlockName";
import { useHomeFocusStore } from "../../stores/homeFocusStore";
import { useTasksStore } from "../../stores/tasksStore";
import { IoAdd, IoCheckmark, IoPencil, IoTrash } from "react-icons/io5";
import type { Task } from "@/types";
import { useContextMenu } from "../../providers/ContextMenuProvider";
import { usePopup } from "../../providers/PopupProvider";
import { TaskPreviewBottomSheet } from "../tasks/TaskPreviewBottomSheet";
import { taskCreatorPopupContent } from "../tasks/taskCreatorPopupContent";
import { taskEditorPopupContent } from "../tasks/taskEditorPopupContent";

export function useTodayTasksScope() {
  const location = useLocation();
  const onHome = location.pathname === "/";
  const displayedBlockName = useDisplayedBlockName();
  const { tasks } = useTasksStore(useShallow((s) => ({ tasks: s.tasks })));

  const panelTasks = useMemo(() => {
    if (onHome) {
      return getBlockScopedSidebarTasks(tasks, displayedBlockName);
    }
    return getTodaySidebarTasks(tasks);
  }, [tasks, onHome, displayedBlockName]);

  const activeCount = panelTasks.filter((task) => !task.done).length;
  const scopeLabel = onHome
    ? displayedBlockName
      ? displayedBlockName
      : "All day"
    : "Today";

  return {
    onHome,
    panelTasks,
    activeCount,
    scopeLabel,
  };
}

type TodayTasksPanelProps = {
  compact?: boolean;
};

export function TodayTasksPanel({ compact = false }: TodayTasksPanelProps) {
  const location = useLocation();
  const onHome = location.pathname === "/";
  const displayedBlockName = useDisplayedBlockName();
  const { panelTasks } = useTodayTasksScope();
  const { tasks, addTask, updateTask, toggleTask, removeTask } = useTasksStore(
    useShallow((s) => ({
      tasks: s.tasks,
      addTask: s.addTask,
      updateTask: s.updateTask,
      toggleTask: s.toggleTask,
      removeTask: s.removeTask,
    })),
  );
  const { open: openPopup, close: closePopup } = usePopup();
  const focusedTaskId = useHomeFocusStore((s) => s.focusedTaskId);
  const setFocusedTaskId = useHomeFocusStore((s) => s.setFocusedTaskId);
  const startTaskDrag = useHomeFocusStore((s) => s.startTaskDrag);
  const contextMenu = useContextMenu();
  const [previewTask, setPreviewTask] = useState<Task | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const closePreview = useCallback(() => {
    setPreviewOpen(false);
    setPreviewTask(null);
  }, []);

  useEffect(() => {
    if (!previewTask) return;
    const updated = tasks.find((t) => t.id === previewTask.id);
    if (updated) setPreviewTask(updated);
    else closePreview();
  }, [tasks, previewTask, closePreview]);

  const editTask = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      openPopup(taskEditorPopupContent({ task, updateTask, removeTask, closePopup }));
    },
    [tasks, openPopup, updateTask, closePopup],
  );

  const deleteTask = useCallback(
    (task: Task) => {
      removeTask(task.id);
      if (focusedTaskId === task.id) {
        setFocusedTaskId(null);
      }
    },
    [removeTask, focusedTaskId, setFocusedTaskId],
  );

  const openTaskPreview = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      setPreviewTask(task);
      setPreviewOpen(true);
    },
    [tasks],
  );

  const selectTask = useCallback(
    (taskId: string) => {
      if (onHome) {
        setFocusedTaskId(taskId);
        return;
      }
      openTaskPreview(taskId);
    },
    [onHome, setFocusedTaskId, openTaskPreview],
  );

  const openTaskFormPopup = useCallback(() => {
    openPopup(
      taskCreatorPopupContent({
        addTask,
        closePopup,
        initialBlock:
          onHome && displayedBlockName ? displayedBlockName : undefined,
      }),
    );
  }, [openPopup, addTask, closePopup, onHome, displayedBlockName]);
  return (
    <>
      {panelTasks.map((task) => (
        <button
          key={task.id}
          type="button"
          onClick={() => selectTask(task.id)}
          onContextMenu={(event) => {
            event.preventDefault();
            event.stopPropagation();
            contextMenu.openMenu(event, [
              {
                id: "edit-task",
                label: "Edit task",
                icon: <IoPencil />,
                onSelect: () => editTask(task.id),
              },
              {
                id: "delete-task",
                label: "Delete",
                icon: <IoTrash />,
                destructive: true,
                onSelect: () => deleteTask(task),
              },
            ]);
          }}
          onPointerDown={(event) => {
            if (!onHome) return;
            const rect = event.currentTarget.getBoundingClientRect();
            startTaskDrag(
              task.id,
              event.clientX,
              event.clientY,
              event.clientX - rect.left,
              event.clientY - rect.top,
            );
          }}
          className={`w-full rounded-xl  text-left transition-colors ${
            compact ? "px-2 py-1.5" : "px-3 py-2"
          } ${
            focusedTaskId === task.id
              ? "border-sky-400 bg-sky-50 dark:border-sky-500 dark:bg-sky-950/25"
              : "border-zinc-200/90 bg-white/85 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/65 dark:hover:bg-zinc-900"
          } ${task.done ? "opacity-60" : ""} cursor-grab active:cursor-grabbing`}
        >
          {!compact ? (
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
          ) : null}
          <p
            className={`truncate font-ppneue font-medium text-zinc-800 dark:text-zinc-100 ${
              compact ? "text-[12px] leading-snug" : "text-[13px]"
            }`}
          >
            {task.title}
          </p>
        </button>
      ))}
      {panelTasks.length === 0 ? (
        <div className="py-4 pl-1">
          <p className="font-ppneue text-sm font-medium text-zinc-400 dark:text-zinc-500">
            Nothing here yet.
          </p>
          <p className="mt-1 font-eudoxus text-xs text-zinc-300 dark:text-zinc-600">
            Add a task below or open the Tasks page.
          </p>
        </div>
      ) : null}
      <button
        type="button"
        onClick={openTaskFormPopup}
        className={`mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300/90 bg-white/50 font-eudoxus text-[11px] font-medium text-sky-600 transition-colors hover:border-sky-400/60 hover:bg-sky-50 dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-sky-400 dark:hover:border-sky-500/50 dark:hover:bg-sky-950/30 ${
          compact ? "px-2 py-1.5" : "px-3 py-2"
        }`}
      >
        <IoAdd className="text-sm" aria-hidden />
        Add Task
      </button>
      <TaskPreviewBottomSheet
        open={previewOpen}
        task={previewTask}
        onClose={closePreview}
        onToggle={toggleTask}
        onEdit={(task) => {
          closePreview();
          editTask(task.id);
        }}
      />
    </>
  );
}

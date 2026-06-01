import { useCallback } from "react";
import { IoAdd, IoPencil, IoTrash } from "react-icons/io5";
import { useShallow } from "zustand/react/shallow";
import { useLocation } from "react-router-dom";
import type { Task } from "@/types";
import { useTodayTasksScope } from "../TodayTasksPanel";
import { useSettingsStore } from "../../../stores/settingsStore";
import { useHomeFocusStore } from "../../../stores/homeFocusStore";
import { useTasksStore } from "../../../stores/tasksStore";
import { usePopup } from "../../../providers/PopupProvider";
import { useContextMenu } from "../../../providers/ContextMenuProvider";
import { taskCreatorPopupContent } from "../../tasks/taskCreatorPopupContent";
import { taskEditorPopupContent } from "../../tasks/taskEditorPopupContent";
import { isIcsTask } from "../../../lib/icsTasks";
import { useDisplayedBlockName } from "../../../hooks/useDisplayedBlockName";

function formatTaskDuration(task: Task): string | null {
  if (!task.dueDate || !task.endDate) return null;
  const mins = Math.round(
    (task.endDate.getTime() - task.dueDate.getTime()) / 60000,
  );
  if (mins <= 0) return null;
  if (mins >= 60) return `${Math.round(mins / 60)} hr`;
  return `${mins} min`;
}

type Props = {
  showLabel: boolean;
};

export function SidebarInlineTaskList({ showLabel }: Props) {
  const location = useLocation();
  const onHome = location.pathname === "/";
  const onCalendar = location.pathname.startsWith("/calendar");
  const canDragTask = onHome || onCalendar;
  const displayedBlockName = useDisplayedBlockName();
  const { panelTasks, activeCount, scopeLabel } = useTodayTasksScope();
  const categoryConfigs = useSettingsStore((s) => s.categoryConfigs);
  const focusedTaskId = useHomeFocusStore((s) => s.focusedTaskId);
  const setFocusedTaskId = useHomeFocusStore((s) => s.setFocusedTaskId);
  const startTaskDrag = useHomeFocusStore((s) => s.startTaskDrag);
  const { tasks, addTask, updateTask, removeTask } = useTasksStore(
    useShallow((s) => ({
      tasks: s.tasks,
      addTask: s.addTask,
      updateTask: s.updateTask,
      removeTask: s.removeTask,
    })),
  );
  const { open: openPopup, close: closePopup } = usePopup();
  const contextMenu = useContextMenu();

  const editTask = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      openPopup(
        taskEditorPopupContent({ task, updateTask, removeTask, closePopup }),
      );
    },
    [tasks, openPopup, updateTask, removeTask, closePopup],
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
    <div className="flex min-h-0 flex-1 max-h-1/2 flex-col gap-1.5">
      {/* Section header */}
      <div className="flex items-center justify-between px-1 pt-1">
        {showLabel ? (
          <>
            <span className="font-eudoxus text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
              {scopeLabel}
            </span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 font-eudoxus text-[10px] font-medium text-white/70">
              {activeCount} active
            </span>
          </>
        ) : (
          <span className="mx-auto font-eudoxus text-[10px] font-semibold text-white/60">
            {activeCount}
          </span>
        )}
      </div>

      {/* Task rows */}
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {panelTasks.length === 0 ? (
          showLabel ? (
            <p className="px-2 py-2 font-eudoxus text-xs text-white/60">
              Nothing scheduled.
            </p>
          ) : null
        ) : (
          panelTasks.map((task) => {
            const category = categoryConfigs.find(
              (c) => c.name === task.category,
            );
            const duration = formatTaskDuration(task);
            const isFocused = focusedTaskId === task.id;

            return (
              <button
                key={task.id}
                type="button"
                onClick={() => setFocusedTaskId(task.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  contextMenu.openMenu(e, [
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
                      onSelect: () => {
                        removeTask(task.id);
                        if (focusedTaskId === task.id) setFocusedTaskId(null);
                      },
                    },
                  ]);
                }}
                onPointerDown={(e) => {
                  if (!canDragTask || isIcsTask(task)) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  startTaskDrag(
                    task.id,
                    e.clientX,
                    e.clientY,
                    e.clientX - rect.left,
                    e.clientY - rect.top,
                    onCalendar ? "schedule" : "focus",
                  );
                }}
                className={`w-full rounded-xl px-2.5 py-2 text-left transition-colors ${
                  isFocused
                    ? "bg-white/25 ring-1 ring-inset ring-white/30"
                    : "hover:bg-white/10"
                } ${task.done ? "opacity-50" : ""} ${
                  canDragTask && !isIcsTask(task)
                    ? "cursor-grab active:cursor-grabbing"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span
                    className={`flex-1 truncate font-ppneue text-[12.5px] font-medium leading-snug text-white ${
                      task.done ? "line-through" : ""
                    }`}
                  >
                    {task.title}
                  </span>
                  {isFocused && showLabel && (
                    <span className="shrink-0 rounded-full bg-white/25 px-1.5 py-px font-eudoxus text-[9px] font-bold uppercase tracking-wide text-white">
                      Focus
                    </span>
                  )}
                </div>
                {showLabel && (category || duration) && (
                  <div className="mt-0.5 flex items-center gap-1 font-eudoxus text-[10px] text-white/60">
                    {category && (
                      <>
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span>{category.name}</span>
                      </>
                    )}
                    {category && duration && <span>·</span>}
                    {duration && <span>{duration}</span>}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Add task */}
      <button
        type="button"
        onClick={openTaskFormPopup}
        className="flex shrink-0 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/30 bg-white/10 px-3 py-2 font-eudoxus text-[11px] font-medium text-white/80 transition-colors hover:border-white/50 hover:bg-white/20"
      >
        <IoAdd className="text-sm" aria-hidden />
        {showLabel ? "Add a task" : ""}
      </button>
    </div>
  );
}

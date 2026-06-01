import { useState, type MouseEvent as ReactMouseEvent } from "react";
import { IoCheckmarkDone, IoEllipseOutline } from "react-icons/io5";
import { renderCategoryIcon } from "../../../lib/categoryIcons";
import { getTaskKindVisual } from "../../../lib/taskKinds";
import { resolveTaskCardVisual } from "../../../lib/taskCategories";
import { formatTaskDue } from "../../../lib/taskDates";
import { useContextMenu } from "../../../providers/ContextMenuProvider";
import type { CalendarTaskRow, Task } from "@/types";
import BottomSheet from "../../../ui/BottomSheet";

export const completedCheckeredStyle = {
  backgroundImage: "none",
  backgroundSize: "auto",
};

export type TaskListProps = {
  items: CalendarTaskRow[];
  onToggle: (id: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onDuplicateTask?: (taskId: string) => void;
  compact?: boolean;
};

export function TaskDueList({
  items,
  onToggle,
  onEditTask,
  onDeleteTask,
  onDuplicateTask,
  compact,
}: TaskListProps) {
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { openMenu } = useContextMenu();

  const openTask = (task: Task, e: ReactMouseEvent) => {
    e.stopPropagation();
    setSelectedTask(task);
    setBottomSheetOpen(true);
  };

  const closeSheet = () => {
    setBottomSheetOpen(false);
    setSelectedTask(null);
  };

  if (items.length === 0) {
    return (
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        {compact ? "—" : "Nothing due"}
      </p>
    );
  }

  return (
    <>
      {compact ? (
        <ul className="flex min-h-0 flex-col gap-1">
          {items.map(({ task, displayDueDate, rowKey }) => {
            const visual = resolveTaskCardVisual(task);
            return (
              <li key={rowKey}>
                <button
                  type="button"
                  onClick={(e) => openTask(task, e)}
                  onContextMenu={(e) =>
                    openMenu(e, [
                      ...(onEditTask
                        ? [
                            {
                              id: `edit-${task.id}`,
                              label: "Edit task…",
                              onSelect: () => onEditTask(task),
                            } as const,
                          ]
                        : []),
                      {
                        id: `toggle-${task.id}`,
                        label: task.done ? "Mark not done" : "Mark done",
                        onSelect: () => onToggle(task.id),
                      },
                      ...(onDuplicateTask
                        ? [
                            {
                              id: `duplicate-${task.id}`,
                              label: "Duplicate task",
                              onSelect: () => onDuplicateTask(task.id),
                            } as const,
                          ]
                        : []),
                      ...(onDeleteTask
                        ? [
                            {
                              id: `delete-${task.id}`,
                              label: "Delete",
                              onSelect: () => onDeleteTask(task.id),
                              destructive: true,
                            } as const,
                          ]
                        : []),
                    ])
                  }
                  className={`w-full rounded-xl px-2 py-1.5 text-left text-xs font-medium transition-[transform,filter,opacity] hover:brightness-105 active:scale-[0.99] ${
                    task.done ? "opacity-55 saturate-[0.7]" : ""
                  }`}
                  style={{
                    backgroundColor: visual.color,
                    color: visual.onColor,
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: visual.iconBg }}
                      aria-hidden
                    >
                      {visual.icon ? (
                        renderCategoryIcon(visual.icon, "h-3 w-3")
                      ) : (
                        <IoEllipseOutline className="h-3 w-3" />
                      )}
                    </span>
                    <span
                      className={`line-clamp-2 min-w-0 flex-1 font-black leading-snug ${task.done ? "line-through opacity-80" : ""}`}
                    >
                      {task.title}
                    </span>
                    {task.done ? (
                      <IoCheckmarkDone className="shrink-0" />
                    ) : null}
                  </div>
                  <time
                    dateTime={displayDueDate.toISOString()}
                    className="mt-1 block truncate pl-6.5 text-[10px] opacity-75"
                  >
                    {formatTaskDue(displayDueDate)}
                  </time>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {items.map(({ task, displayDueDate, rowKey }) => {
            const visual = resolveTaskCardVisual(task);
            const lightText = visual.onColor === "#ffffff";
            const chipBg = lightText
              ? "rgba(255,255,255,0.18)"
              : "rgba(0,0,0,0.10)";
            const descLines = (task.description ?? "")
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean);
            return (
              <li key={rowKey}>
                <button
                  type="button"
                  onClick={(e) => openTask(task, e)}
                  onContextMenu={(e) =>
                    openMenu(e, [
                      ...(onEditTask
                        ? [
                            {
                              id: `edit-${task.id}`,
                              label: "Edit task…",
                              onSelect: () => onEditTask(task),
                            } as const,
                          ]
                        : []),
                      {
                        id: `toggle-${task.id}`,
                        label: task.done ? "Mark not done" : "Mark done",
                        onSelect: () => onToggle(task.id),
                      },
                      ...(onDuplicateTask
                        ? [
                            {
                              id: `duplicate-${task.id}`,
                              label: "Duplicate task",
                              onSelect: () => onDuplicateTask(task.id),
                            } as const,
                          ]
                        : []),
                      ...(onDeleteTask
                        ? [
                            {
                              id: `delete-${task.id}`,
                              label: "Delete",
                              onSelect: () => onDeleteTask(task.id),
                              destructive: true,
                            } as const,
                          ]
                        : []),
                    ])
                  }
                  className={`flex w-full items-start gap-4 overflow-hidden rounded-[26px] px-5 py-5 text-left shadow-[0_10px_30px_rgba(15,15,15,0.12)] transition-[transform,box-shadow,opacity] hover:shadow-[0_18px_44px_rgba(15,15,15,0.18)] active:scale-[0.99] ${
                    task.done ? "opacity-55 saturate-[0.7]" : ""
                  }`}
                  style={{
                    backgroundColor: visual.color,
                    color: visual.onColor,
                  }}
                >
                  <span
                    className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: visual.iconBg }}
                    aria-hidden
                  >
                    {visual.icon ? (
                      renderCategoryIcon(visual.icon, "h-7 w-7")
                    ) : (
                      <IoEllipseOutline className="h-7 w-7" />
                    )}
                    {task.done ? (
                      <span className="absolute inset-0 grid place-items-center rounded-full bg-black/30">
                        <IoCheckmarkDone className="h-7 w-7 text-white" />
                      </span>
                    ) : null}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3
                      className={`wrap-break-word text-2xl font-black leading-tight tracking-tight ${
                        task.done ? "line-through" : ""
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.critical ? (
                      <p className="mt-0.5 font-display text-sm font-extrabold uppercase italic tracking-wide">
                        Critical
                      </p>
                    ) : task.priority ? (
                      <p className="mt-0.5 font-display text-sm font-extrabold uppercase italic tracking-wide">
                        {task.priority} priority
                      </p>
                    ) : null}

                    {descLines.length ? (
                      <ul className="mt-2 space-y-0.5 text-base font-medium">
                        {descLines.map((line, i) => (
                          <li key={i} className="flex gap-2">
                            <span aria-hidden>•</span>
                            <span className="min-w-0 wrap-break-word">
                              {line}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <time
                        dateTime={displayDueDate.toISOString()}
                        className="rounded-full px-2.5 py-0.5"
                        style={{ backgroundColor: chipBg }}
                      >
                        {formatTaskDue(displayDueDate)}
                      </time>
                      {task.block ? (
                        <span
                          className="rounded-full px-2.5 py-0.5"
                          style={{ backgroundColor: chipBg }}
                        >
                          {task.block}
                        </span>
                      ) : null}
                      {task.tags?.map((tag) => (
                        <span key={tag} className="opacity-80">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <BottomSheet
        open={bottomSheetOpen}
        onClose={closeSheet}
        defaultSnap="full"
        title={selectedTask?.title ?? "Task"}
      >
        {selectedTask ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {selectedTask.done ? "Completed" : "Open"} · Due{" "}
              {selectedTask.dueDate
                ? formatTaskDue(selectedTask.dueDate)
                : "not set"}
            </p>
            {selectedTask.description ? (
              <p className="text-sm leading-relaxed">
                {selectedTask.description}
              </p>
            ) : null}
            <div className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
              {selectedTask.priority ? (
                <p>Priority: {selectedTask.priority}</p>
              ) : null}
              <p>Type: {getTaskKindVisual(selectedTask.kind).label}</p>
              {selectedTask.block ? <p>Block: {selectedTask.block}</p> : null}
              {selectedTask.category ? (
                <p>Category: {selectedTask.category}</p>
              ) : null}
              {selectedTask.tags?.length ? (
                <p>Tags: {selectedTask.tags.join(", ")}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                onToggle(selectedTask.id);
                closeSheet();
              }}
              className="mt-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              Toggle done
            </button>
            {onEditTask ? (
              <button
                type="button"
                onClick={() => {
                  onEditTask(selectedTask);
                  closeSheet();
                }}
                className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                Edit
              </button>
            ) : null}
          </div>
        ) : null}
      </BottomSheet>
    </>
  );
}

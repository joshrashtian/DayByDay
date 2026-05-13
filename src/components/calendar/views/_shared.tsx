import { useState, type MouseEvent as ReactMouseEvent } from "react";
import { IoCheckmarkDone } from "react-icons/io5";
import { renderCategoryIcon } from "../../../lib/categoryIcons";
import { getTaskKindVisual } from "../../../lib/taskKinds";
import { resolveCategoryVisual } from "../../../lib/taskCategories";
import { formatTaskDue } from "../../../lib/taskDates";
import { useContextMenu } from "../../../providers/ContextMenuProvider";
import type { CalendarTaskRow } from "../../../lib/calendarUtils";
import type { Task } from "../../../types/task";
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
  compact?: boolean;
};

export function TaskDueList({
  items,
  onToggle,
  onEditTask,
  onDeleteTask,
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
            const categoryVisual = resolveCategoryVisual(task.category);
            const kindVisual = getTaskKindVisual(task.kind);
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
                  className={`w-full rounded-lg border px-2 py-1.5 text-left text-xs font-medium transition-colors hover:bg-white/60 dark:hover:bg-white/10 ${
                    task.done
                      ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-900 shadow-[0_0_0_1px_rgba(16,185,129,0.15)] dark:bg-emerald-500/20 dark:text-emerald-100"
                      : task.critical
                      ? "border-red-500/80 bg-red-500/5"
                      : "border-white/30 bg-white/30 dark:border-white/15 dark:bg-white/5"
                  }`}
                  style={task.done ? completedCheckeredStyle : undefined}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex max-w-full items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${kindVisual.subtleBadgeClass}`}
                    >
                      {kindVisual.label}
                    </span>
                    {task.critical ? (
                      <span className="text-[10px] font-display italic text-red-500">
                        CRITICAL
                      </span>
                    ) : task.category && categoryVisual ? (
                      <span
                        className="inline-flex max-w-full items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                        style={{
                          backgroundColor: categoryVisual.bg,
                          color: categoryVisual.text,
                          borderColor: categoryVisual.border,
                        }}
                      >
                        {categoryVisual.icon ? (
                          <span className="inline-flex items-center">
                            {renderCategoryIcon(categoryVisual.icon)}
                          </span>
                        ) : null}
                        <span className="truncate">{task.category}</span>
                      </span>
                    ) : null}
                    {task.done ? (
                      <span className="inline-flex items-center justify-center rounded-full bg-emerald-500/20 p-0.5 text-emerald-700 dark:bg-emerald-400/25 dark:text-emerald-100">
                        <IoCheckmarkDone />
                      </span>
                    ) : null}
                  </div>
                  <span
                    className={`line-clamp-2 font-black leading-snug ${task.done ? "line-through opacity-80" : ""}`}
                  >
                    {task.title}
                  </span>
                  <time
                    dateTime={displayDueDate.toISOString()}
                    className={`mt-1 block truncate text-[10px] ${
                      task.done
                        ? "text-emerald-700/80 dark:text-emerald-200/90"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {formatTaskDue(displayDueDate)}
                  </time>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map(({ task, displayDueDate, rowKey }) => {
            const categoryVisual = resolveCategoryVisual(task.category);
            const kindVisual = getTaskKindVisual(task.kind);
            return (
              <li key={rowKey} className="flex flex-row items-center gap-2">
                {task.done ? (
                  <span
                    className="relative inline-grid h-14 w-14 shrink-0 place-items-center before:absolute before:z-0 before:h-10 before:w-10 before:rotate-45 before:rounded-sm before:bg-red-500 before:content-['']"
                    aria-hidden
                  >
                    <IoCheckmarkDone className="relative z-10 text-3xl text-white" />
                  </span>
                ) : null}
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
                  className={`w-full rounded-xl px-3 py-2 text-left font-medium transition-colors hover:bg-white/60 dark:border-white/10 dark:hover:bg-white/10 ${
                    task.done
                      ? "border border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15"
                      : "dark:bg-white/5"
                  }`}
                  style={task.done ? completedCheckeredStyle : undefined}
                >
                  {task.priority && !task.critical ? (
                    <span className="block text-lg font-display italic text-zinc-500">
                      {task.priority.toUpperCase()} PRIORITY
                    </span>
                  ) : null}
                  {task.critical ? (
                    <span className="block text-lg font-display italic text-red-500">
                      CRITICAL — {formatTaskDue(displayDueDate)}
                    </span>
                  ) : (
                    <time
                      dateTime={displayDueDate.toISOString()}
                      className="mb-1 block text-base text-zinc-500 dark:text-zinc-400"
                    >
                      {formatTaskDue(displayDueDate)}
                    </time>
                  )}
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${kindVisual.badgeClass}`}
                    >
                      {kindVisual.label}
                    </span>
                    {task.block ? (
                      <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                        {task.block}
                      </span>
                    ) : null}
                    {task.category && categoryVisual ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
                        style={{
                          backgroundColor: categoryVisual.bg,
                          color: categoryVisual.text,
                          borderColor: categoryVisual.border,
                        }}
                      >
                        {categoryVisual.icon ? (
                          <span className="inline-flex items-center">
                            {renderCategoryIcon(categoryVisual.icon)}
                          </span>
                        ) : null}
                        {task.category}
                      </span>
                    ) : null}
                  </div>
                  <span
                    className={`line-clamp-2 text-3xl font-black leading-tight ${
                      task.done
                        ? "line-through text-zinc-500 dark:text-zinc-400"
                        : ""
                    }`}
                  >
                    {task.title}
                  </span>
                  {task.done ? (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-400/25 dark:text-emerald-100">
                      <IoCheckmarkDone className="text-sm" />
                      Completed
                    </span>
                  ) : null}
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

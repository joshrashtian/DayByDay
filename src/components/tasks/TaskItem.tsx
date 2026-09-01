import {
  IoCheckmark,
  IoClose,
  IoCreateOutline,
  IoPencil,
  IoRepeatOutline,
  IoTrash,
} from "react-icons/io5";
import { renderCategoryIcon } from "../../lib/categoryIcons";
import { resolveCategoryVisual } from "../../lib/taskCategories";
import { formatTaskDue, taskDueToIso } from "../../lib/taskDates";
import { useContextMenu } from "../../providers/ContextMenuProvider";
import type { Task, TaskPriority } from "@/types";
import { normalizeTaskTags } from "../../types/task";

type Props = {
  task: Task;
  onToggle: () => void;
  onDelete?: () => void;
  onEditTask?: () => void;
  onSetTags?: (tags: string[] | undefined) => void;
};

function priorityLabel(p: TaskPriority) {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

function priorityChipClass(p: TaskPriority) {
  if (p === "high")
    return "bg-rose-500/15 text-rose-800 ring-rose-500/25 dark:text-rose-200";
  if (p === "medium")
    return "bg-amber-500/15 text-amber-900 ring-amber-500/25 dark:text-amber-100";
  return "bg-slate-500/12 text-slate-800 ring-slate-500/20";
}

function recurrenceLabel(task: Task): string | undefined {
  if (!task.recurrence) return undefined;
  const dayLabels: Record<number, string> = {
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
    7: "Sun",
  };
  const cadence =
    task.recurrence.frequency === "daily"
      ? task.recurrence.interval === 1
        ? "day"
        : "days"
      : task.recurrence.frequency === "weekly"
        ? task.recurrence.interval === 1
          ? "week"
          : "weeks"
        : task.recurrence.interval === 1
          ? "month"
          : "months";
  let base = `Repeats every ${task.recurrence.interval} ${cadence}`;
  if (
    task.recurrence.frequency === "weekly" &&
    task.recurrence.weekdays?.length
  ) {
    const onDays = task.recurrence.weekdays
      .map((day) => dayLabels[day] ?? "")
      .filter(Boolean)
      .join(", ");
    if (onDays) base += ` on ${onDays}`;
  }
  if (!task.recurrence.untilDate) return base;
  return `${base}, until ${formatTaskDue(task.recurrence.untilDate)}`;
}

export function TaskItem({
  task,
  onToggle,
  onDelete,
  onEditTask,
  onSetTags,
}: Props) {
  const { openMenu } = useContextMenu();
  const tags = task.tags ?? [];
  const categoryVisual = resolveCategoryVisual(task.category);
  const isDone = task.done;

  const removeTag = (label: string) => {
    if (!onSetTags) return;
    const remaining = tags.filter(
      (x) => x.toLowerCase() !== label.toLowerCase(),
    );
    onSetTags(normalizeTaskTags(remaining));
  };

  return (
    <li className="list-none">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onContextMenu={(e) =>
          openMenu(e, [
            ...(onEditTask
              ? [
                  {
                    id: "edit-task",
                    label: "Edit task…",
                    onSelect: onEditTask,
                    icon: <IoPencil />,
                  } as const,
                ]
              : []),
            {
              id: "toggle",
              label: isDone ? "Mark Not Done" : "Mark Done",
              onSelect: onToggle,
              icon: <IoCheckmark />,
            },
            ...(onDelete
              ? [
                  {
                    id: "delete",
                    label: "Delete",
                    onSelect: onDelete,
                    destructive: true,
                    icon: <IoTrash />,
                  } as const,
                ]
              : []),
          ])
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-line/70 bg-surface/45 px-4 py-3.5 shadow-[0_4px_24px_rgba(15,15,15,0.06),inset_0_1px_0_rgba(255,255,255,0.85)] outline-none backdrop-blur-xl backdrop-saturate-150 ring-1 ring-line/30 transition-shadow hover:shadow-[0_14px_40px_rgba(15,15,15,0.1)] focus-visible:ring-2 focus-visible:ring-line-strong/50 active:scale-[0.99] dark:shadow-[0_4px_28px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:shadow-[0_14px_40px_rgba(0,0,0,0.45)]"
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-surface/70 via-surface/15 to-transparent opacity-80"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 45%, transparent 55%, rgba(255,255,255,0.12) 100%)",
          }}
          aria-hidden
        />
        <div className="relative flex min-w-0 flex-col gap-2">
          <div className="flex min-w-0 items-center gap-3.5">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                isDone
                  ? "border-emerald-500/60 bg-emerald-500/25 text-emerald-800"
                  : "border-line-strong/45 bg-surface/50 group-hover:border-zinc-500/55"
              }`}
              aria-hidden
            >
              {isDone ? (
                <svg
                  className="h-3 w-3"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M2.5 6L5 8.5L9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </span>
            <span
              className={`min-w-0 flex-1 wrap-break-word text-lg font-medium tracking-tight text-ink transition-[color,opacity] ${
                isDone
                  ? "text-muted line-through opacity-70"
                  : ""
              }`}
            >
              {task.title}
            </span>
            {onEditTask ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTask();
                }}
                className="shrink-0 rounded-md p-1.5 text-muted transition-colors hover:bg-sunken/50 hover:text-ink"
                aria-label="Edit task"
                title="Edit task"
              >
                <IoCreateOutline className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </div>
          <div
            className="flex min-w-0 flex-wrap items-center gap-2 pl-8 text-xs font-medium text-muted"
            onClick={(e) => e.stopPropagation()}
          >
            {task.block ? (
              <span className="rounded-md bg-sky-500/12 px-2 py-0.5 text-sky-900 ring-1 ring-sky-500/25 dark:text-sky-200">
                {task.block}
              </span>
            ) : null}
            {task.category ? (
              <span
                className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full border px-2 py-0.5"
                style={{
                  backgroundColor: categoryVisual.bg,
                  color: categoryVisual.text,
                  borderColor: categoryVisual.border,
                }}
              >
                {categoryVisual.icon
                  ? renderCategoryIcon(categoryVisual.icon)
                  : null}
                <span className="wrap-break-word">{task.category}</span>
              </span>
            ) : null}
            {task.dueDate ? (
              <time
                dateTime={taskDueToIso(task.dueDate)}
                className="rounded-md bg-surface/50 px-2 py-0.5 ring-1 ring-line/80"
              >
                {formatTaskDue(task.dueDate)}
              </time>
            ) : null}
            {task.priority ? (
              <span
                className={`rounded-md px-2 py-0.5 ring-1 ${priorityChipClass(task.priority)}`}
              >
                {priorityLabel(task.priority)}
              </span>
            ) : null}
            {task.recurrence ? (
              <span
                className="inline-flex items-center gap-0.5 rounded-md bg-surface/50 px-2 py-0.5 ring-1 ring-line/80"
                title={recurrenceLabel(task)}
              >
                <IoRepeatOutline
                  className="h-3.5 w-3.5 shrink-0 opacity-80"
                  aria-hidden
                />
                <span className="sr-only">Repeating task</span>
              </span>
            ) : null}
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex max-w-40 items-center gap-0.5 rounded-md bg-violet-500/12 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-900 ring-1 ring-violet-500/25 dark:text-violet-200"
              >
                <span className="min-w-0 truncate">{tag}</span>
                {onSetTags ? (
                  <button
                    type="button"
                    className="shrink-0 rounded p-0.5 text-violet-700/80 transition-colors hover:bg-violet-500/20 hover:text-violet-950 dark:text-violet-300"
                    aria-label={`Remove tag ${tag}`}
                    onClick={() => removeTag(tag)}
                  >
                    <IoClose className="h-3 w-3" aria-hidden />
                  </button>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      </div>
    </li>
  );
}

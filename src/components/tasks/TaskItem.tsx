import { motion } from "motion/react";
import { IoClose, IoRepeatOutline } from "react-icons/io5";
import { formatTaskDue, taskDueToIso } from "../../lib/taskDates";
import { useContextMenu } from "../../providers/ContextMenuProvider";
import {
  normalizeTaskTags,
  type Task,
  type TaskPriority,
} from "../../types/task";

type Props = {
  task: Task;
  onToggle: () => void;
  onDelete?: () => void;
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
  return "bg-slate-500/12 text-slate-800 ring-slate-500/20 dark:text-slate-200";
}

export function TaskItem({ task, onToggle, onDelete, onSetTags }: Props) {
  const { openMenu } = useContextMenu();
  const tags = task.tags ?? [];

  const removeTag = (label: string) => {
    if (!onSetTags) return;
    const remaining = tags.filter(
      (x) => x.toLowerCase() !== label.toLowerCase(),
    );
    onSetTags(normalizeTaskTags(remaining));
  };

  return (
    <li
      className="perspective-[1100px] list-none"
      style={{ transformStyle: "preserve-3d" }}
    >
      <motion.div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onContextMenu={(e) =>
          openMenu(e, [
            {
              id: "toggle",
              label: task.done ? "Mark not done" : "Mark done",
              onSelect: onToggle,
            },
            ...(onDelete
              ? [
                  {
                    id: "delete",
                    label: "Delete",
                    onSelect: onDelete,
                    destructive: true,
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
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/70 bg-white/45 px-4 py-3.5 shadow-[0_4px_24px_rgba(15,15,15,0.06),inset_0_1px_0_rgba(255,255,255,0.85)] outline-none backdrop-blur-xl backdrop-saturate-150 ring-1 ring-white/30 transition-shadow focus-visible:ring-2 focus-visible:ring-zinc-400/50 dark:border-white/15 dark:bg-zinc-900/35 dark:shadow-[0_4px_28px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] dark:ring-white/10"
        style={{ transformStyle: "preserve-3d" }}
        initial={false}
        whileHover={{
          rotateX: -4,
          rotateY: 4.5,
          scale: 1.02,
          boxShadow:
            "0 14px 40px rgba(15,15,15,0.1), inset 0 1px 0 rgba(255,255,255,0.95)",
          transition: { type: "spring", stiffness: 380, damping: 26 },
        }}
        whileTap={{ scale: 0.985 }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-white/70 via-white/15 to-transparent opacity-80"
          style={{ transform: "translateZ(12px)" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            transform: "translateZ(8px)",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 45%, transparent 55%, rgba(255,255,255,0.12) 100%)",
          }}
          aria-hidden
        />
        <div
          className="relative flex min-w-0 flex-col gap-2"
          style={{ transform: "translateZ(20px)" }}
        >
          <div className="flex min-w-0 items-center gap-3.5">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                task.done
                  ? "border-emerald-500/60 bg-emerald-500/25 text-emerald-800"
                  : "border-zinc-400/45 bg-white/50 group-hover:border-zinc-500/55 dark:border-zinc-500/40 dark:bg-white/10"
              }`}
              aria-hidden
            >
              {task.done ? (
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
              className={`min-w-0 flex-1 wrap-break-word text-lg font-medium tracking-tight text-zinc-900 transition-[color,opacity] dark:text-zinc-100 ${
                task.done
                  ? "text-zinc-500 line-through opacity-70 dark:text-zinc-400"
                  : ""
              }`}
            >
              {task.title}
            </span>
          </div>
          <div
            className="flex min-w-0 flex-wrap items-center gap-2 pl-8 text-xs font-medium text-zinc-600 dark:text-zinc-400"
            onClick={(e) => e.stopPropagation()}
          >
            {task.block ? (
              <span className="rounded-md bg-sky-500/12 px-2 py-0.5 text-sky-900 ring-1 ring-sky-500/25 dark:text-sky-200">
                {task.block}
              </span>
            ) : null}
            {task.category ? (
              <span className="min-w-0 max-w-full wrap-break-word text-zinc-600 dark:text-zinc-400">
                {task.category}
              </span>
            ) : null}
            {task.dueDate ? (
              <time
                dateTime={taskDueToIso(task.dueDate)}
                className="rounded-md bg-white/50 px-2 py-0.5 ring-1 ring-zinc-200/80 dark:bg-zinc-950/40 dark:ring-zinc-600/50"
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
                className="inline-flex items-center gap-0.5 rounded-md bg-white/50 px-2 py-0.5 ring-1 ring-zinc-200/80 dark:bg-zinc-950/40 dark:ring-zinc-600/50"
                title={`Repeats every ${task.recurrence.interval} ${task.recurrence.frequency === "daily" ? (task.recurrence.interval === 1 ? "day" : "days") : task.recurrence.frequency === "weekly" ? (task.recurrence.interval === 1 ? "week" : "weeks") : task.recurrence.interval === 1 ? "month" : "months"}`}
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
                    className="shrink-0 rounded p-0.5 text-violet-700/80 transition-colors hover:bg-violet-500/20 hover:text-violet-950 dark:text-violet-300 dark:hover:text-white"
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
      </motion.div>
    </li>
  );
}

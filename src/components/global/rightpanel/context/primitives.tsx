import type { ReactNode } from "react";
import type { Task } from "@/types";
import { formatTaskDue } from "@/lib/taskDates";
import { resolveTaskCardVisual } from "@/lib/taskCategories";
import { useTasksStore } from "@/stores/tasksStore";
import { sidebarTokens } from "../../sidebar/sidebarTokens";

/** Small building blocks shared by the per-page context panels. */

export function PanelSection({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-4 last:mb-0">
      <header className="mb-1.5 flex items-center justify-between px-1.5">
        <h4
          className={`font-mono text-[10px] uppercase tracking-wide ${sidebarTokens.mutedText}`}
        >
          {title}
        </h4>
        {aside ? (
          <span
            className={`text-[10px] tabular-nums ${sidebarTokens.mutedText}`}
          >
            {aside}
          </span>
        ) : null}
      </header>
      {children}
    </section>
  );
}

export function StatTile({
  label,
  value,
  accent,
  bgclassName,
  valueClassName,
  labelClassName,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
  bgclassName?: string;
  valueClassName?: string;
  labelClassName?: string;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 ${sidebarTokens.divider} ${
        accent ? "bg-accent-soft" : sidebarTokens.surface
      } ${bgclassName}`}
    >
      <p
        className={`font-eudoxus text-xl font-black tabular-nums leading-tight ${
          accent ? "text-accent" : sidebarTokens.primaryText
        } ${valueClassName}`}
      >
        {value}
      </p>
      <p
        className={`text-[11px] font-mono ${sidebarTokens.mutedText} ${labelClassName}`}
      >
        {label}
      </p>
    </div>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p
      className={`px-1.5 py-1 text-xs leading-relaxed ${sidebarTokens.mutedText}`}
    >
      {children}
    </p>
  );
}

/**
 * A compact task row with a working checkbox. `when` overrides the default
 * due label (e.g. the calendar panel shows the occurrence, not the anchor).
 */
export function TaskRow({ task, when }: { task: Task; when?: string }) {
  const toggleTask = useTasksStore((s) => s.toggleTask);
  const visual = resolveTaskCardVisual(task);
  const label =
    when ?? (task.dueDate ? formatTaskDue(task.dueDate) : undefined);

  return (
    <li
      className={`flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors ${sidebarTokens.rowHover}`}
    >
      <button
        type="button"
        onClick={() => toggleTask(task.id)}
        aria-label={task.done ? "Mark incomplete" : "Mark complete"}
        aria-pressed={task.done}
        className="flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
        style={{
          borderColor: visual.color,
          background: task.done ? visual.color : "transparent",
        }}
      >
        {task.done ? (
          <span
            className="size-1.5 rounded-full"
            style={{ background: visual.onColor }}
          />
        ) : null}
      </button>
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-xs font-semibold ${
            task.done ? "line-through opacity-60" : ""
          } ${sidebarTokens.primaryText}`}
        >
          {task.title}
        </span>
        {label || task.category ? (
          <span
            className={`block truncate text-[11px] ${sidebarTokens.mutedText}`}
          >
            {[label, task.category].filter(Boolean).join(" · ")}
          </span>
        ) : null}
      </span>
    </li>
  );
}

export function TaskList({
  tasks,
  whenFor,
  empty,
}: {
  tasks: Task[];
  whenFor?: (task: Task) => string | undefined;
  empty: string;
}) {
  if (tasks.length === 0) return <EmptyNote>{empty}</EmptyNote>;
  return (
    <ul className="space-y-0.5">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} when={whenFor?.(task)} />
      ))}
    </ul>
  );
}

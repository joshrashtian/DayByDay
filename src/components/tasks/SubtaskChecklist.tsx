import { useState, type FormEvent } from "react";
import { IoAdd, IoClose } from "react-icons/io5";
import { useShallow } from "zustand/react/shallow";
import { getSubtasks } from "../../lib/subtasks";
import { useTasksStore } from "../../stores/tasksStore";
import type { Task } from "@/types";

type Props = {
  parentId: string;
  /** Focus the "add subtask" field on mount (e.g. from "Add subtask…"). */
  autoFocusAdd?: boolean;
  /** Tighter spacing for use inside a task row. */
  compact?: boolean;
};

/** Live checklist of a task's subtasks, with an inline "add" field. Reads from
 * the store by id, so it stays current inside popups that hold a snapshot. */
export function SubtaskChecklist({
  parentId,
  autoFocusAdd = false,
  compact = false,
}: Props) {
  const subtasks = useTasksStore(
    useShallow((s) => getSubtasks(s.tasks, parentId)),
  );
  const { addSubtask, toggleTask, removeTask, setTaskTitle } = useTasksStore(
    useShallow((s) => ({
      addSubtask: s.addSubtask,
      toggleTask: s.toggleTask,
      removeTask: s.removeTask,
      setTaskTitle: s.setTaskTitle,
    })),
  );
  const [draft, setDraft] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (addSubtask(parentId, draft)) setDraft("");
  };

  return (
    // Lives inside clickable task rows: keep clicks and keys (Space toggles
    // the row) from reaching the parent.
    <div
      className={`flex flex-col ${compact ? "gap-0.5" : "gap-1"}`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {subtasks.length > 0 ? (
        <ul className="flex flex-col gap-0.5">
          {subtasks.map((subtask) => (
            <SubtaskRow
              key={subtask.id}
              subtask={subtask}
              onToggle={() => toggleTask(subtask.id)}
              onDelete={() => removeTask(subtask.id)}
              onRename={(title) => setTaskTitle(subtask.id, title)}
            />
          ))}
        </ul>
      ) : null}
      <form onSubmit={onSubmit} className="flex items-center gap-2 px-1.5">
        <IoAdd className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDraft("");
              e.currentTarget.blur();
            }
          }}
          autoFocus={autoFocusAdd}
          placeholder="Add subtask"
          aria-label="Add subtask"
          className="min-w-0 flex-1 bg-transparent py-1 text-sm text-ink outline-none placeholder:text-muted/70"
        />
      </form>
    </div>
  );
}

function SubtaskRow({
  subtask,
  onToggle,
  onDelete,
  onRename,
}: {
  subtask: Task;
  onToggle: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const [title, setTitle] = useState(subtask.title);
  const [editing, setEditing] = useState(false);

  const commit = () => {
    setEditing(false);
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(subtask.title);
      return;
    }
    if (trimmed !== subtask.title) onRename(trimmed);
  };

  return (
    <li className="group/subtask flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 hover:bg-sunken/40">
      <button
        type="button"
        onClick={onToggle}
        className={`flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] transition-colors ${
          subtask.done
            ? "border-emerald-500/60 bg-emerald-500/25 text-emerald-800 dark:text-emerald-200"
            : "border-black/35 dark:border-zinc-200/45 hover:border-zinc-500/60"
        }`}
        aria-label={subtask.done ? "Mark subtask not done" : "Mark subtask done"}
        aria-pressed={subtask.done}
      >
        {subtask.done ? (
          <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </button>
      {editing ? (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setTitle(subtask.title);
              setEditing(false);
            }
          }}
          autoFocus
          aria-label="Subtask title"
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none"
        />
      ) : (
        <span
          onDoubleClick={() => {
            setTitle(subtask.title);
            setEditing(true);
          }}
          title="Double-click to rename"
          className={`min-w-0 flex-1 wrap-break-word text-sm ${
            subtask.done ? "text-muted line-through opacity-70" : "text-ink"
          }`}
        >
          {subtask.title}
        </span>
      )}
      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 rounded p-0.5 text-muted opacity-0 transition-opacity hover:text-red-600 focus-visible:opacity-100 group-hover/subtask:opacity-100"
        aria-label={`Delete subtask ${subtask.title}`}
      >
        <IoClose className="h-3.5 w-3.5" aria-hidden />
      </button>
    </li>
  );
}

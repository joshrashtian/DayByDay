import { DateTime } from "luxon";
import { useState, type ReactNode } from "react";
import { IoClose, IoCode, IoPencil, IoTrash } from "react-icons/io5";
import { formatTaskDue } from "../../lib/taskDates";
import { getTaskKindVisual } from "../../lib/taskKinds";
import { recurrenceLabel } from "../../lib/taskRecurrenceLabel";
import type { Task } from "@/types";
import { usePopup } from "@/providers/PopupProvider";
import { TaskJSONPopup } from "./TaskJSONPopup";
import { domMax } from "framer-motion";

type Args = {
  task: Task;
  closePopup: () => void;
  onToggle?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

function formatWhen(task: Task): string | null {
  if (!task.dueDate) return null;
  const start = formatTaskDue(task.dueDate);
  if (!task.endDate) return start;
  return `${start} – ${formatTaskDue(task.endDate)}`;
}

function formatStamp(date: Date | undefined): string | null {
  if (!date) return null;
  return DateTime.fromJSDate(date).toLocaleString(DateTime.DATETIME_MED);
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-ink">{children}</dd>
    </div>
  );
}

/** Real component so hooks are allowed; `taskInfoPopupContent` below is the plain factory the popup API expects. */
function TaskInfoPopup({
  task,
  closePopup,
  onToggle,
  onEdit,
  onDelete,
}: Args): ReactNode {
  const [newTask, setNewTask] = useState(task);

  const kindVisual = getTaskKindVisual(task.kind);
  const when = formatWhen(task);
  const repeats = recurrenceLabel(task);
  const tags = task.tags ?? [];
  const created = formatStamp(task.createdAt);
  const completed = task.done ? formatStamp(task.lastCompletedAt) : null;

  const { open: openPopupJSON } = usePopup();

  const openJSON = () => {
    openPopupJSON(<TaskJSONPopup task={newTask} />);
  };

  return (
    <div className="p-5 sm:p-6 relative ">
      <div className="flex flex-row items-center    gap-3">
        <div className="min-w-0 flex-1 ">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {kindVisual.label}
            {task.done ? " · Done" : ""}
          </p>
          <input
            className={`mt-1 text-2xl font-black text-ink ${
              task.done ? "line-through opacity-70" : ""
            }`}
            value={newTask.title}
            onChange={(e) => {
              setNewTask((d) => ({ ...d, title: e.target.value }));
            }}
          />
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {when ? <Field label="When">{when}</Field> : null}
        {task.block ? <Field label="Block">{task.block}</Field> : null}
        {task.category ? <Field label="Category">{task.category}</Field> : null}
        {task.priority ? (
          <Field label="Priority">
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </Field>
        ) : null}
        {repeats ? <Field label="Repeats">{repeats}</Field> : null}
        {task.classLocation ? (
          <Field label="Location">{task.classLocation}</Field>
        ) : null}
        {task.classGrade ? (
          <Field label="Grade">{task.classGrade}</Field>
        ) : null}
        {tags.length ? (
          <Field label="Tags">
            <span className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-violet-500/12 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-900 ring-1 ring-violet-500/25 dark:text-violet-200"
                >
                  {tag}
                </span>
              ))}
            </span>
          </Field>
        ) : null}
        {task.description ? (
          <div className="sm:col-span-2">
            <Field label="Description">
              <span className="whitespace-pre-wrap text-muted">
                {task.description}
              </span>
            </Field>
          </div>
        ) : null}
        {task.notes ? (
          <div className="sm:col-span-2">
            <Field label="Notes">
              <textarea
                value={newTask.notes ?? ""}
                onChange={(e) =>
                  setNewTask((t) => ({ ...t, notes: e.target.value }))
                }
                className="w-full rounded-lg border border-line bg-surface/60 px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-line-strong/50"
                rows={3}
              />
            </Field>
          </div>
        ) : null}
        {created ? (
          <Field label="Created">
            <span className="text-muted">{created}</span>
          </Field>
        ) : null}
        {completed ? (
          <Field label="Completed">
            <span className="text-muted">{completed}</span>
          </Field>
        ) : null}
        <button
          onClick={() => {
            openJSON();
          }}
          className="flex bg-zinc-300 rounded-full flex-row justify-center items-center gap-2"
        >
          <IoCode /> JSON Editor
        </button>
      </dl>

      <div className="mt-6 flex flex-wrap gap-2">
        {onToggle ? (
          <button
            type="button"
            onClick={() => {
              onToggle();
              closePopup();
            }}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {task.done ? "Mark not done" : "Mark done"}
          </button>
        ) : null}
        {onEdit ? (
          <button
            type="button"
            onClick={() => {
              closePopup();
              onEdit();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-sunken/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <IoPencil className="size-3.5" aria-hidden />
            Edit
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            onClick={() => {
              onDelete();
              closePopup();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-surface px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/40"
          >
            <IoTrash className="size-3.5" aria-hidden />
            Delete
          </button>
        ) : null}
        <button
          type="button"
          onClick={closePopup}
          className="ml-auto rounded-lg px-4 py-2 top-3 right-0 absolute text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          <IoClose />
        </button>
      </div>
    </div>
  );
}

export function taskInfoPopupContent(args: Args): ReactNode {
  return <TaskInfoPopup {...args} />;
}

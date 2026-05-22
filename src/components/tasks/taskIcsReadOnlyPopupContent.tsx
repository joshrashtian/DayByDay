import { DateTime } from "luxon";
import type { ReactNode } from "react";
import { IoDocumentTextOutline } from "react-icons/io5";
import { formatTaskDue } from "../../lib/taskDates";
import { getTaskKindVisual } from "../../lib/taskKinds";
import type { Task } from "@/types";

type Args = {
  task: Task;
  onRemove?: () => void;
  closePopup: () => void;
};

function formatRange(task: Task): string | null {
  if (!task.dueDate) return null;
  const start = formatTaskDue(task.dueDate);
  if (!task.endDate) return start;
  const end = formatTaskDue(task.endDate);
  return `${start} – ${end}`;
}

export function taskIcsReadOnlyPopupContent({
  task,
  onRemove,
  closePopup,
}: Args): ReactNode {
  const kindVisual = getTaskKindVisual(task.kind);
  const KindIcon = kindVisual.Icon;
  const when = formatRange(task);
  const importedAt = task.createdAt
    ? DateTime.fromJSDate(task.createdAt).toLocaleString(DateTime.DATETIME_MED)
    : null;

  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${kindVisual.subtleBadgeClass}`}
        >
          <KindIcon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Imported calendar event
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {task.title}
          </h2>
        </div>
      </div>

      <div
        className="mt-4 rounded-xl border border-amber-100 bg-amber-50/80 p-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
        role="note"
      >
        ICS events stay read-only so imported schedules stay in sync with the
        source file. Re-import the `.ics` file to refresh, or remove imported
        events below.
      </div>

      <dl className="mt-5 space-y-4">
        {when ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              When
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
              {when}
            </dd>
          </div>
        ) : null}
        {task.category ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Category
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
              {task.category}
            </dd>
          </div>
        ) : null}
        {task.classLocation ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Location
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
              {task.classLocation}
            </dd>
          </div>
        ) : null}
        {task.description ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Description
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
              {task.description}
            </dd>
          </div>
        ) : null}
        {importedAt ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Imported
            </dt>
            <dd className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
              {importedAt}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={closePopup}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Close
        </button>
        {onRemove ? (
          <button
            type="button"
            onClick={() => {
              onRemove();
              closePopup();
            }}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:border-red-900/50 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-red-950/40"
          >
            Remove import
          </button>
        ) : null}
      </div>

      <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
        <IoDocumentTextOutline className="size-3.5" aria-hidden />
        Type: {kindVisual.label}
      </p>
    </div>
  );
}

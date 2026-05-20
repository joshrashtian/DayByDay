import { useEffect, useState } from "react";
import BottomSheet from "../../ui/BottomSheet";
import { getTaskKindVisual } from "../../lib/taskKinds";
import { formatTaskDue } from "../../lib/taskDates";
import type { Task } from "@/types";

type Props = {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onToggle: (taskId: string) => void;
  onEdit?: (task: Task) => void;
};

export function TaskPreviewBottomSheet({
  task,
  open,
  onClose,
  onToggle,
  onEdit,
}: Props) {
  const [liveTask, setLiveTask] = useState<Task | null>(task);

  useEffect(() => {
    setLiveTask(task);
  }, [task]);

  const preview = liveTask;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      defaultSnap="half"
      snapPoints={["peek", "half", "full"]}
      title={preview?.title ?? "Task"}
    >
      {preview ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {preview.done ? "Completed" : "Open"} · Due{" "}
            {preview.dueDate ? formatTaskDue(preview.dueDate) : "not set"}
          </p>
          {preview.description ? (
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {preview.description}
            </p>
          ) : null}
          {preview.notes ? (
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {preview.notes}
            </p>
          ) : null}
          <div className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
            {preview.priority ? <p>Priority: {preview.priority}</p> : null}
            {preview.critical ? <p>Critical</p> : null}
            <p>Type: {getTaskKindVisual(preview.kind).label}</p>
            {preview.block ? <p>Block: {preview.block}</p> : null}
            {preview.category ? <p>Category: {preview.category}</p> : null}
            {preview.tags?.length ? (
              <p>Tags: {preview.tags.join(", ")}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onToggle(preview.id)}
            className="mt-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            {preview.done ? "Mark as active" : "Mark complete"}
          </button>
          {onEdit ? (
            <button
              type="button"
              onClick={() => onEdit(preview)}
              className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Edit
            </button>
          ) : null}
        </div>
      ) : null}
    </BottomSheet>
  );
}

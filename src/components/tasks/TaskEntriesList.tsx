import type { Task } from "@/types";
import type { TaskListEntry } from "../../lib/recurringTasks";
import { RecurringTaskStack } from "./RecurringTaskStack";
import { TaskItem } from "./TaskItem";

type Props = {
  entries: TaskListEntry[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEditTask: (task: Task) => void;
  onSetTags: (id: string, tags: string[] | undefined) => void;
};

export function TaskEntriesList({
  entries,
  onToggle,
  onDelete,
  onEditTask,
  onSetTags,
}: Props) {
  return (
    <ul className="flex w-full flex-col gap-3">
      {entries.map((entry) =>
        entry.kind === "stack" ? (
          <RecurringTaskStack
            key={entry.seriesId}
            tasks={entry.tasks}
            representative={entry.representative}
            onToggle={onToggle}
            onDelete={onDelete}
            onEditTask={onEditTask}
            onSetTags={onSetTags}
          />
        ) : (
          <TaskItem
            key={entry.task.id}
            task={entry.task}
            onToggle={() => onToggle(entry.task.id)}
            onDelete={() => onDelete(entry.task.id)}
            onEditTask={() => onEditTask(entry.task)}
            onSetTags={(tags) => onSetTags(entry.task.id, tags)}
          />
        ),
      )}
    </ul>
  );
}

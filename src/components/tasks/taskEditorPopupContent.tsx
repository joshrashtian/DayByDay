import { DateTime } from "luxon";
import type { ReactNode } from "react";
import { localInputForDateTime } from "../../lib/taskDates";
import { isIcsTask } from "../../lib/icsTasks";
import type { Task, UpdateTaskPayload } from "@/types";
import { TaskCreatorPopupForm } from "./TaskCreatorPopupForm";
import { taskIcsReadOnlyPopupContent } from "./taskIcsReadOnlyPopupContent";

type Args = {
  task: Task;
  updateTask: (taskId: string, payload: UpdateTaskPayload) => void;
  removeTask?: (taskId: string) => void;
  closePopup: () => void;
};

function dateToLocalInput(value: Date | undefined): string | undefined {
  if (!value) return undefined;
  const dt = DateTime.fromJSDate(value);
  if (!dt.isValid) return undefined;
  return localInputForDateTime(dt);
}

export function taskEditorPopupContent({
  task,
  updateTask,
  removeTask,
  closePopup,
}: Args): ReactNode {
  if (isIcsTask(task)) {
    return taskIcsReadOnlyPopupContent({
      task,
      onRemove: removeTask ? () => removeTask(task.id) : undefined,
      closePopup,
    });
  }

  const dueLocal = dateToLocalInput(task.dueDate);
  const endLocal = dateToLocalInput(task.endDate);
  const recurrenceUntilLocal = dateToLocalInput(task.recurrence?.untilDate);

  return (
    <div className="p-5 pb-0 sm:p-6 sm:pb-0">
      <TaskCreatorPopupForm
        mode="edit"
        headingText="EDIT TASK"
        submitText="Save Changes"
        initialKind={task.kind}
        initialTitle={task.title}
        initialBlock={task.block ?? ""}
        initialCategory={task.category ?? ""}
        initialTagsInput={(task.tags ?? []).join(", ")}
        initialDescription={task.description ?? ""}
        initialNotes={task.notes ?? ""}
        initialDueLocal={dueLocal}
        initialEndLocal={endLocal}
        initialPriority={task.priority ?? ""}
        initialCritical={Boolean(task.critical)}
        initialRecurrenceChoice={task.recurrence?.frequency ?? "none"}
        initialRecurrenceInterval={task.recurrence?.interval ?? 1}
        initialRecurrenceWeekdays={task.recurrence?.weekdays ?? []}
        initialRecurrenceUntilLocal={recurrenceUntilLocal}
        onSave={(payload) => {
          updateTask(task.id, payload);
          closePopup();
        }}
        onDismiss={closePopup}
      />
    </div>
  );
}

import { DateTime } from "luxon";
import type { ReactNode } from "react";
import { localInputForDateTime } from "../../lib/taskDates";
import type { Task, UpdateTaskPayload } from "../../types/task";
import { TaskCreatorPopupForm } from "./TaskCreatorPopupForm";

type Args = {
  task: Task;
  updateTask: (taskId: string, payload: UpdateTaskPayload) => void;
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
  closePopup,
}: Args): ReactNode {
  const dueLocal = dateToLocalInput(task.dueDate);
  const endLocal = dateToLocalInput(task.endDate);

  return (
    <div className="p-5 sm:p-6">
      <TaskCreatorPopupForm
        mode="edit"
        headingText="EDIT TASK"
        submitText="Save Changes"
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
        onSave={(payload) => {
          updateTask(task.id, payload);
          closePopup();
        }}
        onDismiss={closePopup}
      />
    </div>
  );
}

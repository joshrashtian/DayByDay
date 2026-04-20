import type { ReactNode } from "react";
import type { AddTaskPayload } from "../../types/task";
import { TaskCreatorPopupForm } from "./TaskCreatorPopupForm";

type Args = {
  addTask: (payload: AddTaskPayload) => void;
  closePopup: () => void;
  initialDueLocal?: string;
  initialEndLocal?: string;
};

export function taskCreatorPopupContent({
  addTask,
  closePopup,
  initialDueLocal,
  initialEndLocal,
}: Args): ReactNode {
  return (
    <div className="p-5 sm:p-6">
      <TaskCreatorPopupForm
        key={`${initialDueLocal ?? "__default__"}::${initialEndLocal ?? "__none__"}`}
        initialDueLocal={initialDueLocal}
        initialEndLocal={initialEndLocal}
        onAdd={(payload) => {
          addTask(payload);
          closePopup();
        }}
        onAddAnother={(payload) => {
          addTask(payload);
        }}
        onDismiss={closePopup}
      />
    </div>
  );
}

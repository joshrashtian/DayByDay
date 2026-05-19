import type { ReactNode } from "react";
import type { AddTaskPayload, TaskKind } from "@/types";
import { TaskCreatorPopupForm } from "./TaskCreatorPopupForm";

type Args = {
  addTask: (payload: AddTaskPayload) => void;
  closePopup: () => void;
  initialDueLocal?: string;
  initialEndLocal?: string;
  initialKind?: TaskKind;
};

export function taskCreatorPopupContent({
  addTask,
  closePopup,
  initialDueLocal,
  initialEndLocal,
  initialKind,
}: Args): ReactNode {
  return (
    <div className="p-5 sm:p-6">
      <TaskCreatorPopupForm
        key={`${initialDueLocal ?? "__default__"}::${initialEndLocal ?? "__none__"}`}
        initialKind={initialKind}
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

import type { ReactNode } from "react";
import type { AddTaskPayload, TaskKind } from "@/types";
import { TaskCreatorPopupForm } from "./TaskCreatorPopupForm";

type Args = {
  addTask: (payload: AddTaskPayload) => void;
  closePopup: () => void;
  initialDueLocal?: string;
  initialEndLocal?: string;
  initialKind?: TaskKind;
  initialBlock?: string;
};

export function taskCreatorPopupContent({
  addTask,
  closePopup,
  initialDueLocal,
  initialEndLocal,
  initialKind,
  initialBlock,
}: Args): ReactNode {
  return (
    <div className="p-5 pb-0 sm:p-6 sm:pb-0">
      <TaskCreatorPopupForm
        key={`${initialDueLocal ?? "__default__"}::${initialEndLocal ?? "__none__"}::${initialBlock ?? "__none__"}`}
        initialKind={initialKind}
        initialDueLocal={initialDueLocal}
        initialEndLocal={initialEndLocal}
        initialBlock={initialBlock}
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

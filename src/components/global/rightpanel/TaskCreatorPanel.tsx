import { TaskCreatorPopupForm } from "@/components/tasks/TaskCreatorPopupForm";
import type { TaskCreatorRequest } from "@/providers/RightPanelProvider";
import { useTasksStore } from "@/stores/tasksStore";

/**
 * The task creator as a right-panel body. Shown in place of the active tab
 * while a creator request is open (see `openTaskCreator`).
 */
export function TaskCreatorPanel({
  request,
  onClose,
}: {
  request: TaskCreatorRequest;
  onClose: () => void;
}) {
  const addTask = useTasksStore((s) => s.addTask);

  return (
    <div className="pt-1">
      <TaskCreatorPopupForm
        key={request.key}
        variant="panel"
        initialKind={request.initialKind}
        initialDueLocal={request.initialDueLocal}
        initialEndLocal={request.initialEndLocal}
        initialBlock={request.initialBlock}
        initialCategory={request.initialCategory}
        onAdd={(payload) => {
          addTask(payload);
          onClose();
        }}
        onAddAnother={addTask}
        onDismiss={onClose}
      />
    </div>
  );
}

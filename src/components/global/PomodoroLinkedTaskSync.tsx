import { useEffect } from "react";
import { useHomeFocusStore } from "../../stores/homeFocusStore";
import { useTasksStore } from "../../stores/tasksStore";
import { usePomodoroStore } from "../../stores/pomodoroStore";

/**
 * Keeps the pomodoro's linked task title in sync with the globally focused
 * task, regardless of which screen is mounted. The Tasks screen sets
 * `focusedTaskId` (e.g. via the sidebar FOCUS task), but its local sync only
 * runs while that screen is mounted — this mirrors it app-wide.
 */
export function PomodoroLinkedTaskSync() {
  const focusedTaskId = useHomeFocusStore((s) => s.focusedTaskId);
  const tasks = useTasksStore((s) => s.tasks);
  const setLinkedTaskTitle = usePomodoroStore((s) => s.setLinkedTaskTitle);

  useEffect(() => {
    const focusedTask = focusedTaskId
      ? tasks.find((task) => task.id === focusedTaskId)
      : undefined;
    if (focusedTask && !focusedTask.done) {
      setLinkedTaskTitle(focusedTask.title);
    } else {
      setLinkedTaskTitle(undefined);
    }
  }, [focusedTaskId, tasks, setLinkedTaskTitle]);

  return null;
}

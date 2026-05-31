import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import {
  clearActiveCalendarDropTarget,
  resolveCalendarDropTarget,
  scheduleDatesForDropTarget,
  setActiveCalendarDropTarget,
} from "../lib/calendarDropTargets";
import { isIcsTask } from "../lib/icsTasks";
import { useHomeFocusStore } from "../stores/homeFocusStore";
import { useTasksStore } from "../stores/tasksStore";

export function useCalendarTaskDrop() {
  const location = useLocation();
  const onCalendar = location.pathname.startsWith("/calendar");
  const isPointerDragging = useHomeFocusStore((s) => s.isPointerDragging);
  const taskDragIntent = useHomeFocusStore((s) => s.taskDragIntent);
  const draggedTaskId = useHomeFocusStore((s) => s.draggedTaskId);
  const updateDragPointer = useHomeFocusStore((s) => s.updateDragPointer);
  const endTaskDrag = useHomeFocusStore((s) => s.endTaskDrag);
  const { tasks, setTaskSchedule } = useTasksStore(
    useShallow((s) => ({
      tasks: s.tasks,
      setTaskSchedule: s.setTaskSchedule,
    })),
  );

  useEffect(() => {
    if (!onCalendar || !isPointerDragging || taskDragIntent !== "schedule") {
      return;
    }

    const finishDrag = (x: number, y: number) => {
      const target = resolveCalendarDropTarget(x, y);
      if (target && draggedTaskId) {
        const task = tasks.find((t) => t.id === draggedTaskId);
        if (task && !isIcsTask(task)) {
          const { dueDate, endDate } = scheduleDatesForDropTarget(
            target,
            task.dueDate,
            task.endDate,
          );
          setTaskSchedule(draggedTaskId, dueDate, endDate);
        }
      }
      clearActiveCalendarDropTarget();
      endTaskDrag();
    };

    const onPointerMove = (event: PointerEvent) => {
      updateDragPointer(event.clientX, event.clientY);
      setActiveCalendarDropTarget(event.clientX, event.clientY);
    };

    const onPointerUp = (event: PointerEvent) => {
      finishDrag(event.clientX, event.clientY);
    };

    const onPointerCancel = () => {
      clearActiveCalendarDropTarget();
      endTaskDrag();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      clearActiveCalendarDropTarget();
    };
  }, [
    onCalendar,
    isPointerDragging,
    taskDragIntent,
    draggedTaskId,
    tasks,
    setTaskSchedule,
    updateDragPointer,
    endTaskDrag,
  ]);
}

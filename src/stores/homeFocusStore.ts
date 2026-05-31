import { create } from "zustand";

export type TaskDragIntent = "focus" | "schedule";

type HomeFocusState = {
  focusedTaskId: string | null;
  draggedTaskId: string | null;
  taskDragIntent: TaskDragIntent | null;
  isPointerDragging: boolean;
  dragPointer: { x: number; y: number };
  dragGrabOffset: { x: number; y: number };
  setFocusedTaskId: (id: string | null) => void;
  startTaskDrag: (
    taskId: string,
    pointerX: number,
    pointerY: number,
    grabOffsetX: number,
    grabOffsetY: number,
    intent?: TaskDragIntent,
  ) => void;
  updateDragPointer: (x: number, y: number) => void;
  endTaskDrag: () => void;
};

export const useHomeFocusStore = create<HomeFocusState>((set) => ({
  focusedTaskId: null,
  draggedTaskId: null,
  taskDragIntent: null,
  isPointerDragging: false,
  dragPointer: { x: 0, y: 0 },
  dragGrabOffset: { x: 0, y: 0 },
  setFocusedTaskId: (id) => set({ focusedTaskId: id }),
  startTaskDrag: (
    taskId,
    pointerX,
    pointerY,
    grabOffsetX,
    grabOffsetY,
    intent = "focus",
  ) =>
    set({
      draggedTaskId: taskId,
      taskDragIntent: intent,
      isPointerDragging: true,
      dragPointer: { x: pointerX, y: pointerY },
      dragGrabOffset: { x: grabOffsetX, y: grabOffsetY },
    }),
  updateDragPointer: (x, y) => set({ dragPointer: { x, y } }),
  endTaskDrag: () =>
    set({
      draggedTaskId: null,
      taskDragIntent: null,
      isPointerDragging: false,
    }),
}));

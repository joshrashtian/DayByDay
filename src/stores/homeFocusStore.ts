import { create } from "zustand";

type HomeFocusState = {
  focusedTaskId: string | null;
  draggedTaskId: string | null;
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
  ) => void;
  updateDragPointer: (x: number, y: number) => void;
  endTaskDrag: () => void;
};

export const useHomeFocusStore = create<HomeFocusState>((set) => ({
  focusedTaskId: null,
  draggedTaskId: null,
  isPointerDragging: false,
  dragPointer: { x: 0, y: 0 },
  dragGrabOffset: { x: 0, y: 0 },
  setFocusedTaskId: (id) => set({ focusedTaskId: id }),
  startTaskDrag: (taskId, pointerX, pointerY, grabOffsetX, grabOffsetY) =>
    set({
      draggedTaskId: taskId,
      isPointerDragging: true,
      dragPointer: { x: pointerX, y: pointerY },
      dragGrabOffset: { x: grabOffsetX, y: grabOffsetY },
    }),
  updateDragPointer: (x, y) => set({ dragPointer: { x, y } }),
  endTaskDrag: () =>
    set({
      draggedTaskId: null,
      isPointerDragging: false,
    }),
}));

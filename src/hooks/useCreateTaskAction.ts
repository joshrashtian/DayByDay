import { useCallback, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useTasksStore } from "../stores/tasksStore";
import { usePopup } from "../providers/PopupProvider";
import { taskCreatorPopupContent } from "../components/tasks/taskCreatorPopupContent";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    target.isContentEditable ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT"
  );
}

export function useCreateTaskAction() {
  const addTask = useTasksStore((s) => s.addTask);
  const { open: openPopup, close: closePopup } = usePopup();

  const openCreateTaskPopup = useCallback(() => {
    openPopup(taskCreatorPopupContent({ addTask, closePopup }));
  }, [openPopup, addTask, closePopup]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen("create-task", () => {
      openCreateTaskPopup();
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, [openCreateTaskPopup]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.shiftKey || event.altKey) return;
      if (event.key.toLowerCase() !== "n") return;

      event.preventDefault();
      openCreateTaskPopup();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openCreateTaskPopup]);
}

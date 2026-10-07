import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useRightPanel } from "../providers/RightPanelProvider";

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
  const { openTaskCreator } = useRightPanel();

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen("create-task", () => {
      openTaskCreator();
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, [openTaskCreator]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.shiftKey || event.altKey) return;
      if (event.key.toLowerCase() !== "n") return;

      event.preventDefault();
      openTaskCreator();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openTaskCreator]);
}

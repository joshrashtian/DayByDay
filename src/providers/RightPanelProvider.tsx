import { listen } from "@tauri-apps/api/event";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import type { TaskKind } from "@/types";

/** Prefill for the task creator; every field is optional. */
export type TaskCreatorOptions = {
  initialDueLocal?: string;
  initialEndLocal?: string;
  initialKind?: TaskKind;
  initialBlock?: string;
  initialCategory?: string;
};

/** An open creator. `key` changes on every open so the form remounts fresh. */
export type TaskCreatorRequest = TaskCreatorOptions & { key: number };

type RightPanelContextType = {
  isOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  /** Non-null while the panel body is showing the task creator. */
  taskCreator: TaskCreatorRequest | null;
  /** Opens the panel with the task creator in place of the active tab. */
  openTaskCreator: (options?: TaskCreatorOptions) => void;
  closeTaskCreator: () => void;
};

const RightPanelContext = createContext<RightPanelContextType | undefined>(
  undefined,
);

export const useRightPanel = () => {
  const ctx = useContext(RightPanelContext);
  if (!ctx)
    throw new Error("useRightPanel must be used within RightPanelProvider");
  return ctx;
};

export function RightPanelProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isOpen = useSettingsStore((s) => s.rightPanel.open);
  const setRightPanel = useSettingsStore((s) => s.setRightPanel);

  const openPanel = useCallback(
    () => setRightPanel({ open: true }),
    [setRightPanel],
  );
  const closePanel = useCallback(
    () => setRightPanel({ open: false }),
    [setRightPanel],
  );
  const togglePanel = useCallback(
    () => setRightPanel({ open: !useSettingsStore.getState().rightPanel.open }),
    [setRightPanel],
  );

  const [taskCreator, setTaskCreator] = useState<TaskCreatorRequest | null>(
    null,
  );
  const creatorKeyRef = useRef(0);
  const openTaskCreator = useCallback(
    (options: TaskCreatorOptions = {}) => {
      creatorKeyRef.current += 1;
      setTaskCreator({ ...options, key: creatorKeyRef.current });
      setRightPanel({ open: true });
    },
    [setRightPanel],
  );
  const closeTaskCreator = useCallback(() => setTaskCreator(null), []);

  // Closing the panel abandons an in-progress task, so it doesn't reappear
  // the next time the panel opens for something else.
  const wasOpenRef = useRef(isOpen);
  useEffect(() => {
    if (wasOpenRef.current && !isOpen) setTaskCreator(null);
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  // Native menu: View → Toggle Right Panel
  useEffect(() => {
    const unlisten = listen("toggle-right-panel", () => togglePanel());
    return () => {
      unlisten.then((off) => off());
    };
  }, [togglePanel]);

  // Legacy window event dispatched by useMenuNavigation's "profile" route
  useEffect(() => {
    const handler = () => togglePanel();
    window.addEventListener("rbd:open-profile", handler);
    return () => window.removeEventListener("rbd:open-profile", handler);
  }, [togglePanel]);

  // Cmd/Ctrl+Shift+\ mirrors the sidebar's Cmd+\ (Shift turns "\" into "|")
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || !event.shiftKey) return;
      if (event.key !== "|" && event.key !== "\\") return;
      event.preventDefault();
      togglePanel();
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [togglePanel]);

  const value = useMemo(
    () => ({
      isOpen,
      openPanel,
      closePanel,
      togglePanel,
      taskCreator,
      openTaskCreator,
      closeTaskCreator,
    }),
    [
      isOpen,
      openPanel,
      closePanel,
      togglePanel,
      taskCreator,
      openTaskCreator,
      closeTaskCreator,
    ],
  );

  return (
    <RightPanelContext.Provider value={value}>
      {children}
    </RightPanelContext.Provider>
  );
}

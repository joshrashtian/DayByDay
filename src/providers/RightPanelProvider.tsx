import { listen } from "@tauri-apps/api/event";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useSettingsStore } from "@/stores/settingsStore";

type RightPanelContextType = {
  isOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
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
    () => ({ isOpen, openPanel, closePanel, togglePanel }),
    [isOpen, openPanel, closePanel, togglePanel],
  );

  return (
    <RightPanelContext.Provider value={value}>
      {children}
    </RightPanelContext.Provider>
  );
}

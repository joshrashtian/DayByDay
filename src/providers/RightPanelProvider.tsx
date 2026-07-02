import { listen } from "@tauri-apps/api/event";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { IoClose } from "react-icons/io5";
import { ProfilePanel } from "@/components/panels/ProfilePanel";

// ─── Panel registry ───────────────────────────────────────────────────────────
// Add new panels here. Each entry defines the shell header and the content.

export type RightPanelId = "profile";

type PanelConfig = {
  label: string;
  title: React.ReactNode;
  Component: React.ComponentType;
};

const PANELS: Record<RightPanelId, PanelConfig> = {
  profile: {
    label: "Profile",
    title: (
      <>
        Your
        <span className="font-black italic underline underline-offset-4">
          self
        </span>
        .
      </>
    ),
    Component: ProfilePanel,
  },
};

// ─── Context ──────────────────────────────────────────────────────────────────

type RightPanelContextType = {
  activePanel: RightPanelId | null;
  openPanel: (id: RightPanelId) => void;
  closePanel: () => void;
  togglePanel: (id: RightPanelId) => void;
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

// ─── Provider ─────────────────────────────────────────────────────────────────

export function RightPanelProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activePanel, setActivePanel] = useState<RightPanelId | null>(null);

  const openPanel = useCallback((id: RightPanelId) => setActivePanel(id), []);
  const closePanel = useCallback(() => setActivePanel(null), []);
  const togglePanel = useCallback(
    (id: RightPanelId) => setActivePanel((prev) => (prev === id ? null : id)),
    [],
  );

  // Tauri menu: "Toggle Right Panel" → toggle the profile panel (default)
  useEffect(() => {
    const unlisten = listen("toggle-right-panel", () => {
      togglePanel("profile");
    });
    return () => {
      unlisten.then((off) => off());
    };
  }, [togglePanel]);

  // Legacy window event dispatched by useMenuNavigation "profile" route
  useEffect(() => {
    const handler = () => togglePanel("profile");
    window.addEventListener("rbd:open-profile", handler);
    return () => window.removeEventListener("rbd:open-profile", handler);
  }, [togglePanel]);

  // Escape closes the panel
  useEffect(() => {
    if (!activePanel) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activePanel, closePanel]);

  const value = useMemo(
    () => ({ activePanel, openPanel, closePanel, togglePanel }),
    [activePanel, openPanel, closePanel, togglePanel],
  );

  const panelConfig = activePanel ? PANELS[activePanel] : null;
  const isOpen = activePanel !== null;

  return (
    <RightPanelContext.Provider value={value}>
      {children}

      <aside
        role="complementary"
        aria-label={panelConfig?.label ?? "Right panel"}
        className={`fixed inset-y-0 right-0 z-60 flex w-[360px] rounded-l-3xl flex-col bg-linear-to-bl from-slate-100 to-blue-100 shadow-2xl transition-transform duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-950 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <header className="shrink-0  px-5 py-4 ">
          <div className="pr-10">
            <p className="font-display text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {panelConfig?.label ?? ""}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {panelConfig?.title ?? ""}
            </h2>
          </div>
          <button
            type="button"
            onClick={closePanel}
            className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label="Close panel"
          >
            <IoClose className="h-5 w-5" />
          </button>
        </header>

        {/* Body — only mount when open to avoid unnecessary renders */}
        {panelConfig && <panelConfig.Component />}
      </aside>
    </RightPanelContext.Provider>
  );
}

import { useEffect, useRef, useState } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useAppViewportWidth } from "../../../hooks/useAppViewportWidth";
import {
  clampRightPanelWidth,
  clampRightPanelWidthToViewport,
  getNearestRightPanelSnapWidth,
  resolveRightPanelLayoutMode,
  resolveRightPanelOverlayWidth,
  RIGHT_PANEL_DEFAULT_WIDTH,
  type RightPanelLayoutMode,
} from "../../../lib/rightPanelLayout";
import { useRightPanel } from "../../../providers/RightPanelProvider";
import { useSettingsStore } from "../../../stores/settingsStore";
import { sidebarTokens } from "../sidebar/sidebarTokens";
import { SiSpotify } from "react-icons/si";
import { IoCompassOutline } from "react-icons/io5";
import { ContextPanel } from "./context/ContextPanel";
import { SpotifyListeningHistory } from "./SpotifyListeningHistory";

// ─── Panel tabs ───────────────────────────────────────────────────────────────
// Add new tabs here. Each entry is an icon in the strip plus the body it shows.

type PanelTab = {
  id: string;
  label: string;
  icon: React.ReactNode;
  Component: React.ComponentType;
};

const PANEL_TABS: PanelTab[] = [
  {
    // Follows the route: see lib/rightPanelContext.ts for the page → panel map.
    id: "page",
    label: "This page",
    icon: <IoCompassOutline />,
    Component: ContextPanel,
  },
  {
    id: "spotify",
    label: "Spotify",
    icon: <SiSpotify />,
    Component: SpotifyListeningHistory,
  },
];

const SWIPE_CLOSE_THRESHOLD = 56;
const EDGE_SWIPE_OPEN_THRESHOLD = 48;
const EDGE_SWIPE_ZONE_WIDTH = 28;

type RightPanelProps = {
  /** Reports how much horizontal room the panel claims in the layout. */
  onWidthChange?: (width: number) => void;
};

/**
 * The right-hand companion to the sidebar. Same surface, same resize and
 * swipe mechanics, mirrored to the right edge. Content is a strip of tabs
 * (`PANEL_TABS`) with the active tab's body filling the rest.
 */
export function RightPanel({ onWidthChange }: RightPanelProps) {
  const { isOpen, openPanel, closePanel } = useRightPanel();
  const storedWidth = useSettingsStore((s) => s.rightPanel.width);
  const setRightPanel = useSettingsStore((s) => s.setRightPanel);

  const [panelWidth, setPanelWidth] = useState<number>(
    getNearestRightPanelSnapWidth(storedWidth || RIGHT_PANEL_DEFAULT_WIDTH),
  );
  const [previewWidth, setPreviewWidth] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [edgeSwipeStartX, setEdgeSwipeStartX] = useState<number | null>(null);
  const [activeTabId, setActiveTabId] = useState(PANEL_TABS[0]?.id ?? "");
  const activeTab =
    PANEL_TABS.find((tab) => tab.id === activeTabId) ?? PANEL_TABS[0];

  const viewportWidth = useAppViewportWidth();
  const [layoutMode, setLayoutMode] = useState<RightPanelLayoutMode>(() =>
    resolveRightPanelLayoutMode(viewportWidth),
  );

  useEffect(() => {
    setLayoutMode((previous) =>
      resolveRightPanelLayoutMode(viewportWidth, previous),
    );
  }, [viewportWidth]);

  const isOverlay = layoutMode === "overlay";

  useEffect(() => {
    setRightPanel({ width: panelWidth });
  }, [panelWidth, setRightPanel]);

  const location = useLocation();
  const lastPathRef = useRef(location.pathname);
  useEffect(() => {
    if (lastPathRef.current === location.pathname) return;
    lastPathRef.current = location.pathname;
    if (isOverlay) closePanel();
  }, [location.pathname, isOverlay, closePanel]);

  useEffect(() => {
    if (!isOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isOpen, closePanel]);

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (event: PointerEvent) => {
      // The handle sits on the left edge, so width grows as the pointer moves left.
      setPreviewWidth(clampRightPanelWidth(viewportWidth - event.clientX - 8));
    };

    const handlePointerUp = () => {
      if (previewWidth !== null) {
        setPanelWidth(getNearestRightPanelSnapWidth(previewWidth));
      }
      setPreviewWidth(null);
      setIsResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isResizing, previewWidth, viewportWidth]);

  const resolvedWidth = isOverlay
    ? resolveRightPanelOverlayWidth(panelWidth, viewportWidth)
    : clampRightPanelWidthToViewport(previewWidth ?? panelWidth, viewportWidth);

  // In overlay mode the panel floats, so it claims no room in the layout.
  const layoutOffset = isOverlay || !isOpen ? 0 : resolvedWidth;
  useEffect(() => {
    onWidthChange?.(layoutOffset);
  }, [layoutOffset, onWidthChange]);

  return (
    <>
      <AnimatePresence>
        {isOverlay && isOpen ? (
          <motion.div
            key="right-panel-scrim"
            className="fixed inset-0 z-40 bg-overlay backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            onPointerDown={closePanel}
            aria-hidden
          />
        ) : null}
      </AnimatePresence>
      <div
        data-right-panel-layout={layoutMode}
        className="fixed inset-y-0 right-0 z-50 flex items-stretch"
      >
        <AnimatePresence initial={false} mode="wait">
          {isOpen ? (
            <motion.aside
              key="right-panel"
              role="complementary"
              aria-label="Right panel"
              className={`relative flex h-full flex-col overflow-hidden px-3 pt-9 pb-3 bg-zinc-200/80 dark:bg-zinc-950 ${sidebarTokens.surface} border-l border-line`}
              style={{ width: resolvedWidth }}
              initial={{ x: 24 }}
              animate={{ x: 0 }}
              exit={{ x: 24 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              onPointerDown={(event) => {
                if (isResizing) return;
                setSwipeStartX(event.clientX);
              }}
              onPointerMove={(event) => {
                if (swipeStartX === null) return;
                const deltaX = event.clientX - swipeStartX;
                if (deltaX >= SWIPE_CLOSE_THRESHOLD) {
                  closePanel();
                  setSwipeStartX(null);
                }
              }}
              onPointerUp={(event) => {
                if (swipeStartX === null) return;
                const deltaX = event.clientX - swipeStartX;
                if (deltaX >= SWIPE_CLOSE_THRESHOLD) {
                  closePanel();
                }
                setSwipeStartX(null);
              }}
              onPointerCancel={() => setSwipeStartX(null)}
            >
              {/* Title-bar overlay: keeps the window draggable along the top strip */}
              <div
                data-tauri-drag-region
                className="absolute inset-x-0 top-0 h-7"
                aria-hidden
              />

              {/* Tab strip */}
              <nav
                aria-label="Right panel sections"
                className="flex shrink-0 items-center gap-1 px-1"
              >
                {PANEL_TABS.map((tab) => {
                  const isActive = tab.id === activeTab?.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTabId(tab.id)}
                      aria-label={tab.label}
                      aria-pressed={isActive}
                      title={tab.label}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-base transition-colors ${
                        isActive
                          ? sidebarTokens.navItemActive
                          : sidebarTokens.utilityButton
                      }`}
                    >
                      {tab.icon}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={closePanel}
                  aria-label="Close right panel"
                  title="Close right panel"
                  className={`ml-auto flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${sidebarTokens.utilityButton}`}
                >
                  <IoChevronForward className="text-base" />
                </button>
              </nav>
              <div
                className={`my-2 mx-1 shrink-0 border-t ${sidebarTokens.divider}`}
              />

              {/* Body — the active tab's content */}
              <section className="flex min-h-0 flex-1 flex-col overflow-y-auto px-1">
                {activeTab ? <activeTab.Component /> : null}
              </section>

              {layoutMode === "docked" ? (
                <div
                  aria-label="Resize right panel"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    setIsResizing(true);
                  }}
                  className="absolute left-0 top-0 h-full w-3 -translate-x-1/2 cursor-w-resize bg-transparent"
                />
              ) : null}
            </motion.aside>
          ) : (
            <motion.div
              key="right-panel-edge-swipe-zone"
              className="flex h-full items-center justify-end"
              initial={{ x: 12 }}
              animate={{ x: 0 }}
              exit={{ x: 12 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              style={{ width: EDGE_SWIPE_ZONE_WIDTH }}
              onPointerDown={(event) => {
                setEdgeSwipeStartX(event.clientX);
              }}
              onPointerMove={(event) => {
                if (edgeSwipeStartX === null) return;
                const deltaX = edgeSwipeStartX - event.clientX;
                if (deltaX >= EDGE_SWIPE_OPEN_THRESHOLD) {
                  openPanel();
                  setEdgeSwipeStartX(null);
                }
              }}
              onPointerUp={(event) => {
                if (edgeSwipeStartX === null) return;
                const deltaX = edgeSwipeStartX - event.clientX;
                if (
                  deltaX >= EDGE_SWIPE_OPEN_THRESHOLD ||
                  Math.abs(deltaX) < 8
                ) {
                  openPanel();
                }
                setEdgeSwipeStartX(null);
              }}
              onPointerCancel={() => setEdgeSwipeStartX(null)}
            >
              <button
                type="button"
                onClick={openPanel}
                className="mr-1 inline-flex h-14 w-5 items-center justify-center rounded-l-full border border-line bg-surface text-muted shadow-sm backdrop-blur transition-colors hover:bg-sunken hover:text-ink"
                aria-label="Open right panel"
                title="Open right panel"
              >
                <IoChevronBack className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default RightPanel;

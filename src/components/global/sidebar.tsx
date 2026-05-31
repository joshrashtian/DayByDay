import { useEffect, useMemo, useState } from "react";
import {
  IoApps,
  IoCalendarOutline,
  IoChevronForward,
  IoGrid,
  IoHelpCircleOutline,
  IoHomeOutline,
  IoHourglassOutline,
  IoListOutline,
  IoPersonOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import { NavLink } from "react-router-dom";
import { AnimatePresence, Reorder, motion } from "motion/react";
import spotifyIcon from "../../assets/spotifysvg.svg";
import { TOOLKIT_PANELS } from "../../lib/toolkitPanels";
import { useSettingsStore } from "../../stores/settingsStore";
import type { SidebarMode } from "../../stores/settingsStore";
import {
  SidebarNavItemView,
  type SidebarNavItem,
} from "./sidebar/SidebarNavItem";
import { SidebarModeToggle } from "./sidebar/SidebarModeToggle";
import { SidebarInlineTaskList } from "./sidebar/SidebarInlineTaskList";

const taskDefaultNavItems: SidebarNavItem[] = [
  { label: "Home", icon: <IoHomeOutline />, link: "/" },
  { label: "Tasks", icon: <IoListOutline />, link: "/tasks" },
  { label: "Calendar", icon: <IoCalendarOutline />, link: "/calendar" },
  { label: "Blocks", icon: <IoGrid />, link: "/blocks" },
  { label: "Pomodoro", icon: <IoHourglassOutline />, link: "/pomodoro" },
];

const socialDefaultNavItems: SidebarNavItem[] = [];

const buildPinnedPanelNavItems = (panelIds: string[]): SidebarNavItem[] => {
  const panelById = new Map(TOOLKIT_PANELS.map((panel) => [panel.id, panel]));
  return panelIds
    .map((panelId) => panelById.get(panelId))
    .filter((panel): panel is (typeof TOOLKIT_PANELS)[number] => Boolean(panel))
    .map((panel) => ({
      label: panel.label,
      icon:
        panel.id === "spotify" ? (
          <img src={spotifyIcon} alt="" className="h-5 w-5" aria-hidden />
        ) : (
          <IoGrid />
        ),
      link: panel.route,
    }));
};

const SNAP_WIDTHS = [220, 260] as const;
const DEFAULT_SIDEBAR_WIDTH = SNAP_WIDTHS[0];
const LABEL_REVEAL_WIDTH = 180;
const MIN_EXPANDED_WIDTH = SNAP_WIDTHS[0] - 16;
const MAX_EXPANDED_WIDTH = SNAP_WIDTHS[1] + 16;
const SWIPE_CLOSE_THRESHOLD = 56;
const EDGE_SWIPE_OPEN_THRESHOLD = 48;
const EDGE_SWIPE_ZONE_WIDTH = 28;

type SideBarProps = {
  onWidthChange?: (width: number) => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
};

const clampExpandedWidth = (value: number) =>
  Math.min(MAX_EXPANDED_WIDTH, Math.max(MIN_EXPANDED_WIDTH, value));

const getNearestSnapWidth = (value: number) =>
  SNAP_WIDTHS.reduce((closest, width) =>
    Math.abs(width - value) < Math.abs(closest - value) ? width : closest,
  );

const restoreOrderedItems = (
  defaults: SidebarNavItem[],
  orderedLinks?: string[],
): SidebarNavItem[] => {
  if (!Array.isArray(orderedLinks) || orderedLinks.length === 0) {
    return defaults;
  }
  const map = new Map(defaults.map((item) => [item.link, item] as const));
  const restored = orderedLinks
    .map((link) => map.get(link))
    .filter((item): item is SidebarNavItem => Boolean(item));
  const missing = defaults.filter((item) => !orderedLinks.includes(item.link));
  return restored.length > 0 ? [...restored, ...missing] : defaults;
};

const SideBar = ({
  onWidthChange,
  onOpenProfile,
  onOpenSettings,
}: SideBarProps) => {
  const pinnedPanelIds = useSettingsStore((s) => s.pinnedToolkitPanels);
  const sidebarState = useSettingsStore((s) => s.sidebar);
  const setSidebarState = useSettingsStore((s) => s.setSidebar);

  const appDefaultNavItems = useMemo(
    () => [
      { label: "Toolbox", icon: <IoApps />, link: "/toolkit" },
      ...buildPinnedPanelNavItems(pinnedPanelIds),
    ],
    [pinnedPanelIds],
  );
  const [sidebarOpen, setSidebarOpen] = useState(sidebarState.open);
  const [sidebarWidth, setSidebarWidth] = useState<number>(
    getNearestSnapWidth(sidebarState.width || DEFAULT_SIDEBAR_WIDTH),
  );
  const [previewWidth, setPreviewWidth] = useState<number | null>(null);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(
    sidebarState.mode,
  );
  const [taskItems, setTaskItems] = useState<SidebarNavItem[]>(() =>
    restoreOrderedItems(taskDefaultNavItems, sidebarState.taskOrder),
  );
  const [socialItems, setSocialItems] = useState<SidebarNavItem[]>(() =>
    restoreOrderedItems(socialDefaultNavItems, sidebarState.socialOrder),
  );
  const [appItems, setAppItems] = useState<SidebarNavItem[]>(() =>
    restoreOrderedItems(appDefaultNavItems, sidebarState.appOrder),
  );
  const [isResizing, setIsResizing] = useState(false);
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [edgeSwipeStartX, setEdgeSwipeStartX] = useState<number | null>(null);

  useEffect(() => {
    setAppItems((previous) =>
      restoreOrderedItems(
        appDefaultNavItems,
        previous.map((item) => item.link),
      ),
    );
  }, [appDefaultNavItems]);

  useEffect(() => {
    onWidthChange?.(sidebarOpen ? sidebarWidth : 0);
  }, [onWidthChange, sidebarOpen, sidebarWidth]);

  useEffect(() => {
    setSidebarState({
      open: sidebarOpen,
      width: sidebarWidth,
      mode: sidebarMode,
      taskOrder: taskItems.map((item) => item.link),
      socialOrder: socialItems.map((item) => item.link),
      appOrder: appItems.map((item) => item.link),
    });
  }, [
    appItems,
    sidebarMode,
    sidebarOpen,
    sidebarWidth,
    socialItems,
    taskItems,
    setSidebarState,
  ]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key !== "\\") return;
      if (!(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      setSidebarOpen((prev) => !prev);
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (event: PointerEvent) => {
      setPreviewWidth(clampExpandedWidth(event.clientX - 8));
    };

    const handlePointerUp = () => {
      if (previewWidth !== null) {
        setSidebarWidth(getNearestSnapWidth(previewWidth));
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
  }, [isResizing, previewWidth]);

  const resolvedWidth = previewWidth ?? sidebarWidth;
  const showLabel = sidebarOpen && resolvedWidth >= LABEL_REVEAL_WIDTH;
  const activeItems =
    sidebarMode === "tasks"
      ? taskItems
      : sidebarMode === "social"
        ? socialItems
        : appItems;

  return (
    <div className="fixed inset-y-0 left-0 z-50 flex items-stretch">
      <AnimatePresence initial={false} mode="wait">
        {sidebarOpen ? (
          <motion.nav
            key="sidebar-nav"
            aria-label="Primary navigation"
            className="relative flex h-full flex-col overflow-hidden border-r border-zinc-200/70 bg-white/85 px-3 py-3 shadow-lg backdrop-blur-sm"
            style={{ width: resolvedWidth }}
            initial={{ x: -24 }}
            animate={{ x: 0 }}
            exit={{ x: -24 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            onPointerDown={(event) => {
              if (isResizing) return;
              setSwipeStartX(event.clientX);
            }}
            onPointerMove={(event) => {
              if (swipeStartX === null) return;
              const deltaX = event.clientX - swipeStartX;
              if (deltaX <= -SWIPE_CLOSE_THRESHOLD) {
                setSidebarOpen(false);
                setSwipeStartX(null);
              }
            }}
            onPointerUp={(event) => {
              if (swipeStartX === null) return;
              const deltaX = event.clientX - swipeStartX;
              if (deltaX <= -SWIPE_CLOSE_THRESHOLD) {
                setSidebarOpen(false);
              }
              setSwipeStartX(null);
            }}
            onPointerCancel={() => setSwipeStartX(null)}
          >
            {/* Nav items — compact, non-scrolling */}
            <div className="flex shrink-0 flex-col gap-2">
              <SidebarModeToggle
                showLabel={showLabel}
                sidebarMode={sidebarMode}
                setSidebarMode={setSidebarMode}
              />
              <Reorder.Group
                axis="y"
                className="flex flex-col gap-0.5"
                values={activeItems}
                onReorder={
                  sidebarMode === "tasks"
                    ? setTaskItems
                    : sidebarMode === "social"
                      ? setSocialItems
                      : setAppItems
                }
              >
                {activeItems.map((item) => (
                  <Reorder.Item
                    key={`${sidebarMode}-${item.link}`}
                    value={item}
                    className="list-none"
                  >
                    <SidebarNavItemView
                      item={item}
                      showLabel={showLabel}
                      sidebarOpen={sidebarOpen}
                      onOpenProfile={onOpenProfile}
                      onOpenSettings={onOpenSettings}
                    />
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>

            {/* Divider */}
            {sidebarMode === "tasks" && (
              <div className="my-0.5 mx-1 shrink-0 border-t border-zinc-200/70" />
            )}

            {/* Inline task list — fills remaining space */}
            {sidebarMode === "tasks" ? (
              <SidebarInlineTaskList showLabel={showLabel} />
            ) : (
              <div className="flex-1" />
            )}

            {/* Utility icon bar */}
            <div className="flex shrink-0 items-center justify-around border-t border-zinc-200/70 pt-2">
              <button
                type="button"
                onClick={onOpenProfile}
                aria-label="Profile"
                title="Profile"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              >
                <IoPersonOutline className="text-base" />
              </button>
              <button
                type="button"
                onClick={onOpenSettings}
                aria-label="Settings"
                title="Settings"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              >
                <IoSettingsOutline className="text-base" />
              </button>
              <NavLink
                to="/help"
                aria-label="Help"
                title="Help"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              >
                <IoHelpCircleOutline className="text-base" />
              </NavLink>
            </div>
            <div
              aria-label="Resize sidebar"
              onPointerDown={(event) => {
                event.preventDefault();
                setIsResizing(true);
              }}
              className="absolute right-0 top-0 h-full w-3 translate-x-1/2 cursor-e-resize bg-transparent"
            />
          </motion.nav>
        ) : (
          <motion.div
            key="sidebar-edge-swipe-zone"
            className="flex h-full items-center"
            initial={{ x: -12 }}
            animate={{ x: 0 }}
            exit={{ x: -12 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ width: EDGE_SWIPE_ZONE_WIDTH }}
            onPointerDown={(event) => {
              setEdgeSwipeStartX(event.clientX);
            }}
            onPointerMove={(event) => {
              if (edgeSwipeStartX === null) return;
              const deltaX = event.clientX - edgeSwipeStartX;
              if (deltaX >= EDGE_SWIPE_OPEN_THRESHOLD) {
                setSidebarOpen(true);
                setEdgeSwipeStartX(null);
              }
            }}
            onPointerUp={(event) => {
              if (edgeSwipeStartX === null) return;
              const deltaX = event.clientX - edgeSwipeStartX;
              if (deltaX >= EDGE_SWIPE_OPEN_THRESHOLD || Math.abs(deltaX) < 8) {
                setSidebarOpen(true);
              }
              setEdgeSwipeStartX(null);
            }}
            onPointerCancel={() => setEdgeSwipeStartX(null)}
          >
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="ml-1 inline-flex h-14 w-5 items-center justify-center rounded-r-full border border-zinc-300/80 bg-white/90 text-zinc-500 shadow-sm backdrop-blur transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              aria-label="Open sidebar"
              title="Open sidebar"
            >
              <IoChevronForward className="h-3.5 w-3.5" />
            </button>
            <span className="sr-only">
              Swipe right from the left edge to open sidebar
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SideBar;

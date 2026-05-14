import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  IoApps,
  IoCalendarOutline,
  IoChevronForward,
  IoGrid,
  IoHelpCircleOutline,
  IoHomeOutline,
  IoListOutline,
  IoPeople,
  IoPersonOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import { AnimatePresence, Reorder, motion } from "motion/react";
import spotifyIcon from "../../assets/spotifysvg.svg";
import {
  TOOLKIT_PANELS,
  TOOLKIT_PINNED_UPDATED_EVENT,
  loadPinnedToolkitPanels,
} from "../../lib/toolkitPanels";

type SidebarNavItem = {
  label: string;
  icon: React.ReactNode;
  link: string;
};

type SidebarMode = "tasks" | "social" | "apps";

const taskDefaultNavItems: SidebarNavItem[] = [
  { label: "Home", icon: <IoHomeOutline />, link: "/" },
  { label: "Tasks", icon: <IoListOutline />, link: "/tasks" },
  { label: "Calendar", icon: <IoCalendarOutline />, link: "/calendar" },
  { label: "Blocks", icon: <IoGrid />, link: "/blocks" },
];

const socialDefaultNavItems: SidebarNavItem[] = [
  // Reserved for dedicated social features.
];

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

const utilityNavItems: SidebarNavItem[] = [
  { label: "Profile", icon: <IoPersonOutline />, link: "/profile" },
  { label: "Settings", icon: <IoSettingsOutline />, link: "/settings" },
  { label: "Help", icon: <IoHelpCircleOutline />, link: "/help" },
];

const SNAP_WIDTHS = [220, 260] as const;
const DEFAULT_SIDEBAR_WIDTH = SNAP_WIDTHS[0];
const LABEL_REVEAL_WIDTH = 180;
const MIN_EXPANDED_WIDTH = SNAP_WIDTHS[0] - 16;
const MAX_EXPANDED_WIDTH = SNAP_WIDTHS[1] + 16;
const SIDEBAR_STATE_KEY = "dbd-sidebar-state-v2";
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

const getNextSidebarMode = (current: SidebarMode): SidebarMode => {
  if (current === "tasks") return "social";
  if (current === "social") return "apps";
  return "tasks";
};

const SideBar = ({
  onWidthChange,
  onOpenProfile,
  onOpenSettings,
}: SideBarProps) => {
  const location = useLocation();
  const [pinnedPanelIds, setPinnedPanelIds] = useState<string[]>(() =>
    loadPinnedToolkitPanels(),
  );
  const appDefaultNavItems = useMemo(
    () => [
      { label: "Toolbox", icon: <IoApps />, link: "/toolkit" },
      ...buildPinnedPanelNavItems(pinnedPanelIds),
    ],
    [pinnedPanelIds],
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState<number>(
    DEFAULT_SIDEBAR_WIDTH,
  );
  const [previewWidth, setPreviewWidth] = useState<number | null>(null);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("tasks");
  const [taskItems, setTaskItems] =
    useState<SidebarNavItem[]>(taskDefaultNavItems);
  const [socialItems, setSocialItems] = useState<SidebarNavItem[]>(
    socialDefaultNavItems,
  );
  const [appItems, setAppItems] = useState<SidebarNavItem[]>(appDefaultNavItems);
  const [isResizing, setIsResizing] = useState(false);
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [edgeSwipeStartX, setEdgeSwipeStartX] = useState<number | null>(null);

  useEffect(() => {
    const syncPinnedPanels = () => setPinnedPanelIds(loadPinnedToolkitPanels());
    window.addEventListener(TOOLKIT_PINNED_UPDATED_EVENT, syncPinnedPanels);
    return () =>
      window.removeEventListener(TOOLKIT_PINNED_UPDATED_EVENT, syncPinnedPanels);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_STATE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        open?: boolean;
        width?: number;
        mode?: SidebarMode;
        taskOrder?: string[];
        socialOrder?: string[];
        appOrder?: string[];
      };

      if (typeof parsed.open === "boolean") {
        setSidebarOpen(parsed.open);
      }

      if (typeof parsed.width === "number") {
        setSidebarWidth(getNearestSnapWidth(parsed.width));
      }

      if (
        parsed.mode === "tasks" ||
        parsed.mode === "social" ||
        parsed.mode === "apps"
      ) {
        setSidebarMode(parsed.mode);
      }

      setTaskItems(restoreOrderedItems(taskDefaultNavItems, parsed.taskOrder));
      setSocialItems(
        restoreOrderedItems(socialDefaultNavItems, parsed.socialOrder),
      );
      setAppItems(restoreOrderedItems(appDefaultNavItems, parsed.appOrder));
    } catch {
      // Ignore invalid local storage payloads.
    }
  }, []);

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
    const statePayload = {
      open: sidebarOpen,
      width: sidebarWidth,
      mode: sidebarMode,
      taskOrder: taskItems.map((item) => item.link),
      socialOrder: socialItems.map((item) => item.link),
      appOrder: appItems.map((item) => item.link),
    };
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(statePayload));
  }, [
    appItems,
    sidebarMode,
    sidebarOpen,
    sidebarWidth,
    socialItems,
    taskItems,
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
  const sidebarModeIndex =
    sidebarMode === "tasks" ? 0 : sidebarMode === "social" ? 1 : 2;
  const activeItems =
    sidebarMode === "tasks"
      ? taskItems
      : sidebarMode === "social"
        ? socialItems
        : appItems;

  const renderNavItem = (item: SidebarNavItem) => {
    if (item.link === "/profile") {
      return (
        <button
          type="button"
          onClick={onOpenProfile}
          draggable={false}
          aria-label={item.label}
          title={!sidebarOpen ? item.label : undefined}
          className="group relative flex h-12 w-full items-center rounded-xl px-2 text-base text-zinc-600 transition-all duration-150 ease-out hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <span
            className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r opacity-0 transition-opacity duration-150"
            aria-hidden
          />
          <span className="flex h-9 w-9 items-center justify-center text-xl transition-transform duration-150 group-hover:translate-x-px">
            {item.icon}
          </span>
          <span
            className={`overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-150 ${
              showLabel
                ? "ml-2 max-w-[160px] opacity-100"
                : "ml-0 max-w-0 opacity-0"
            }`}
          >
            {item.label}
          </span>
        </button>
      );
    }

    if (item.link === "/settings") {
      return (
        <button
          type="button"
          onClick={onOpenSettings}
          draggable={false}
          aria-label={item.label}
          title={!sidebarOpen ? item.label : undefined}
          className="group relative flex h-12 w-full items-center rounded-xl px-2 text-base text-zinc-600 transition-all duration-150 ease-out hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <span
            className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r opacity-0 transition-opacity duration-150"
            aria-hidden
          />
          <span className="flex h-9 w-9 items-center justify-center text-xl transition-transform duration-150 group-hover:translate-x-px">
            {item.icon}
          </span>
          <span
            className={`overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-150 ${
              showLabel
                ? "ml-2 max-w-[160px] opacity-100"
                : "ml-0 max-w-0 opacity-0"
            }`}
          >
            {item.label}
          </span>
        </button>
      );
    }

    const isActive =
      item.link === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.link);

    return (
      <NavLink
        to={item.link}
        draggable={false}
        aria-label={item.label}
        title={!sidebarOpen ? item.label : undefined}
        className={`group relative flex h-12 items-center rounded-xl px-2 text-base transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
          isActive
            ? "bg-blue-50 text-blue-700"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        }`}
      >
        <span
          className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r transition-opacity duration-150 ${
            isActive ? "bg-blue-600 opacity-100" : "opacity-0"
          }`}
          aria-hidden
        />
        <span className="flex h-9 w-9 items-center justify-center text-xl transition-transform duration-150 group-hover:translate-x-px">
          {item.icon}
        </span>
        <span
          className={`overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-150 ${
            showLabel
              ? "ml-2 max-w-[160px] opacity-100"
              : "ml-0 max-w-0 opacity-0"
          }`}
        >
          {item.label}
        </span>
      </NavLink>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 top-0 z-50 flex items-stretch">
      <AnimatePresence initial={false} mode="wait">
        {sidebarOpen ? (
          <motion.nav
            key="sidebar-nav"
            aria-label="Primary navigation"
            className="relative flex flex-col justify-between border-r border-zinc-200/70 bg-white/85 px-3 py-3 shadow-lg backdrop-blur-sm"
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
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl border border-zinc-200/80 bg-white/75 p-1 shadow-sm backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/70">
                {showLabel ? (
                  <div className="relative grid grid-cols-3 items-center">
                    <motion.span
                      aria-hidden
                      className={`pointer-events-none absolute inset-y-0 transition-colors left-0 w-1/3 rounded-xl border border-sky-300/60 duration-1000 bg-linear-to-r ${sidebarMode === "tasks" ? "bg-sky-400" : sidebarMode === "social" ? "bg-purple-400" : "bg-green-400"} shadow-[0_8px_22px_-12px_rgba(14,116,255,0.95)]`}
                      animate={{ x: `${sidebarModeIndex * 100}%` }}
                      transition={{
                        type: "spring",
                        stiffness: 360,
                        damping: 30,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setSidebarMode("tasks")}
                      className={`relative z-10 inline-flex h-9 items-center justify-center rounded-lg px-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                        sidebarMode === "tasks"
                          ? "text-white"
                          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                      }`}
                      aria-pressed={sidebarMode === "tasks"}
                    >
                      <IoListOutline />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSidebarMode("social")}
                      className={`relative z-10 inline-flex h-9 items-center justify-center rounded-lg px-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                        sidebarMode === "social"
                          ? "text-white"
                          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                      }`}
                      aria-pressed={sidebarMode === "social"}
                    >
                      <IoPeople />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSidebarMode("apps")}
                      className={`relative z-10 inline-flex h-9 items-center justify-center rounded-lg px-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                        sidebarMode === "apps"
                          ? "text-white"
                          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                      }`}
                      aria-pressed={sidebarMode === "apps"}
                    >
                      <IoApps />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setSidebarMode((prev) => getNextSidebarMode(prev))
                    }
                    className="inline-flex h-9 w-full items-center justify-center rounded-lg text-base text-zinc-600 transition-colors hover:bg-white/70 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    aria-label="Toggle navigation mode"
                    title="Toggle navigation mode"
                  >
                    {sidebarMode === "tasks" ? <IoListOutline /> : null}
                    {sidebarMode === "social" ? <IoPeople /> : null}
                    {sidebarMode === "apps" ? <IoApps /> : null}
                  </button>
                )}
              </div>
              <Reorder.Group
                axis="y"
                className="flex flex-col gap-1"
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
                    {renderNavItem(item)}
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>

            <div className="flex flex-col gap-1">
              {utilityNavItems.map((item) => (
                <div key={item.link}>{renderNavItem(item)}</div>
              ))}
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

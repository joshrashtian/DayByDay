import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  IoAdd,
  IoHomeOutline,
  IoListOutline,
  IoSettingsOutline,
  IoCalendarOutline,
  IoHelpCircleOutline,
  IoGrid,
  IoTodayOutline,
  IoMenu,
  IoClose,
} from "react-icons/io5";
import { AnimatePresence, Reorder, motion } from "motion/react";

type SidebarNavItem = {
  label: string;
  icon: React.ReactNode;
  link: string;
};

const primaryDefaultNavItems: SidebarNavItem[] = [
  { label: "Home", icon: <IoHomeOutline />, link: "/" },
  { label: "Tasks", icon: <IoListOutline />, link: "/tasks" },
  { label: "Calendar", icon: <IoCalendarOutline />, link: "/calendar" },
  { label: "Blocks", icon: <IoGrid />, link: "/blocks" },
];

const utilityNavItems: SidebarNavItem[] = [
  { label: "Settings", icon: <IoSettingsOutline />, link: "/settings" },
  { label: "Help", icon: <IoHelpCircleOutline />, link: "/help" },
];

const COLLAPSED_SIDEBAR_WIDTH = 72;
const SNAP_WIDTHS = [220, 260] as const;
const DEFAULT_SIDEBAR_WIDTH = SNAP_WIDTHS[0];
const LABEL_REVEAL_WIDTH = 180;
const MIN_EXPANDED_WIDTH = SNAP_WIDTHS[0] - 16;
const MAX_EXPANDED_WIDTH = SNAP_WIDTHS[1] + 16;
const SIDEBAR_STATE_KEY = "dbd-sidebar-state-v2";

type SideBarProps = {
  onWidthChange?: (width: number) => void;
};

const clampExpandedWidth = (value: number) =>
  Math.min(MAX_EXPANDED_WIDTH, Math.max(MIN_EXPANDED_WIDTH, value));

const getNearestSnapWidth = (value: number) =>
  SNAP_WIDTHS.reduce((closest, width) =>
    Math.abs(width - value) < Math.abs(closest - value) ? width : closest,
  );

const SideBar = ({ onWidthChange }: SideBarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(
    DEFAULT_SIDEBAR_WIDTH,
  );
  const [previewWidth, setPreviewWidth] = useState<number | null>(null);
  const [primaryItems, setPrimaryItems] = useState<SidebarNavItem[]>(() => [
    ...primaryDefaultNavItems,
  ]);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_STATE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as {
        open?: boolean;
        width?: number;
        primaryOrder?: string[];
      };
      if (typeof parsed.open === "boolean") {
        setSidebarOpen(parsed.open);
      }
      if (typeof parsed.width === "number") {
        setSidebarWidth(getNearestSnapWidth(parsed.width));
      }
      if (
        Array.isArray(parsed.primaryOrder) &&
        parsed.primaryOrder.length > 0
      ) {
        const map = new Map(
          primaryDefaultNavItems.map((item) => [item.link, item] as const),
        );
        const restoredItems = parsed.primaryOrder
          .map((link) => map.get(link))
          .filter((item): item is SidebarNavItem => Boolean(item));
        const missingItems = primaryDefaultNavItems.filter(
          (item) => !parsed.primaryOrder?.includes(item.link),
        );
        if (restoredItems.length > 0) {
          setPrimaryItems([...restoredItems, ...missingItems]);
        }
      }
    } catch {
      // Ignore invalid local storage payloads.
    }
  }, []);

  useEffect(() => {
    onWidthChange?.(sidebarOpen ? sidebarWidth : COLLAPSED_SIDEBAR_WIDTH);
  }, [onWidthChange, sidebarOpen, sidebarWidth]);

  useEffect(() => {
    const statePayload = {
      open: sidebarOpen,
      width: sidebarWidth,
      primaryOrder: primaryItems.map((item) => item.link),
    };
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(statePayload));
  }, [primaryItems, sidebarOpen, sidebarWidth]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key !== "\\") {
        return;
      }
      if (!(event.metaKey || event.ctrlKey)) {
        return;
      }
      event.preventDefault();
      setSidebarOpen((prev) => !prev);
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

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

  const todayLink = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return `/calendar?date=${today}`;
  }, []);

  const renderNavItem = (item: SidebarNavItem) => {
    const isActive =
      item.link === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.link);
    const showLabel = sidebarOpen && resolvedWidth >= LABEL_REVEAL_WIDTH;

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
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2"></div>

              <Reorder.Group
                axis="y"
                className="flex flex-col gap-1"
                values={primaryItems}
                onReorder={setPrimaryItems}
              >
                {primaryItems.map((item) => (
                  <Reorder.Item
                    key={item.label}
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
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                title="Collapse sidebar (Cmd/Ctrl+\\)"
                className="mt-1 flex h-12 items-center rounded-xl px-2 text-zinc-600 transition-all duration-150 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <div className="flex h-9 w-9 items-center justify-center text-xl">
                  <IoClose className="h-5 w-5" />
                </div>
                <span
                  className={`overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-150 ${
                    resolvedWidth >= LABEL_REVEAL_WIDTH
                      ? "ml-2 max-w-[160px] opacity-100"
                      : "ml-0 max-w-0 opacity-0"
                  }`}
                >
                  Collapse
                </span>
              </button>
            </div>
            <div
              aria-label="Resize sidebar"
              onPointerDown={(event) => {
                event.preventDefault();
                setIsResizing(true);
              }}
              className="absolute right-0 top-0 
               h-full w-3 translate-x-1/2 cursor-e-resize  bg-transparent"
            />
          </motion.nav>
        ) : (
          <motion.div
            key="sidebar-menu"
            className="flex items-start pt-6"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="mt-4 ml-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200/80 bg-white/80 text-zinc-600 shadow-sm backdrop-blur transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              aria-label="Open sidebar navigation"
              title="Open sidebar (Cmd/Ctrl+\\)"
            >
              <IoMenu className="h-6 w-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SideBar;

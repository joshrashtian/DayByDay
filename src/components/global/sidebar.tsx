import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  IoHomeOutline,
  IoListOutline,
  IoSettingsOutline,
  IoCalendarOutline,
  IoHelpCircleOutline,
  IoGrid,
  IoChevronBack,
  IoMenu,
} from "react-icons/io5";
import { AnimatePresence, motion, Reorder, useSpring } from "motion/react";

type SidebarNavItem = {
  label: string;
  icon: React.ReactNode;
  link: string;
};

const defaultNavItems: SidebarNavItem[] = [
  { label: "Home", icon: <IoHomeOutline />, link: "/" },
  { label: "Tasks", icon: <IoListOutline />, link: "/tasks" },
  { label: "Calendar", icon: <IoCalendarOutline />, link: "/calendar" },
  { label: "Settings", icon: <IoSettingsOutline />, link: "/settings" },
  { label: "Blocks", icon: <IoGrid />, link: "/blocks" },
  { label: "Help", icon: <IoHelpCircleOutline />, link: "/help" },
];

const MIN_SIDEBAR_WIDTH = 64;
const MAX_SIDEBAR_WIDTH = 260;
const DEFAULT_SIDEBAR_WIDTH = 190;
const LABEL_REVEAL_WIDTH = 140;

type SideBarProps = {
  onWidthChange?: (width: number) => void;
};

const clampWidth = (value: number) =>
  Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, value));

const MagneticIcon = ({ icon }: { icon: React.ReactNode }) => {
  const x = useSpring(0, { stiffness: 280, damping: 22, mass: 0.3 });
  const y = useSpring(0, { stiffness: 280, damping: 22, mass: 0.3 });

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    const radius = 90;

    if (distance > radius) {
      x.set(0);
      y.set(0);
      return;
    }

    const normalized = (radius - distance) / radius;
    x.set((dx / radius) * 8 * normalized);
    y.set((dy / radius) * 8 * normalized);
  };

  const resetPosition = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div
      onMouseMove={handleMove}
      onMouseLeave={resetPosition}
      className="flex h-10 w-10 items-center justify-center"
    >
      <motion.div style={{ x, y }}>{icon}</motion.div>
    </div>
  );
};

const SideBar = ({ onWidthChange }: SideBarProps) => {
  const location = useLocation();
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [items, setItems] = useState<SidebarNavItem[]>(() => [
    ...defaultNavItems,
  ]);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    onWidthChange?.(bottomSheetOpen ? sidebarWidth : MIN_SIDEBAR_WIDTH);
  }, [bottomSheetOpen, onWidthChange, sidebarWidth]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      setSidebarWidth(clampWidth(event.clientX - 8));
    };

    const handlePointerUp = () => setIsResizing(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isResizing]);

  return (
    <div className="fixed bottom-0 left-2 top-0 z-50 flex items-stretch">
      <AnimatePresence mode="wait">
        {bottomSheetOpen ? (
          <motion.nav
            key="sidebar-nav"
            aria-label="Primary navigation"
            className="relative my-6 flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white shadow-lg backdrop-blur-sm"
            style={{ width: sidebarWidth }}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="flex flex-col items-stretch justify-center px-1 pt-2">
              <Reorder.Group
                axis="y"
                className="flex flex-col gap-1"
                values={items}
                onReorder={setItems}
              >
                {items.map((item) => {
                  const isActive =
                    item.link === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(item.link);

                  return (
                    <Reorder.Item
                      key={item.label}
                      value={item}
                      className="list-none"
                    >
                      <NavLink
                        to={item.link}
                        draggable={false}
                        aria-label={item.label}
                        className={`flex h-14 items-center rounded-xl px-2 text-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                          isActive
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-600 hover:bg-zinc-100 hover:text-gray-900"
                        }`}
                      >
                        <MagneticIcon icon={item.icon} />
                        <span
                          className={`overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-200 ${
                            sidebarWidth >= LABEL_REVEAL_WIDTH
                              ? "ml-2 max-w-[120px] opacity-100"
                              : "ml-0 max-w-0 opacity-0"
                          }`}
                        >
                          {item.label}
                        </span>
                      </NavLink>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
            </div>
            <div className="flex flex-col items-stretch justify-center px-2 pb-2">
              <button
                onClick={() => setBottomSheetOpen(false)}
                type="button"
                className="flex h-14 items-center rounded-xl px-2 text-2xl text-gray-600 transition-all duration-200 hover:bg-zinc-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <div className="flex h-10 w-10 items-center justify-center">
                  <IoChevronBack className="h-6 w-6" />
                </div>
                <span
                  className={`overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-200 ${
                    sidebarWidth >= LABEL_REVEAL_WIDTH
                      ? "ml-2 max-w-[120px] opacity-100"
                      : "ml-0 max-w-0 opacity-0"
                  }`}
                >
                  Collapse
                </span>
              </button>
            </div>
            <button
              type="button"
              aria-label="Resize sidebar"
              onPointerDown={(event) => {
                event.preventDefault();
                setIsResizing(true);
              }}
              className="absolute right-0 top-0 h-full w-3 translate-x-1/2 cursor-ew-resize rounded-r-xl bg-transparent"
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
              onClick={() => setBottomSheetOpen(true)}
              className="rounded-xl p-2 text-gray-600 transition-colors hover:bg-zinc-100 hover:text-gray-900 dark:hover:bg-zinc-800"
              aria-label="Open navigation"
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

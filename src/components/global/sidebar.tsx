import { useState } from "react";
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
import { AnimatePresence, motion, Reorder } from "motion/react";

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

const SideBar = () => {
  const location = useLocation();
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [items, setItems] = useState<SidebarNavItem[]>(() => [
    ...defaultNavItems,
  ]);

  return (
    <div className="fixed bottom-0 left-2 top-0 z-50 flex items-stretch">
      <AnimatePresence mode="wait">
        {bottomSheetOpen ? (
          <motion.nav
            key="sidebar-nav"
            aria-label="Primary navigation"
            className="my-6 flex w-16 flex-col items-center justify-between rounded-2xl border border-zinc-200/80 bg-white shadow-lg backdrop-blur-sm"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="flex flex-col items-center justify-center">
              <Reorder.Group
                axis="y"
                className="flex flex-col"
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
                        className={`flex h-16 w-16 items-center justify-center text-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                          isActive
                            ? "text-blue-600"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {item.icon}
                      </NavLink>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
            </div>
            <div className="flex flex-col  items-center justify-center">
              <button
                onClick={() => setBottomSheetOpen(false)}
                type="button"
                className="flex h-16 w-16 items-center justify-center text-2xl text-gray-600 transition-all duration-200 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <IoChevronBack className="h-6 w-6" />
              </button>
            </div>
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

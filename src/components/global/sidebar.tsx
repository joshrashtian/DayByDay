import { useState } from "react";
import { Link } from "react-router-dom";
import {
  IoHomeOutline,
  IoListOutline,
  IoSettingsOutline,
  IoCalendarOutline,
  IoHelpCircleOutline,
  IoGrid,
} from "react-icons/io5";
import BottomSheet from "../../ui/BottomSheet";
import { Reorder } from "motion/react";

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
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [items, setItems] = useState<SidebarNavItem[]>(() => [...defaultNavItems]);

  const handleClick = (item: string) => {
    setActiveItem(item);
  };

  return (
    <div className="fixed inset-y-0 left-0 z-40 w-16 group  transition-all duration-200 *: h-full bg-white shadow-lg">
      <Reorder.Group
        axis="y"
        className="flex flex-col"
        values={items}
        onReorder={setItems}
      >
        {items.map((item) => (
          <Reorder.Item key={item.label} value={item} className="list-none">
            <Link to={item.link} draggable={false}>
              <button
                type="button"
                className={`flex items-center justify-center text-2xl h-16 w-16 transition-all duration-200 ${
                  activeItem === item.label ? "text-blue-500" : "text-gray-500"
                }`}
                onClick={() => handleClick(item.label)}
              >
                {item.icon}
              </button>
            </Link>
          </Reorder.Item>
        ))}
      </Reorder.Group>
      <button
        onClick={() => setBottomSheetOpen(true)}
        type="button"
        className="flex items-center justify-center text-2xl h-16 w-16 transition-all duration-200"
      >
        <IoHelpCircleOutline />
      </button>
      <BottomSheet
        open={bottomSheetOpen}
        onClose={() => setBottomSheetOpen(false)}
        title="Help"
      >
        <p>Hello to All of you!</p>
      </BottomSheet>
    </div>
  );
};

export default SideBar;

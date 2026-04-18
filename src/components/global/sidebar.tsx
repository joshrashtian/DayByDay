import { useMemo, useState } from "react";
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

const SideBar = () => {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const handleClick = (item: string) => {
    setActiveItem(item);
  };

  const items = useMemo(
    () => [
      {
        label: "Home",
        icon: <IoHomeOutline />,
        link: "/",
      },
      {
        label: "Tasks",
        icon: <IoListOutline />,
        link: "/tasks",
      },
      {
        label: "Calendar",
        icon: <IoCalendarOutline />,
        link: "/calendar",
      },
      {
        label: "Settings",
        icon: <IoSettingsOutline />,
        link: "/settings",
      },
      {
        label: "Blocks",
        icon: <IoGrid />,
        link: "/blocks",
      },
      {
        label: "Help",
        icon: <IoHelpCircleOutline />,
        link: "/help",
      },
    ],
    [],
  );
  return (
    <div className="fixed inset-y-0 left-0 z-40 w-16 group  transition-all duration-200 *: h-full bg-white shadow-lg">
      {items.map(
        (item) => (
          <Link to={item.link} key={item.label}>
            <button
              className={`flex items-center justify-center text-2xl h-16 w-16 transition-all duration-200 ${
                activeItem === item.label ? "text-blue-500" : "text-gray-500"
              }`}
              onClick={() => handleClick(item.label)}
            >
              {item.icon}
            </button>
          </Link>
        ),
        [],
      )}
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

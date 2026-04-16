import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  IoHomeOutline,
  IoListOutline,
  IoSettingsOutline,
  IoCalendarOutline,
  IoHelpOutline,
} from "react-icons/io5";

const SideBar = () => {
  const [activeItem, setActiveItem] = useState<string | null>(null);
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
        label: "Help",
        icon: <IoHelpOutline />,
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
    </div>
  );
};

export default SideBar;

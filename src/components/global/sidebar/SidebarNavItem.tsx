import { NavLink, useLocation } from "react-router-dom";

export type SidebarNavItem = {
  label: string;
  icon: React.ReactNode;
  link: string;
};

type Props = {
  item: SidebarNavItem;
  showLabel: boolean;
  sidebarOpen: boolean;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
};

export function SidebarNavItemView({
  item,
  showLabel,
  sidebarOpen,
  onOpenProfile,
  onOpenSettings,
}: Props) {
  const location = useLocation();

  if (item.link === "/profile") {
    return (
      <button
        type="button"
        onClick={onOpenProfile}
        draggable={false}
        aria-label={item.label}
        title={!sidebarOpen ? item.label : undefined}
        className="group relative flex h-10 w-full items-center rounded-xl px-2 text-base text-zinc-500 transition-all duration-150 ease-out hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
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
        className="group relative flex h-10 w-full items-center rounded-xl px-2 text-base text-zinc-500 transition-all duration-150 ease-out hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
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
      className={`group relative flex h-10 items-center rounded-xl px-2 text-base transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 ${
        isActive
          ? "bg-cyan-50 text-cyan-700"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
      }`}
    >
      <span
        className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r transition-opacity duration-150 ${
          isActive ? "bg-cyan-500 opacity-100" : "opacity-0"
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
}

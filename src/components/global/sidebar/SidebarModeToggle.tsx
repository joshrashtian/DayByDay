import { IoApps, IoListOutline, IoPeople } from "react-icons/io5";
import { motion } from "motion/react";
import type { SidebarMode } from "../../../stores/settingsStore";

type Props = {
  showLabel: boolean;
  sidebarMode: SidebarMode;
  setSidebarMode: (mode: SidebarMode) => void;
};

const getNextSidebarMode = (current: SidebarMode): SidebarMode => {
  if (current === "tasks") return "social";
  if (current === "social") return "apps";
  return "tasks";
};

export function SidebarModeToggle({
  showLabel,
  sidebarMode,
  setSidebarMode,
}: Props) {
  const sidebarModeIndex =
    sidebarMode === "tasks" ? 0 : sidebarMode === "social" ? 1 : 2;

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white/75 p-1 shadow-sm backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/70">
      {showLabel ? (
        <div className="relative grid grid-cols-3 items-center">
          <motion.span
            aria-hidden
            className={`pointer-events-none absolute inset-y-0 transition-colors left-0 w-1/3 rounded-xl bg-zinc-500  duration-1000 bg-linear-to-r  shadow-[0_8px_22px_-12px_rgba(14,116,255,0.95)]`}
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
          onClick={() => setSidebarMode(getNextSidebarMode(sidebarMode))}
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
  );
}

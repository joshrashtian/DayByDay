import type { ComponentProps, ReactNode } from "react";
import {
  IoCheckmarkCircle,
  IoCheckmarkCircleOutline,
  IoEllipseOutline,
  IoGridOutline,
  IoListOutline,
  IoPricetagsOutline,
  IoSwapVertical,
  IoTimeOutline,
} from "react-icons/io5";
import { Tooltip, TooltipTrigger } from "../base/tooltip/tooltip";
import { sortLabel } from "../../lib/taskSort";
import type { GroupSortConfig, TaskSortConfig } from "../../lib/taskSort";
import { TASK_ICON_CLASS, type TaskViewMode } from "./taskView";
import { TasksSortMenu } from "./TasksSortMenu";

type StatusFilter = "all" | "unfinished" | "completed" | "history";

type Props = {
  viewMode: TaskViewMode;
  onViewModeChange: (mode: TaskViewMode) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  sortMenuOpen: boolean;
  onSortMenuOpenChange: (open: boolean) => void;
  taskSort: TaskSortConfig;
  onTaskSortChange: (config: TaskSortConfig) => void;
  groupSort: GroupSortConfig;
  onGroupSortChange: (config: GroupSortConfig) => void;
};

const railShellClass: Record<TaskViewMode, string> = {
  all: "bg-zinc-600",
  block: "bg-sky-600 dark:bg-sky-700",
  category: "bg-violet-600 dark:bg-violet-700",
};

const viewActiveClass: Record<TaskViewMode, string> = {
  all: "bg-white text-zinc-900 shadow-lg shadow-black/30",
  block: "bg-sky-500 text-white shadow-lg shadow-sky-500/25",
  category: "bg-violet-500 text-white shadow-lg shadow-violet-500/25",
};

const railButtonClass = (active: boolean, activeClass: string) =>
  `inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
    active
      ? activeClass
      : "bg-white/15 text-white/80 hover:bg-white/25 hover:text-white"
  }`;

function RailIconButton({
  label,
  description,
  active,
  activeClass,
  onPress,
  children,
  ...rest
}: {
  label: string;
  description: string;
  active: boolean;
  activeClass: string;
  onPress: () => void;
  children: ReactNode;
} & Omit<ComponentProps<typeof TooltipTrigger>, "onPress" | "children">) {
  return (
    <Tooltip title={label} description={description} placement="left" delay={250}>
      <TooltipTrigger
        aria-label={label}
        aria-pressed={active}
        onPress={onPress}
        className={railButtonClass(active, activeClass)}
        {...rest}
      >
        {children}
      </TooltipTrigger>
    </Tooltip>
  );
}

export function TasksSideRail({
  viewMode,
  onViewModeChange,
  statusFilter,
  onStatusFilterChange,
  sortMenuOpen,
  onSortMenuOpenChange,
  taskSort,
  onTaskSortChange,
  groupSort,
  onGroupSortChange,
}: Props) {
  const toggleStatus = (next: StatusFilter) => {
    onStatusFilterChange(statusFilter === next ? "all" : next);
  };

  const sortActive =
    sortMenuOpen ||
    taskSort.field !== "dueDate" ||
    taskSort.direction !== "asc" ||
    groupSort.field !== "default";

  return (
    <div className="fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 sm:block">
      <div className="absolute right-full top-1/2 mr-3 -translate-y-1/2">
        <TasksSortMenu
          open={sortMenuOpen}
          onClose={() => onSortMenuOpenChange(false)}
          taskSort={taskSort}
          onTaskSortChange={onTaskSortChange}
          groupSort={groupSort}
          onGroupSortChange={onGroupSortChange}
          hideSectionOrder={viewMode === "all"}
        />
      </div>

      <nav
        className={`relative flex flex-col gap-2 rounded-full p-2 shadow-xl backdrop-blur-md transition-colors duration-300 ${railShellClass[viewMode]}`}
        aria-label="Tasks sidebar controls"
      >
        <RailIconButton
          label="All tasks"
          description="Flat list with no block or category groups"
          active={viewMode === "all"}
          activeClass={viewActiveClass.all}
          onPress={() => onViewModeChange("all")}
        >
          <IoListOutline className={TASK_ICON_CLASS} aria-hidden />
        </RailIconButton>
        <RailIconButton
          label="By block"
          description="Group tasks by time block"
          active={viewMode === "block"}
          activeClass={viewActiveClass.block}
          onPress={() => onViewModeChange("block")}
        >
          <IoGridOutline className={TASK_ICON_CLASS} aria-hidden />
        </RailIconButton>
        <RailIconButton
          label="By category"
          description="Group tasks by category"
          active={viewMode === "category"}
          activeClass={viewActiveClass.category}
          onPress={() => onViewModeChange("category")}
        >
          <IoPricetagsOutline className={TASK_ICON_CLASS} aria-hidden />
        </RailIconButton>

        <div
          className="my-2 h-0.5 w-full -skew-x-12 rounded-full bg-white/30"
          aria-hidden
        />

        <RailIconButton
          label="Unfinished only"
          description={
            statusFilter === "unfinished"
              ? "Click again to show all tasks"
              : "Show only open tasks"
          }
          active={statusFilter === "unfinished"}
          activeClass="bg-amber-500 text-white shadow-lg shadow-amber-500/25"
          onPress={() => toggleStatus("unfinished")}
        >
          <IoEllipseOutline className={TASK_ICON_CLASS} aria-hidden />
        </RailIconButton>
        <RailIconButton
          label="Completed only"
          description={
            statusFilter === "completed"
              ? "Click again to show all tasks"
              : "Show only finished tasks"
          }
          active={statusFilter === "completed"}
          activeClass="bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
          onPress={() => toggleStatus("completed")}
        >
          {statusFilter === "completed" ? (
            <IoCheckmarkCircle className={TASK_ICON_CLASS} aria-hidden />
          ) : (
            <IoCheckmarkCircleOutline className={TASK_ICON_CLASS} aria-hidden />
          )}
        </RailIconButton>
        <RailIconButton
          label="History"
          description={
            statusFilter === "history"
              ? "Click again to show all tasks"
              : "Show past-due and completed tasks"
          }
          active={statusFilter === "history"}
          activeClass="bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
          onPress={() => toggleStatus("history")}
        >
          <IoTimeOutline className={TASK_ICON_CLASS} aria-hidden />
        </RailIconButton>

        <div
          className="my-2 h-0.5 w-full -skew-x-12 rounded-full bg-white/30"
          aria-hidden
        />

        <Tooltip
          title={sortMenuOpen ? "Close sort" : "Sort tasks"}
          description={
            sortMenuOpen
              ? "Hide sort options"
              : `Current: ${sortLabel(taskSort)}. Open to change.`
          }
          placement="left"
          delay={250}
        >
          <TooltipTrigger
            aria-label="Sort tasks"
            aria-pressed={sortMenuOpen}
            aria-expanded={sortMenuOpen}
            onPress={() => onSortMenuOpenChange(!sortMenuOpen)}
            className={railButtonClass(
              sortActive,
              "bg-white text-zinc-900 shadow-lg ring-2 ring-white/50",
            )}
          >
            <IoSwapVertical className={TASK_ICON_CLASS} aria-hidden />
          </TooltipTrigger>
        </Tooltip>
      </nav>
    </div>
  );
}

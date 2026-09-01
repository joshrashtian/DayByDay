import { useCallback, useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { useShallow } from "zustand/react/shallow";
import {
  isCompletedTaskFromPreviousDay,
  isTaskDueToday,
} from "../../lib/taskDates";
import { isIcsTask } from "../../lib/icsTasks";
import { collectTaskBlocks } from "../../lib/taskBlocks";
import { collectAvailableCategories } from "../../lib/taskCategories";
import { TaskCreator } from "./TaskCreator";
import { taskCreatorPopupContent } from "./taskCreatorPopupContent";
import { taskEditorPopupContent } from "./taskEditorPopupContent";
import { TaskEntriesList } from "./TaskEntriesList";
import { TasksHeader } from "./TasksHeader";
import type { TaskViewMode } from "./taskView";
import {
  buildTaskListEntries,
  countTaskListEntries,
} from "../../lib/recurringTasks";
import {
  DEFAULT_GROUP_SORT,
  DEFAULT_TASK_SORT,
  sortTaskGroups,
  type GroupSortConfig,
  type TaskSortConfig,
} from "../../lib/taskSort";
import { TasksSideRail } from "./TasksSideRail";
import { useContextMenu } from "../../providers/ContextMenuProvider";
import { usePopup } from "../../providers/PopupProvider";
import { useTasksStore } from "../../stores/tasksStore";
import type { Task } from "@/types";
import { IoAdd } from "react-icons/io5";

type Props = {
  topPadding?: "header" | "comfortable" | "none";
  contentWidth?: "narrow" | "wide";
  composerLayout?: "inline" | "bottomChat" | "none";
  initialCategoryFilter?: string;
  lockCategoryFilter?: boolean;
};

function taskMatchesSearch(task: Task, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (task.title.toLowerCase().includes(q)) return true;
  if (task.block?.toLowerCase().includes(q)) return true;
  if (task.category?.toLowerCase().includes(q)) return true;
  if (task.tags?.some((tag) => tag.toLowerCase().includes(q))) return true;
  return false;
}

function taskMatchesAnyBlock(task: Task, filters: Set<string>): boolean {
  if (filters.size === 0) return true;
  const b = task.block?.trim();
  if (!b) return false;
  const blockLower = b.toLowerCase();
  for (const filter of filters) {
    if (blockLower === filter.toLowerCase()) return true;
  }
  return false;
}

function taskMatchesAnyCategory(task: Task, filters: Set<string>): boolean {
  if (filters.size === 0) return true;
  const c = task.category?.trim();
  if (!c) return false;
  const categoryLower = c.toLowerCase();
  for (const filter of filters) {
    if (categoryLower === filter.toLowerCase()) return true;
  }
  return false;
}

function normalizedBlockName(task: Task): string | undefined {
  const value = task.block?.trim();
  return value ? value : undefined;
}

function normalizedCategoryName(task: Task): string | undefined {
  const value = task.category?.trim();
  return value ? value : undefined;
}

function isHistoricalTask(task: Task): boolean {
  if (task.dueDate) {
    const due = DateTime.fromJSDate(task.dueDate).startOf("day");
    const today = DateTime.now().startOf("day");
    return due < today;
  }
  return task.done;
}

export function TasksWorkspace({
  topPadding = "comfortable",
  contentWidth = "wide",
  composerLayout = "inline",
  initialCategoryFilter,
  lockCategoryFilter = false,
}: Props) {
  const { tasks, addTask, toggleTask, removeTask, setTaskTags, updateTask } =
    useTasksStore(
      useShallow((s) => ({
        tasks: s.tasks,
        addTask: s.addTask,
        toggleTask: s.toggleTask,
        removeTask: s.removeTask,
        setTaskTags: s.setTaskTags,
        updateTask: s.updateTask,
      })),
    );

  const { openMenu } = useContextMenu();
  const { open: openPopup, close: closePopup } = usePopup();

  const openTaskFormPopup = useCallback(() => {
    openPopup(taskCreatorPopupContent({ addTask, closePopup }));
  }, [openPopup, closePopup, addTask]);

  const openTaskEditorPopup = useCallback(
    (task: Task) => {
      openPopup(taskEditorPopupContent({ task, updateTask, removeTask, closePopup }));
    },
    [openPopup, updateTask, closePopup],
  );

  const [taskSearch, setTaskSearch] = useState("");
  const [blockFilters, setBlockFilters] = useState<Set<string>>(new Set());
  const [categoryFilters, setCategoryFilters] = useState<Set<string>>(() => {
    const trimmed = initialCategoryFilter?.trim();
    return trimmed ? new Set([trimmed]) : new Set();
  });
  const [dueTodayOnly, setDueTodayOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "unfinished" | "completed" | "history"
  >("all");
  const [viewMode, setViewMode] = useState<TaskViewMode>("all");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [taskSort, setTaskSort] = useState<TaskSortConfig>(DEFAULT_TASK_SORT);
  const [groupSort, setGroupSort] =
    useState<GroupSortConfig>(DEFAULT_GROUP_SORT);

  const userTasks = useMemo(
    () => tasks.filter((task) => !isIcsTask(task)),
    [tasks],
  );

  const blocks = useMemo(() => collectTaskBlocks(userTasks), [userTasks]);
  const categories = useMemo(
    () => collectAvailableCategories(userTasks),
    [userTasks],
  );

  useEffect(() => {
    const trimmed = initialCategoryFilter?.trim();
    if (!trimmed) return;
    setCategoryFilters(new Set([trimmed]));
    setViewMode("all");
  }, [initialCategoryFilter]);

  useEffect(() => {
    setBlockFilters((current) => {
      if (current.size === 0) return current;
      const available = new Set(blocks.map((b) => b.toLowerCase()));
      const next = new Set(
        [...current].filter((value) => available.has(value.toLowerCase())),
      );
      return next.size === current.size ? current : next;
    });
  }, [blocks]);

  useEffect(() => {
    setCategoryFilters((current) => {
      if (current.size === 0) return current;
      const available = new Set(categories.map((c) => c.toLowerCase()));
      const next = new Set(
        [...current].filter((value) => available.has(value.toLowerCase())),
      );
      return next.size === current.size ? current : next;
    });
  }, [categories]);

  const visibleTasks = useMemo(
    () =>
      userTasks.filter((t) => {
        if (statusFilter !== "history" && isCompletedTaskFromPreviousDay(t)) {
          return false;
        }
        if (statusFilter === "history" && !isHistoricalTask(t)) return false;
        if (!taskMatchesSearch(t, taskSearch)) return false;
        if (!taskMatchesAnyBlock(t, blockFilters)) return false;
        if (!taskMatchesAnyCategory(t, categoryFilters)) return false;
        if (
          statusFilter !== "history" &&
          dueTodayOnly &&
          !isTaskDueToday(t.dueDate)
        ) {
          return false;
        }
        if (statusFilter === "unfinished" && t.done) return false;
        if (statusFilter === "completed" && !t.done) return false;
        return true;
      }),
    [
      userTasks,
      taskSearch,
      blockFilters,
      categoryFilters,
      dueTodayOnly,
      statusFilter,
    ],
  );

  const flatListEntries = useMemo(
    () => buildTaskListEntries(visibleTasks, taskSort),
    [visibleTasks, taskSort],
  );

  const groupedVisibleTasks = useMemo(() => {
    if (viewMode === "all") return [];

    const knownGroups =
      viewMode === "block"
        ? collectTaskBlocks(visibleTasks)
        : collectAvailableCategories(visibleTasks);
    const groups = new Map<
      string,
      {
        label: string;
        tasks: Task[];
        entries: ReturnType<typeof buildTaskListEntries>;
      }
    >();

    for (const task of visibleTasks) {
      const groupName =
        viewMode === "block"
          ? normalizedBlockName(task)
          : normalizedCategoryName(task);
      const key = groupName ? groupName.toLowerCase() : "__unassigned__";
      const label = groupName ?? "Unassigned";
      const existing = groups.get(key);
      if (existing) {
        existing.tasks.push(task);
      } else {
        groups.set(key, { label, tasks: [task], entries: [] });
      }
    }

    for (const group of groups.values()) {
      group.entries = buildTaskListEntries(group.tasks, taskSort);
    }

    return sortTaskGroups([...groups.values()], groupSort, knownGroups);
  }, [visibleTasks, viewMode, taskSort, groupSort]);

  const topClass =
    topPadding === "header"
      ? "pt-16"
      : topPadding === "comfortable"
        ? "pt-6 sm:pt-8"
        : "pt-0";

  const maxW = contentWidth === "wide" ? "max-w-3xl xl:max-w-4xl" : "max-w-lg";
  const mainClass =
    composerLayout === "bottomChat"
      ? "min-h-0 flex-1 flex-col"
      : "min-h-full flex-col-reverse";

  return (
    <main
      className={`relative pb-40 flex w-full ${mainClass} overflow-hidden `}
    >
      <div className={`relative z-10 flex min-h-0 flex-1 flex-col ${topClass}`}>
        <TasksHeader
          taskSearch={taskSearch}
          onTaskSearchChange={setTaskSearch}
          blockFilters={blockFilters}
          onBlockFiltersChange={setBlockFilters}
          categoryFilters={categoryFilters}
          onCategoryFiltersChange={setCategoryFilters}
          dueTodayOnly={dueTodayOnly}
          onDueTodayOnlyChange={setDueTodayOnly}
          blocks={blocks}
          categories={categories}
          sortMenuOpen={sortMenuOpen}
          onSortMenuOpenChange={setSortMenuOpen}
          taskSort={taskSort}
          onTaskSortChange={setTaskSort}
          groupSort={groupSort}
          onGroupSortChange={setGroupSort}
          viewMode={viewMode}
          hideCategoryFilter={lockCategoryFilter}
        />
        <div className="min-h-0 flex flex-1 overflow-hidden">
          <div
            onContextMenu={(e) => {
              e.preventDefault();
              openMenu(e, [
                {
                  id: "add-task-popup",
                  label: "Add task (full form)…",
                  icon: <IoAdd />,
                  onSelect: openTaskFormPopup,
                },
              ]);
            }}
            className={`min-h-0 flex-1 overflow-y-scroll overflow-x-hidden overscroll-contain px-5 sm:px-8 ${composerLayout === "bottomChat" ? "pb-4 pt-2" : "pb-10"}`}
          >
            <div
              className={`mx-auto flex min-h-0 w-full min-w-0 flex-col gap-6 ${maxW}`}
            >
              {composerLayout === "inline" ? (
                <TaskCreator
                  onAdd={addTask}
                  onOpenFullForm={openTaskFormPopup}
                />
              ) : null}
              <div className="flex flex-col gap-6 pb-8">
                {viewMode === "all" ? (
                  <section
                    className="rounded-2xl border border-line/50 bg-surface/25 p-3 shadow-[0_6px_24px_rgba(15,15,15,0.05)] backdrop-blur-sm"
                    aria-label="All tasks"
                  >
                    <header className="mb-3 flex items-center justify-between px-1">
                      <h3 className="text-sm font-semibold tracking-wide text-ink">
                        All tasks
                      </h3>
                      <span className="rounded-full bg-zinc-500/15 px-2 py-0.5 text-xs font-semibold text-muted">
                        {(() => {
                          const rowCount =
                            countTaskListEntries(flatListEntries);
                          const total = visibleTasks.length;
                          return rowCount === total
                            ? `${total} ${total === 1 ? "task" : "tasks"}`
                            : `${rowCount} series · ${total} occurrences`;
                        })()}
                      </span>
                    </header>
                    {flatListEntries.length > 0 ? (
                      <TaskEntriesList
                        entries={flatListEntries}
                        onToggle={toggleTask}
                        onDelete={removeTask}
                        onEditTask={openTaskEditorPopup}
                        onSetTags={setTaskTags}
                      />
                    ) : (
                      <p className="px-1 py-6 text-center text-sm text-muted">
                        No tasks match your filters.
                      </p>
                    )}
                  </section>
                ) : (
                  groupedVisibleTasks.map((group) => (
                    <section
                      key={group.label}
                      className="rounded-2xl border border-line/50 bg-surface/25 p-3 shadow-[0_6px_24px_rgba(15,15,15,0.05)] backdrop-blur-sm"
                      aria-label={`${group.label} task container`}
                    >
                      <header className="mb-3 flex items-center justify-between px-1">
                        <h3 className="text-sm font-semibold tracking-wide text-ink">
                          {group.label}
                        </h3>
                        {(() => {
                          const rowCount = countTaskListEntries(group.entries);
                          const total = group.tasks.length;
                          return (
                            <span className="rounded-full bg-zinc-500/15 px-2 py-0.5 text-xs font-semibold text-muted">
                              {rowCount === total
                                ? `${total} ${total === 1 ? "task" : "tasks"}`
                                : `${rowCount} series · ${total} occurrences`}
                            </span>
                          );
                        })()}
                      </header>
                      <TaskEntriesList
                        entries={group.entries}
                        onToggle={toggleTask}
                        onDelete={removeTask}
                        onEditTask={openTaskEditorPopup}
                        onSetTags={setTaskTags}
                      />
                    </section>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {composerLayout === "bottomChat" ? (
          <div className="sticky bottom-0 z-20 shrink-0 border-t border-line/40 bg-linear-to-t from-canvas/95 via-canvas/90 to-transparent pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
            <div className={`mx-auto w-full px-5 sm:px-8 ${maxW}`}>
              <TaskCreator
                onAdd={addTask}
                variant="chatDock"
                onOpenFullForm={openTaskFormPopup}
              />
            </div>
          </div>
        ) : null}
      </div>
      <TasksSideRail
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortMenuOpen={sortMenuOpen}
        onSortMenuOpenChange={setSortMenuOpen}
        taskSort={taskSort}
        onTaskSortChange={setTaskSort}
        groupSort={groupSort}
        onGroupSortChange={setGroupSort}
      />
    </main>
  );
}

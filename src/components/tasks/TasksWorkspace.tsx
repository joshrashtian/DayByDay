import { useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { isTaskDueToday } from "../../lib/taskDates";
import { collectTaskBlocks } from "../../lib/taskBlocks";
import { TaskCreator } from "./TaskCreator";
import { taskCreatorPopupContent } from "./taskCreatorPopupContent";
import { TaskItem } from "./TaskItem";
import { TasksHeader } from "./TasksHeader";
import { useContextMenu } from "../../providers/ContextMenuProvider";
import { usePopup } from "../../providers/PopupProvider";
import { useTasksStore } from "../../stores/tasksStore";
import type { Task } from "../../types/task";
import {
  IoCheckmarkCircle,
  IoCheckmarkCircleOutline,
  IoGrid,
  IoList,
} from "react-icons/io5";

type Props = {
  topPadding?: "header" | "comfortable" | "none";
  contentWidth?: "narrow" | "wide";
  composerLayout?: "inline" | "bottomChat";
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

function taskMatchesBlock(task: Task, filter: "all" | string): boolean {
  if (filter === "all") return true;
  const b = task.block?.trim();
  if (!b) return false;
  return b.toLowerCase() === filter.toLowerCase();
}

function taskMatchesCategory(task: Task, filter: "all" | string): boolean {
  if (filter === "all") return true;
  const c = task.category?.trim();
  if (!c) return false;
  return c.toLowerCase() === filter.toLowerCase();
}

function normalizedBlockName(task: Task): string | undefined {
  const value = task.block?.trim();
  return value ? value : undefined;
}

function normalizedCategoryName(task: Task): string | undefined {
  const value = task.category?.trim();
  return value ? value : undefined;
}

function collectCategories(tasks: Task[]): string[] {
  const byLower = new Map<string, string>();
  for (const t of tasks) {
    const c = t.category?.trim();
    if (c && !byLower.has(c.toLowerCase())) byLower.set(c.toLowerCase(), c);
  }
  return [...byLower.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

export function TasksWorkspace({
  topPadding = "comfortable",
  contentWidth = "wide",
  composerLayout = "inline",
}: Props) {
  const { tasks, addTask, toggleTask, removeTask, setTaskTags } = useTasksStore(
    useShallow((s) => ({
      tasks: s.tasks,
      addTask: s.addTask,
      toggleTask: s.toggleTask,
      removeTask: s.removeTask,
      setTaskTags: s.setTaskTags,
    })),
  );

  const { openMenu } = useContextMenu();
  const { open: openPopup, close: closePopup } = usePopup();

  const openTaskFormPopup = useCallback(() => {
    openPopup(taskCreatorPopupContent({ addTask, closePopup }));
  }, [openPopup, closePopup, addTask]);

  const [taskSearch, setTaskSearch] = useState("");
  const [blockFilter, setBlockFilter] = useState<"all" | string>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");
  const [dueTodayOnly, setDueTodayOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "unfinished" | "completed"
  >("all");
  const [viewMode, setViewMode] = useState<"block" | "category">("block");

  const blocks = useMemo(() => collectTaskBlocks(tasks), [tasks]);
  const categories = useMemo(() => collectCategories(tasks), [tasks]);

  useEffect(() => {
    if (blockFilter === "all") return;
    const stillThere = blocks.some(
      (b) => b.toLowerCase() === blockFilter.toLowerCase(),
    );
    if (!stillThere) setBlockFilter("all");
  }, [blocks, blockFilter]);

  useEffect(() => {
    if (categoryFilter === "all") return;
    const stillThere = categories.some(
      (c) => c.toLowerCase() === categoryFilter.toLowerCase(),
    );
    if (!stillThere) setCategoryFilter("all");
  }, [categories, categoryFilter]);

  const visibleTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (!taskMatchesSearch(t, taskSearch)) return false;
        if (!taskMatchesBlock(t, blockFilter)) return false;
        if (!taskMatchesCategory(t, categoryFilter)) return false;
        if (dueTodayOnly && !isTaskDueToday(t.dueDate)) return false;
        if (statusFilter === "unfinished" && t.done) return false;
        if (statusFilter === "completed" && !t.done) return false;
        return true;
      }),
    [
      tasks,
      taskSearch,
      blockFilter,
      categoryFilter,
      dueTodayOnly,
      statusFilter,
    ],
  );

  const groupedVisibleTasks = useMemo(() => {
    const knownGroups =
      viewMode === "block"
        ? collectTaskBlocks(visibleTasks)
        : collectCategories(visibleTasks);
    const orderByLower = new Map(
      knownGroups.map((name, index) => [name.toLowerCase(), index]),
    );
    const groups = new Map<string, { label: string; tasks: Task[] }>();

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
        groups.set(key, { label, tasks: [task] });
      }
    }

    return [...groups.values()].sort((a, b) => {
      const aUnassigned = a.label === "Unassigned";
      const bUnassigned = b.label === "Unassigned";
      if (aUnassigned && !bUnassigned) return 1;
      if (!aUnassigned && bUnassigned) return -1;
      const aOrder =
        orderByLower.get(a.label.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      const bOrder =
        orderByLower.get(b.label.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
    });
  }, [visibleTasks, viewMode]);

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
      className={`relative flex w-full ${mainClass} overflow-hidden bg-linear-to-br from-zinc-100 via-zinc-50 to-sky-100/40 dark:from-zinc-950 dark:via-zinc-900 dark:to-sky-950/30`}
    >
      <div
        className="pointer-events-none absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-sky-200/35 blur-3xl dark:bg-sky-900/25"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-1/4 h-72 w-72 rounded-full bg-violet-200/30 blur-3xl dark:bg-violet-950/30"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/3 top-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-200/20 blur-3xl dark:bg-emerald-900/15"
        aria-hidden
      />

      <div className={`relative z-10 flex min-h-0 flex-1 flex-col ${topClass}`}>
        <TasksHeader
          taskSearch={taskSearch}
          onTaskSearchChange={setTaskSearch}
          blockFilter={blockFilter}
          onBlockFilterChange={setBlockFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          dueTodayOnly={dueTodayOnly}
          onDueTodayOnlyChange={setDueTodayOnly}
          blocks={blocks}
          categories={categories}
        />
        <div className="min-h-0 flex flex-1 overflow-hidden">
          <div
            onContextMenu={(e) => {
              e.preventDefault();
              openMenu(e, [
                {
                  id: "add-task-popup",
                  label: "Add task (full form)…",
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
                {groupedVisibleTasks.map((group) => (
                  <section
                    key={group.label}
                    className="rounded-2xl border border-white/50 bg-white/25 p-3 shadow-[0_6px_24px_rgba(15,15,15,0.05)] backdrop-blur-sm dark:border-white/10 dark:bg-zinc-900/20"
                    aria-label={`${group.label} task container`}
                  >
                    <header className="mb-3 flex items-center justify-between px-1">
                      <h3 className="text-sm font-semibold tracking-wide text-zinc-800 dark:text-zinc-100">
                        {group.label}
                      </h3>
                      <span className="rounded-full bg-zinc-500/15 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {group.tasks.length}{" "}
                        {group.tasks.length === 1 ? "task" : "tasks"}
                      </span>
                    </header>
                    <ul className="flex w-full flex-col gap-3">
                      {group.tasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onToggle={() => toggleTask(task.id)}
                          onDelete={() => removeTask(task.id)}
                          onSetTags={(tags) => setTaskTags(task.id, tags)}
                        />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>

        {composerLayout === "bottomChat" ? (
          <div className="sticky bottom-0 z-20 shrink-0 border-t border-white/40 bg-linear-to-t from-zinc-100/95 via-zinc-50/90 to-transparent pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md dark:border-white/10 dark:from-zinc-950/95 dark:via-zinc-900/85 dark:to-transparent">
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
      <nav
        className={`fixed right-4 duration-1000 ease-in-out transition-all top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-2 rounded-full p-2 shadow-xl backdrop-blur-md sm:flex ${
          viewMode === "block" ? "bg-blue-500" : "bg-purple-500"
        }`}
        aria-label="Tasks sidebar controls"
      >
        <button
          type="button"
          title="Block view"
          aria-label="Block view"
          aria-pressed={viewMode === "block"}
          onClick={() => setViewMode("block")}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
            viewMode === "block"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25"
              : "bg-white/70 text-zinc-700 hover:bg-white dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-900"
          }`}
        >
          <IoGrid className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          title="Category view"
          aria-label="Category view"
          aria-pressed={viewMode === "category"}
          onClick={() => setViewMode("category")}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
            viewMode === "category"
              ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25"
              : "bg-white/70 text-zinc-700 hover:bg-white dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-900"
          }`}
        >
          <IoList className="h-5 w-5" aria-hidden />
        </button>
        <div className="w-full h-0.5 my-2 bg-white/30 -skew-12 rounded-full"></div>
        <button
          type="button"
          title="Unfinished tasks"
          aria-label="Unfinished tasks"
          aria-pressed={statusFilter === "unfinished"}
          onClick={() =>
            setStatusFilter((current) =>
              current === "unfinished" ? "all" : "unfinished",
            )
          }
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
            statusFilter === "unfinished"
              ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
              : "bg-white/70 text-zinc-700 hover:bg-white dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-900"
          }`}
        >
          <IoCheckmarkCircleOutline className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          title="Completed tasks"
          aria-label="Completed tasks"
          aria-pressed={statusFilter === "completed"}
          onClick={() =>
            setStatusFilter((current) =>
              current === "completed" ? "all" : "completed",
            )
          }
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
            statusFilter === "completed"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
              : "bg-white/70 text-zinc-700 hover:bg-white dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-900"
          }`}
        >
          <IoCheckmarkCircle className="h-5 w-5" aria-hidden />
        </button>
      </nav>
    </main>
  );
}

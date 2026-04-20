import { useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { isTaskDueToday } from "../../lib/taskDates";
import { TaskCreator } from "./TaskCreator";
import { taskCreatorPopupContent } from "./taskCreatorPopupContent";
import { TaskItem } from "./TaskItem";
import { TasksHeader } from "./TasksHeader";
import { useContextMenu } from "../../providers/ContextMenuProvider";
import { usePopup } from "../../providers/PopupProvider";
import { useTasksStore } from "../../stores/tasksStore";
import type { Task } from "../../types/task";
import { IoGrid } from "react-icons/io5";

type Props = {
  topPadding?: "header" | "comfortable" | "none";
  contentWidth?: "narrow" | "wide";
  composerLayout?: "inline" | "bottomChat";
};

function taskMatchesSearch(task: Task, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (task.title.toLowerCase().includes(q)) return true;
  if (task.category?.toLowerCase().includes(q)) return true;
  if (task.tags?.some((tag) => tag.toLowerCase().includes(q))) return true;
  return false;
}

function taskMatchesCategory(task: Task, filter: "all" | string): boolean {
  if (filter === "all") return true;
  const c = task.category?.trim();
  if (!c) return false;
  return c.toLowerCase() === filter.toLowerCase();
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
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");
  const [dueTodayOnly, setDueTodayOnly] = useState(false);

  const categories = useMemo(() => collectCategories(tasks), [tasks]);

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
        if (!taskMatchesCategory(t, categoryFilter)) return false;
        if (dueTodayOnly && !isTaskDueToday(t.dueDate)) return false;
        return true;
      }),
    [tasks, taskSearch, categoryFilter, dueTodayOnly],
  );

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
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          dueTodayOnly={dueTodayOnly}
          onDueTodayOnlyChange={setDueTodayOnly}
          categories={categories}
        />
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
              <TaskCreator onAdd={addTask} onOpenFullForm={openTaskFormPopup} />
            ) : null}
            <div className="flex flex-col gap-3">
              <ul className="flex w-full flex-col gap-3 pb-8">
                {visibleTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTask(task.id)}
                    onDelete={() => removeTask(task.id)}
                    onSetTags={(tags) => setTaskTags(task.id, tags)}
                  />
                ))}
              </ul>
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
      <nav className="fixed bottom-0 right-0 z-20">
        <button className="bg-white/80 backdrop-blur-sm rounded-full p-2">
          <IoGrid />
        </button>
      </nav>
    </main>
  );
}

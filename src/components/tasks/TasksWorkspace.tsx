import { useCallback, useMemo, useState } from "react";
import { IoSearch } from "react-icons/io5";
import { useShallow } from "zustand/react/shallow";
import { TaskCreator } from "./TaskCreator";
import { TaskCreatorPopupForm } from "./TaskCreatorPopupForm";
import { TaskItem } from "./TaskItem";
import { useContextMenu } from "../../providers/ContextMenuProvider";
import { usePopup } from "../../providers/PopupProvider";
import { useTasksStore } from "../../stores/tasksStore";
import type { Task } from "../../types/task";

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
  return false;
}

export function TasksWorkspace({
  topPadding = "comfortable",
  contentWidth = "wide",
  composerLayout = "inline",
}: Props) {
  const { tasks, addTask, toggleTask, removeTask } = useTasksStore(
    useShallow((s) => ({
      tasks: s.tasks,
      addTask: s.addTask,
      toggleTask: s.toggleTask,
      removeTask: s.removeTask,
    })),
  );

  const { openMenu } = useContextMenu();
  const { open: openPopup, close: closePopup } = usePopup();

  const openTaskFormPopup = useCallback(() => {
    openPopup(
      <div className="p-5 sm:p-6">
        <TaskCreatorPopupForm
          onAdd={(payload) => {
            addTask(payload);
            closePopup();
          }}
          onAddAnother={(payload) => {
            addTask(payload);
          }}
          onDismiss={closePopup}
        />
      </div>,
    );
  }, [openPopup, closePopup, addTask]);

  const [taskSearch, setTaskSearch] = useState("");

  const visibleTasks = useMemo(
    () => tasks.filter((t) => taskMatchesSearch(t, taskSearch)),
    [tasks, taskSearch],
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

      <div
        className={`relative z-10 flex min-h-0 flex-1 ${composerLayout === "bottomChat" ? "flex-col" : "flex-col-reverse"} ${topClass}`}
      >
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
          className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-5 sm:px-8 ${composerLayout === "bottomChat" ? "pb-4 pt-2" : "pb-10"}`}
        >
          <div className={`mx-auto flex w-full flex-col gap-6 ${maxW}`}>
            {composerLayout === "inline" ? (
              <TaskCreator onAdd={addTask} onOpenFullForm={openTaskFormPopup} />
            ) : null}
            <div className="flex flex-col gap-3">
              <label className="relative block">
                <IoSearch
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                  aria-hidden
                />
                <input
                  type="search"
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  placeholder="Search tasks or category…"
                  autoComplete="off"
                  className="w-full rounded-2xl border border-white/70 bg-white/50 py-2.5 pl-10 pr-3 text-sm text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-white/30 backdrop-blur-xl placeholder:text-zinc-400 outline-none focus:border-zinc-400/80 focus:ring-2 focus:ring-zinc-400/30 dark:border-white/15 dark:bg-zinc-900/40 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/25"
                  aria-label="Search tasks by title or category"
                />
              </label>
              <ul className="flex w-full flex-col gap-3 pb-8">
                {visibleTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTask(task.id)}
                    onDelete={() => removeTask(task.id)}
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
    </main>
  );
}

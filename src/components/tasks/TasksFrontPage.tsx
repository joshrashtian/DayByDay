import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTasksStore } from "../../stores/tasksStore";
import { formatTaskDue } from "../../lib/taskDates";

const STACK_MAX = 4;

export const TasksFrontPage = () => {
  const { tasks } = useTasksStore(useShallow((s) => ({ tasks: s.tasks })));

  const stack = useMemo(
    () =>
      [...tasks]
        .sort(
          (a, b) =>
            (b.dueDate?.getTime() ?? 0) - (a.dueDate?.getTime() ?? 0),
        )
        .slice(0, STACK_MAX),
    [tasks],
  );

  const stackHeightPx = 52 + (Math.max(stack.length, 1) - 1) * 14;

  return (
    <div className="rounded-2xl border border-white/70 bg-white/45 p-6 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_12px_40px_-18px_rgba(15,23,42,0.25)] ring-1 ring-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/45 dark:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_12px_40px_-18px_rgba(0,0,0,0.5)] dark:ring-white/5">
      <div className="flex flex-col items-start gap-1">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Tasks
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          You have {tasks.length} task{tasks.length === 1 ? "" : "s"}
        </p>
      </div>

      <div
        className="relative mx-auto mt-6 w-full max-w-sm"
        style={{ height: stackHeightPx }}
        role="list"
        aria-label="Upcoming tasks preview"
      >
        {stack.length === 0 ? (
          <div
            className="absolute left-1/2 top-0 w-[94%] -translate-x-1/2 rounded-xl border border-dashed border-zinc-300/80 bg-zinc-50/80 px-4 py-4 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400"
            role="listitem"
          >
            No tasks yet — add one from Tasks.
          </div>
        ) : (
          stack.map((task, index) => {
            const depth = index;
            const rotate = depth * 1.25 - (stack.length - 1) * 0.625;
            const y = depth * 14;
            const scale = 1 - depth * 0.028;
            return (
              <div
                key={task.id}
                role="listitem"
                className="absolute left-1/2 top-0 w-[94%] origin-top rounded-xl border border-zinc-200/90 bg-white/95 px-4 py-3 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.35)] dark:border-zinc-600/90 dark:bg-zinc-800/95 dark:shadow-[0_12px_32px_-14px_rgba(0,0,0,0.65)]"
                style={{
                  transform: `translate(-50%, ${y}px) rotate(${rotate}deg) scale(${scale})`,
                  zIndex: stack.length - depth,
                }}
              >
                <h2 className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {task.title}
                </h2>
                {task.description ? (
                  <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {task.description}
                  </p>
                ) : null}
                <p className="mt-1 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                  {task.dueDate ? formatTaskDue(task.dueDate) : "No due date"}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

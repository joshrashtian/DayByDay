import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTasksStore } from "../../stores/tasksStore";
import { formatTaskDue } from "../../lib/taskDates";
import { IoCheckmarkCircleOutline } from "react-icons/io5";

const STACK_MAX = 4;

type Props = {
  activeBlockName?: string;
};

export const TasksFrontPage = ({ activeBlockName }: Props) => {
  const { tasks } = useTasksStore(useShallow((s) => ({ tasks: s.tasks })));
  const { toggleTask } = useTasksStore(
    useShallow((s) => ({ toggleTask: s.toggleTask })),
  );

  const stack = useMemo(
    () =>
      [...tasks]
        .filter((task) => {
          if (!activeBlockName) return true;
          return task.block?.trim().toLowerCase() === activeBlockName.toLowerCase();
        })
        .sort(
          (a, b) => (b.dueDate?.getTime() ?? 0) - (a.dueDate?.getTime() ?? 0),
        )
        .filter((task) => !task.done)
        .slice(0, STACK_MAX),
    [tasks, activeBlockName],
  );

  const stackHeightPx = 52 + (Math.max(stack.length, 1) - 1) * 14;

  return (
    <div className="rounded-2xl ">
      <div className="flex flex-col items-start gap-1.5">
        <h1 className="text-4xl font-bold font-quantify tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Task Stack
        </h1>
        <p className="text-md font-display text-zinc-500 dark:text-zinc-400">
          {activeBlockName ? `${activeBlockName} tasks: ${stack.length}` : `Tasks in this block: ${stack.length}`}
        </p>
      </div>

      <div
        className="relative mt-7 w-full max-w-md"
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
                className="absolute left-1/2 top-0 w-[94%] h-32 origin-top rounded-xl border border-zinc-200/90 bg-white/95 px-4 py-3 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.35)] dark:border-zinc-600/90 dark:bg-zinc-800/95 dark:shadow-[0_12px_32px_-14px_rgba(0,0,0,0.65)]"
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
                <div className="flex flex-row items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                    Priority:{" "}
                    {task.critical
                      ? "Critical"
                      : task.priority
                        ? task.priority.charAt(0).toUpperCase() +
                          task.priority.slice(1)
                        : "No priority"}
                  </span>
                </div>
                <div className="flex flex-row items-center justify-between">
                  <button
                    onClick={() => toggleTask(task.id)}
                    type="button"
                    className="text-xs font-medium text-zinc-400 dark:text-zinc-500"
                  >
                    <IoCheckmarkCircleOutline />
                  </button>
                </div>
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

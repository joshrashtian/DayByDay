import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTasksStore } from "../../stores/tasksStore";
import { formatTaskDue } from "../../lib/taskDates";
import { IoCheckmarkCircleOutline, IoChevronDown } from "react-icons/io5";

const STACK_MAX = 4;

type Props = {
  activeBlockName?: string;
};

export const TasksFrontPage = ({ activeBlockName }: Props) => {
  const { tasks } = useTasksStore(useShallow((s) => ({ tasks: s.tasks })));
  const { toggleTask } = useTasksStore(
    useShallow((s) => ({ toggleTask: s.toggleTask })),
  );
  const [rotationOffset, setRotationOffset] = useState(0);
  const [showFinished, setShowFinished] = useState(false);

  useEffect(() => {
    setRotationOffset(0);
  }, [activeBlockName]);

  useEffect(() => {
    setRotationOffset(0);
  }, [showFinished]);

  const visibleTasks = useMemo(
    () =>
      [...tasks]
        .filter((task) => {
          if (!activeBlockName) return true;
          return (
            task.block?.trim().toLowerCase() === activeBlockName.toLowerCase()
          );
        })
        .sort(
          (a, b) => (b.dueDate?.getTime() ?? 0) - (a.dueDate?.getTime() ?? 0),
        )
        .filter((task) => (showFinished ? task.done : !task.done)),
    [tasks, activeBlockName, showFinished],
  );

  useEffect(() => {
    if (visibleTasks.length === 0) {
      if (rotationOffset !== 0) setRotationOffset(0);
      return;
    }
    if (rotationOffset >= visibleTasks.length) {
      setRotationOffset(rotationOffset % visibleTasks.length);
    }
  }, [visibleTasks.length, rotationOffset]);

  const rotatedTasks = useMemo(() => {
    if (visibleTasks.length < 2) return visibleTasks;
    const normalizedOffset =
      ((rotationOffset % visibleTasks.length) + visibleTasks.length) %
      visibleTasks.length;
    return [
      ...visibleTasks.slice(normalizedOffset),
      ...visibleTasks.slice(0, normalizedOffset),
    ];
  }, [visibleTasks, rotationOffset]);

  const stack = useMemo(() => rotatedTasks.slice(0, STACK_MAX), [rotatedTasks]);
  const activeTask = rotatedTasks[0];
  const canRotateActive =
    rotatedTasks.length > 1 && Boolean(activeTask) && !activeTask.critical;

  const rotateActiveTask = () => {
    if (!canRotateActive) return;
    setRotationOffset((offset) => (offset + 1) % rotatedTasks.length);
  };

  const stackHeightPx = 52 + (Math.max(stack.length, 1) - 1) * 14;

  return (
    <div className="rounded-2xl ">
      <div className="flex flex-col items-start gap-1.5">
        <h1 className="text-4xl font-bold font-quantify tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Task Stack
        </h1>
        <p className="text-md font-display text-zinc-500 dark:text-zinc-400">
          {activeBlockName
            ? `${activeBlockName} ${showFinished ? "finished" : "active"} tasks: ${stack.length}`
            : `${showFinished ? "Finished" : "Active"} tasks in this block: ${stack.length}`}
        </p>
        <button
          type="button"
          onClick={() => setShowFinished((v) => !v)}
          className="rounded-lg border border-zinc-300/80 bg-white/70 px-2.5 py-1 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          {showFinished ? "Show active" : "Show finished"}
        </button>
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
            {showFinished
              ? "No finished tasks in this block yet."
              : "No active tasks yet — add one from Tasks."}
          </div>
        ) : (
          stack.map((task, index) => {
            const isTopCard = index === 0;
            const depth = index;
            const rotate = depth * 1.25 - (stack.length - 1) * 0.625;
            const y = depth * 14;
            const scale = 1 - depth * 0.028;
            return (
              <div
                key={task.id}
                role="listitem"
                className="absolute flex flex-col items-start justify-between left-1/2 top-0 w-[60%] h-64 origin-top rounded-xl border border-zinc-200/90 bg-white/95 px-4 py-3 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.35)] dark:border-zinc-600/90 dark:bg-zinc-800/95 dark:shadow-[0_12px_32px_-14px_rgba(0,0,0,0.65)]"
                style={{
                  transform: `translate(-50%, ${y}px) rotate(${rotate}deg) scale(${scale})`,
                  zIndex: stack.length - depth,
                }}
              >
                <div>
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

                  <p className="mt-1 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                    {task.dueDate ? formatTaskDue(task.dueDate) : "No due date"}
                  </p>
                </div>

                <div className="flex flex-row items-center justify-center w-full">
                  <button
                    onClick={() => toggleTask(task.id)}
                    type="button"
                    className="text-2xl bg-zinc-100 rounded-full p-2 text-zinc-400 dark:text-zinc-500"
                  >
                    <IoCheckmarkCircleOutline />
                  </button>
                  <button
                    onClick={rotateActiveTask}
                    type="button"
                    disabled={!isTopCard || !canRotateActive}
                    className="text-2xl bg-zinc-100 rounded-full p-2 text-zinc-400 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-500"
                    title={
                      isTopCard && activeTask?.critical
                        ? "Critical active task cannot be rotated"
                        : "Rotate active task"
                    }
                  >
                    <IoChevronDown />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

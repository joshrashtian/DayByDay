import { LayoutGroup, motion } from "motion/react";
import { DateTime } from "luxon";
import { useEffect, useState, type MouseEvent } from "react";
import type { Task } from "../../types/task";
import {
  buildMonthGrid,
  type CalendarTaskRow,
  tasksByDueDateKeyInRange,
  weekdayLabelsShort,
} from "../../lib/calendarUtils";
import { formatTaskDue } from "../../lib/taskDates";
import BottomSheet from "../../ui/BottomSheet";
import { IoAdd, IoCheckmarkDone } from "react-icons/io5";

const cellEase = [0.25, 0.1, 0.25, 1] as const;

function useMdUp() {
  const [mdUp, setMdUp] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setMdUp(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return mdUp;
}

const cellVariants = {
  hidden: { opacity: 0, y: 6 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.012, duration: 0.22, ease: cellEase },
  }),
};

type TaskListProps = {
  items: CalendarTaskRow[];
  onToggle: (id: string) => void;
  compact?: boolean;
};

function TaskDueList({ items, onToggle, compact }: TaskListProps) {
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const openTask = (task: Task, e: MouseEvent) => {
    e.stopPropagation();
    setSelectedTask(task);
    setBottomSheetOpen(true);
  };

  const closeSheet = () => {
    setBottomSheetOpen(false);
    setSelectedTask(null);
  };

  if (items.length === 0) {
    return (
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        {compact ? "—" : "Nothing due"}
      </p>
    );
  }

  return (
    <>
      {compact ? (
        <ul className="flex min-h-0 flex-col gap-1">
          {items.map(({ task, displayDueDate, rowKey }) => (
            <li key={rowKey}>
              <button
                type="button"
                onClick={(e) => openTask(task, e)}
                className={`w-full rounded-lg border px-2 py-1 text-left text-xs font-medium transition-colors hover:bg-white/60 dark:hover:bg-white/10 ${
                  task.critical
                    ? "border-red-500/80"
                    : "border-white/20 dark:border-white/15"
                }`}
              >
                <p>
                  {task.done && (
                    <IoCheckmarkDone
                      className={`${task.critical ? "text-red-500" : "text-blue-500"}`}
                    />
                  )}
                </p>
                {task.critical ? (
                  <span className="text-xs font-display italic text-red-500">
                    CRITICAL
                  </span>
                ) : null}
                {task.block ? (
                  <span className="mb-0.5 block truncate text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                    {task.block}
                  </span>
                ) : null}
                {task.category ? (
                  <span className="mb-0.5 block truncate text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                    {task.category}
                  </span>
                ) : null}
                <span className="line-clamp-2 font-black leading-snug">
                  {task.title}
                </span>
                <time
                  dateTime={displayDueDate.toISOString()}
                  className="mt-0.5 block truncate text-[10px] text-zinc-500 dark:text-zinc-400"
                >
                  {formatTaskDue(displayDueDate)}
                </time>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map(({ task, displayDueDate, rowKey }) => (
            <li key={rowKey} className="flex flex-row items-center gap-2">
              {task.done ? (
                <span
                  className="relative inline-grid h-14 w-14 shrink-0 place-items-center before:absolute before:z-0 before:h-10 before:w-10 before:rotate-45 before:rounded-sm before:bg-red-500 before:content-['']"
                  aria-hidden
                >
                  <IoCheckmarkDone className="relative z-10 text-3xl text-white" />
                </span>
              ) : null}
              <button
                type="button"
                onClick={(e) => openTask(task, e)}
                className={`w-full rounded-lg  px-2 py-2 text-left  font-medium transition-colors hover:bg-white/60 dark:hover:bg-white/10 `}
              >
                {task.priority && !task.critical ? (
                  <span className="block text-xl font-display italic text-zinc-500">
                    {task.priority.toUpperCase()} PRIORITY
                  </span>
                ) : null}
                {task.critical ? (
                  <span className="block text-xl font-display italic text-red-500">
                    CRITICAL — {formatTaskDue(displayDueDate)}
                  </span>
                ) : (
                  <time
                    dateTime={displayDueDate.toISOString()}
                    className="mb-0.5 block text-xl text-zinc-500 dark:text-zinc-400"
                  >
                    {formatTaskDue(displayDueDate)}
                  </time>
                )}
                {task.block ? (
                  <span className="mb-1 block text-xl font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                    {task.block}
                  </span>
                ) : null}
                {task.category ? (
                  <span className="mb-1 block text-xl font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                    {task.category}
                  </span>
                ) : null}
                <span
                  className={`line-clamp-2 text-4xl font-black leading-tight ${task.done ? "line-through" : ""}`}
                >
                  {task.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <BottomSheet
        open={bottomSheetOpen}
        onClose={closeSheet}
        defaultSnap="full"
        title={selectedTask?.title ?? "Task"}
      >
        {selectedTask ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {selectedTask.done ? "Completed" : "Open"} · Due{" "}
              {selectedTask.dueDate
                ? formatTaskDue(selectedTask.dueDate)
                : "not set"}
            </p>
            {selectedTask.description ? (
              <p className="text-sm leading-relaxed">
                {selectedTask.description}
              </p>
            ) : null}
            <div className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
              {selectedTask.priority ? (
                <p>Priority: {selectedTask.priority}</p>
              ) : null}
              {selectedTask.block ? <p>Block: {selectedTask.block}</p> : null}
              {selectedTask.category ? (
                <p>Category: {selectedTask.category}</p>
              ) : null}
              {selectedTask.tags?.length ? (
                <p>Tags: {selectedTask.tags.join(", ")}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                onToggle(selectedTask.id);
                closeSheet();
              }}
              className="mt-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              Toggle done
            </button>
          </div>
        ) : null}
      </BottomSheet>
    </>
  );
}

type MonthGridProps = {
  month: DateTime;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onPickDay: (day: DateTime) => void;
};

export function MonthGridView({
  month,
  tasks,
  onToggleTask,
  onPickDay,
}: MonthGridProps) {
  const gridStart = month.startOf("month").startOf("week");
  const gridEnd = gridStart.plus({ days: 41 }).endOf("day");
  const byDay = tasksByDueDateKeyInRange(tasks, gridStart, gridEnd);
  const weeks = buildMonthGrid(month);
  const labels = weekdayLabelsShort();
  const today = DateTime.local().startOf("day");
  const monthStart = month.startOf("month");

  let cellIndex = 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-7 gap-1.5">
        {labels.map((label) => (
          <div
            key={label}
            className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {weeks.flatMap((week) =>
          week.map((day) => {
            const idx = cellIndex++;
            const key = day.toISODate() ?? "";
            const inMonth = day.hasSame(monthStart, "month");
            const isToday = day.hasSame(today, "day");
            const dayTasks = byDay.get(key) ?? [];

            return (
              <motion.button
                key={key}
                type="button"
                custom={idx}
                variants={cellVariants}
                initial="hidden"
                animate="show"
                onClick={() => onPickDay(day.startOf("day"))}
                className={`flex min-h-[92px] flex-col gap-1 rounded-xl border p-2 text-left ring-1 transition-colors hover:bg-white/50 dark:hover:bg-white/5 ${
                  inMonth
                    ? "border-white/60 bg-white/35 dark:border-white/10 dark:bg-zinc-900/30"
                    : "border-transparent bg-white/15 opacity-60 dark:bg-zinc-900/15 dark:opacity-50"
                } ${
                  isToday
                    ? "ring-2 ring-sky-400/70 dark:ring-sky-500/50"
                    : "ring-white/20 dark:ring-white/5"
                }`}
              >
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    isToday
                      ? "text-sky-600 dark:text-sky-400"
                      : "text-zinc-800 dark:text-zinc-200"
                  } ${!inMonth ? "text-zinc-400 dark:text-zinc-500" : ""}`}
                >
                  {day.day}
                </span>
                <div className="min-h-0 flex-1 overflow-hidden">
                  <TaskDueList
                    items={dayTasks.slice(0, 3)}
                    onToggle={onToggleTask}
                    compact
                  />
                  {dayTasks.length > 3 ? (
                    <p className="mt-0.5 text-[10px] font-medium text-zinc-500">
                      +{dayTasks.length - 3} more
                    </p>
                  ) : null}
                </div>
              </motion.button>
            );
          }),
        )}
      </div>
    </div>
  );
}

type DayViewProps = {
  day: DateTime;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onAddTaskForDay?: (day: DateTime) => void;
};

export function DayAgendaView({
  day,
  tasks,
  onToggleTask,
  onAddTaskForDay,
}: DayViewProps) {
  const byDay = tasksByDueDateKeyInRange(
    tasks,
    day.startOf("day"),
    day.endOf("day"),
  );
  const key = day.toISODate() ?? "";
  const dayTasks = byDay.get(key) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="flex flex-row ">
        {day
          .toLocaleString(DateTime.DATE_FULL)
          .split("")
          .map((part, index) => (
            <motion.p
              key={part}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{
                duration: 0.28,
                delay: index * 0.06,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="font-quantify text-6xl font-black tracking-wide text-zinc-900 dark:text-zinc-50"
            >
              {part}
            </motion.p>
          ))}
      </div>
      <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {dayTasks.length} due {dayTasks.length === 1 ? "task" : "tasks"}
        </p>
        {onAddTaskForDay ? (
          <motion.button
            initial={{ opacity: 0, x: 16, transform: "skewX(-3deg)" }}
            animate={{ opacity: 1, x: 0, transform: "skewX(6deg)" }}
            exit={{ opacity: 0, x: -16, transform: "skewX(-3deg)" }}
            whileHover={{ transform: "skew(-5deg, -5deg)", scale: 1.2 }}
            transition={{
              duration: 0.28,
              delay: 0.06,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            type="button"
            onClick={() => onAddTaskForDay(day)}
            className="shrink-0 shadow-lg flex flex-row items-center justify-center gap-2 bg-sky-500/50 px-4 py-4 text-xl font-semibold text-sky-800 hover:bg-sky-500/25 dark:border-sky-400/35 dark:bg-sky-500/20 dark:text-sky-100 dark:hover:bg-sky-500/30"
          >
            <IoAdd className="text-white drop-shadow-lg -skew-x-3" />{" "}
            <span className="text-xl font-semibold text-sky-800">Add Task</span>
          </motion.button>
        ) : null}
      </div>
      <div className="mt-6 max-w-md">
        <TaskDueList items={dayTasks} onToggle={onToggleTask} />
      </div>
    </motion.div>
  );
}

type ThreeDayProps = {
  startDay: DateTime;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onPickDay: (day: DateTime) => void;
  onAddTaskForDay?: (day: DateTime) => void;
};

type WeekViewProps = {
  startDay: DateTime;
  tasks: Task[];
  onPickDay: (day: DateTime) => void;
  onAddTaskForDay?: (day: DateTime) => void;
  onCreateTimedTask?: (start: DateTime, end: DateTime) => void;
  onUpdateTaskSchedule?: (taskId: string, dueDate: Date, endDate?: Date) => void;
};

type WeekDragSelection = {
  dayIso: string;
  day: DateTime;
  startMinuteOfDay: number;
  endMinuteOfDay: number;
};

type WeekEditTarget = {
  day: DateTime;
  minuteOfDay: number;
};

type WeekEditInteraction =
  | {
      kind: "move";
      taskId: string;
      baseDueDate: DateTime;
      hasEndDate: boolean;
      displayDurationMs: number;
      displayDurationMinutes: number;
      occurrenceOffsetMs: number;
    }
  | {
      kind: "resize-start";
      taskId: string;
      baseDueDate: DateTime;
      baseEndDate: DateTime;
      occurrenceOffsetMs: number;
      baseDisplayEndMinute: number;
    }
  | {
      kind: "resize-end";
      taskId: string;
      baseDueDate: DateTime;
      occurrenceOffsetMs: number;
      baseDisplayStartMinute: number;
    };

function isDateOnlyDue(dt: DateTime): boolean {
  const isEndOfDay = dt.hour === 23 && dt.minute === 59;
  const isStartOfDay = dt.hour === 0 && dt.minute === 0;
  return isEndOfDay || isStartOfDay;
}

function minuteOfDayToLabel(minuteOfDay: number): string {
  const hour = Math.floor(minuteOfDay / 60);
  return DateTime.fromObject({ hour }).toFormat("h a");
}

function slotDateTime(day: DateTime, minuteOfDay: number): DateTime {
  return day.startOf("day").plus({ minutes: minuteOfDay });
}

type WeekPreviewRange = {
  dayIso: string;
  startMinute: number;
  endMinuteExclusive: number;
};

function resolvePreviewRange(
  interaction: WeekEditInteraction | null,
  target: WeekEditTarget | null,
): WeekPreviewRange | null {
  if (!interaction || !target) return null;
  const dayIso = target.day.toISODate();
  if (!dayIso) return null;

  if (interaction.kind === "move") {
    const startMinute = Math.max(0, Math.min(24 * 60 - 15, target.minuteOfDay));
    const endMinuteExclusive = Math.min(
      24 * 60,
      startMinute + interaction.displayDurationMinutes,
    );
    return {
      dayIso,
      startMinute,
      endMinuteExclusive: Math.max(startMinute + 15, endMinuteExclusive),
    };
  }

  if (interaction.kind === "resize-start") {
    const maxStart = interaction.baseDisplayEndMinute - 15;
    const startMinute = Math.max(0, Math.min(target.minuteOfDay, maxStart));
    return {
      dayIso,
      startMinute,
      endMinuteExclusive: interaction.baseDisplayEndMinute,
    };
  }

  const minEnd = interaction.baseDisplayStartMinute + 15;
  const endMinuteExclusive = Math.max(minEnd, target.minuteOfDay + 15);
  return {
    dayIso,
    startMinute: interaction.baseDisplayStartMinute,
    endMinuteExclusive: Math.min(24 * 60, endMinuteExclusive),
  };
}

function resolveCreatePreviewRange(
  dragSelection: WeekDragSelection | null,
): WeekPreviewRange | null {
  if (!dragSelection) return null;
  return {
    dayIso: dragSelection.dayIso,
    startMinute: Math.min(
      dragSelection.startMinuteOfDay,
      dragSelection.endMinuteOfDay,
    ),
    endMinuteExclusive:
      Math.max(dragSelection.startMinuteOfDay, dragSelection.endMinuteOfDay) + 15,
  };
}

type MinuteRange = {
  startMinute: number;
  endMinuteExclusive: number;
};

function resolveRowMinuteRange(row: CalendarTaskRow): MinuteRange {
  const start = DateTime.fromJSDate(row.displayDueDate);
  const taskDue = row.task.dueDate
    ? DateTime.fromJSDate(row.task.dueDate)
    : null;
  const taskEnd = row.task.endDate
    ? DateTime.fromJSDate(row.task.endDate)
    : null;

  let end = start.plus({ minutes: 15 });
  if (taskDue && taskEnd && taskEnd > taskDue) {
    // Recurring events should preserve their original duration per occurrence.
    end = start.plus({ milliseconds: taskEnd.toMillis() - taskDue.toMillis() });
  } else if (taskEnd && taskEnd > start) {
    end = taskEnd;
  }

  const rawStartMinute = start.hour * 60 + start.minute;
  const rawEndMinute = end.hour * 60 + end.minute;

  const startQuarter = Math.max(0, Math.floor(rawStartMinute / 15) * 15);
  const endQuarter = Math.min(24 * 60, Math.ceil(rawEndMinute / 15) * 15);

  return {
    startMinute: startQuarter,
    endMinuteExclusive: Math.max(startQuarter + 15, endQuarter),
  };
}

export function WeekView({
  startDay,
  tasks,
  onPickDay,
  onAddTaskForDay,
  onCreateTimedTask,
  onUpdateTaskSchedule,
}: WeekViewProps) {
  const weekStart = startDay.startOf("week");
  const weekEnd = weekStart.plus({ days: 6 }).endOf("day");
  const byDay = tasksByDueDateKeyInRange(
    tasks,
    weekStart.startOf("day"),
    weekEnd,
  );
  const days = Array.from({ length: 7 }, (_, i) =>
    weekStart.plus({ days: i }).startOf("day"),
  );
  const today = DateTime.local().startOf("day");
  const quarterSlots = Array.from({ length: 60 }, (_, i) => 7 * 60 + i * 15);
  const [dragSelection, setDragSelection] = useState<WeekDragSelection | null>(
    null,
  );
  const [editInteraction, setEditInteraction] =
    useState<WeekEditInteraction | null>(null);
  const [editTarget, setEditTarget] = useState<WeekEditTarget | null>(null);
  const editPreviewRange = resolvePreviewRange(editInteraction, editTarget);
  const createPreviewRange = resolveCreatePreviewRange(dragSelection);
  const previewRange = editPreviewRange ?? createPreviewRange;

  const finishCreateDrag = () => {
    if (!dragSelection) return;
    if (onCreateTimedTask) {
      const minMinute = Math.min(
        dragSelection.startMinuteOfDay,
        dragSelection.endMinuteOfDay,
      );
      const maxMinute = Math.max(
        dragSelection.startMinuteOfDay,
        dragSelection.endMinuteOfDay,
      );
      const start = dragSelection.day.set({
        hour: Math.floor(minMinute / 60),
        minute: minMinute % 60,
        second: 0,
        millisecond: 0,
      });
      const endMinuteExclusive = Math.min(maxMinute + 15, 24 * 60 - 1);
      const end = dragSelection.day.set({
        hour: Math.floor(endMinuteExclusive / 60),
        minute: endMinuteExclusive % 60,
        second: 0,
        millisecond: 0,
      });
      onCreateTimedTask(start, end);
    } else {
      onPickDay(dragSelection.day);
    }
    setDragSelection(null);
  };

  useEffect(() => {
    if (!dragSelection && !editInteraction) return;
    const onMouseUp = () => {
      if (editInteraction && editTarget && onUpdateTaskSchedule) {
        const targetStart = slotDateTime(editTarget.day, editTarget.minuteOfDay);
        if (editInteraction.kind === "move") {
          const dueDate = targetStart.minus({
            milliseconds: editInteraction.occurrenceOffsetMs,
          });
          const endDate = editInteraction.hasEndDate
            ? dueDate.plus({ milliseconds: editInteraction.displayDurationMs })
            : undefined;
          onUpdateTaskSchedule(
            editInteraction.taskId,
            dueDate.toJSDate(),
            endDate?.toJSDate(),
          );
        } else if (editInteraction.kind === "resize-start") {
          const minStart = editInteraction.baseEndDate.minus({ minutes: 15 });
          const dueDateCandidate = targetStart.minus({
            milliseconds: editInteraction.occurrenceOffsetMs,
          });
          const dueDate = dueDateCandidate > minStart ? minStart : dueDateCandidate;
          onUpdateTaskSchedule(
            editInteraction.taskId,
            dueDate.toJSDate(),
            editInteraction.baseEndDate.toJSDate(),
          );
        } else {
          const targetEndDisplay = slotDateTime(
            editTarget.day,
            editTarget.minuteOfDay + 15,
          );
          const endDateCandidate = targetEndDisplay.minus({
            milliseconds: editInteraction.occurrenceOffsetMs,
          });
          const minEnd = editInteraction.baseDueDate.plus({ minutes: 15 });
          const endDate = endDateCandidate < minEnd ? minEnd : endDateCandidate;
          onUpdateTaskSchedule(
            editInteraction.taskId,
            editInteraction.baseDueDate.toJSDate(),
            endDate.toJSDate(),
          );
        }
      } else if (dragSelection) {
        finishCreateDrag();
      }
      setEditInteraction(null);
      setEditTarget(null);
      setDragSelection(null);
    };
    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, [dragSelection, editInteraction, editTarget, onUpdateTaskSchedule]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          W{weekStart.weekNumber}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {weekStart.toFormat("d MMM")} -{" "}
          {weekStart.plus({ days: 6 }).toFormat("d MMM yyyy")}
        </p>
      </div>

      <div className="max-h-[70vh] overflow-auto  border border-white/60 bg-white/35 ring-1 ring-white/25 dark:border-white/15 dark:bg-zinc-900/35 dark:ring-white/10">
        <div className=" grid min-w-[920px] grid-cols-[74px_repeat(7,minmax(116px,1fr))]">
          <div className="sticky top-0 z-30 border-b border-r border-white/40 bg-zinc-100/95 px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 backdrop-blur dark:border-white/10 dark:bg-zinc-900/95 dark:text-zinc-400">
            Time
          </div>
          {days.map((day) => {
            const key = day.toISODate() ?? "";
            const count = (byDay.get(key) ?? []).length;
            const isToday = day.hasSame(today, "day");
            return (
              <button
                key={key}
                type="button"
                onClick={() => onPickDay(day)}
                className={`sticky top-0 z-30 border-b border-r border-white/40 px-2 py-2 text-left backdrop-blur hover:bg-white/35 dark:border-white/10 dark:hover:bg-white/5 ${
                  isToday
                    ? "bg-sky-100/90 dark:bg-sky-900/60"
                    : "bg-zinc-100/95 dark:bg-zinc-900/95"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {day.toFormat("ccc")}
                </p>
                <p className="text-sm font-black text-zinc-800 dark:text-zinc-100">
                  {day.toFormat("d")}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {count} {count === 1 ? "task" : "tasks"}
                </p>
              </button>
            );
          })}

          <div className="border-r border-white/40 p-2 dark:border-white/10">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              All day
            </p>
          </div>
          {days.map((day) => {
            const key = day.toISODate() ?? "";
            const allDayItems = (byDay.get(key) ?? []).filter((row) =>
              isDateOnlyDue(DateTime.fromJSDate(row.displayDueDate)),
            );
            return (
              <div
                key={`${key}-all-day`}
                className="border-r border-white/40 p-1.5 dark:border-white/10"
              >
                <div className="flex min-h-[44px] flex-col gap-1">
                  {allDayItems.slice(0, 2).map((row) => (
                    <button
                      key={row.rowKey}
                      type="button"
                      onClick={() => onPickDay(day)}
                      className={`truncate rounded-md px-1.5 py-1 text-left text-[10px] font-semibold ${
                        row.task.critical
                          ? "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-200"
                          : "bg-zinc-500/15 text-zinc-700 dark:bg-zinc-500/25 dark:text-zinc-200"
                      }`}
                    >
                      {row.task.title}
                    </button>
                  ))}
                  {allDayItems.length > 2 ? (
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      +{allDayItems.length - 2} more
                    </p>
                  ) : null}
                  {allDayItems.length === 0 && onAddTaskForDay ? (
                    <button
                      type="button"
                      onClick={() => onAddTaskForDay(day)}
                      className="rounded-md border border-sky-500/30 px-1.5 py-1 text-[10px] font-semibold text-sky-700 hover:bg-sky-500/15 dark:text-sky-300 dark:hover:bg-sky-500/20"
                    >
                      + Add
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}

          <LayoutGroup id="week-events">
            {quarterSlots.map((minuteOfDay) => (
              <FragmentQuarterRow
                key={`quarter-${minuteOfDay}`}
                minuteOfDay={minuteOfDay}
                days={days}
                byDay={byDay}
                onSlotMouseDown={(day, slotMinuteOfDay) => {
                  if (editInteraction) return;
                  const dayIso = day.toISODate() ?? "";
                  setDragSelection({
                    dayIso,
                    day,
                    startMinuteOfDay: slotMinuteOfDay,
                    endMinuteOfDay: slotMinuteOfDay,
                  });
                }}
                onSlotMouseEnter={(day, slotMinuteOfDay) => {
                  if (editInteraction) {
                    setEditTarget({ day, minuteOfDay: slotMinuteOfDay });
                    return;
                  }
                  if (!dragSelection) return;
                  const dayIso = day.toISODate() ?? "";
                  setDragSelection((prev) => {
                    if (!prev) return prev;
                    if (dayIso !== prev.dayIso) return prev;
                    return { ...prev, endMinuteOfDay: slotMinuteOfDay };
                  });
                }}
                onEventMoveStart={(row, day, slotMinuteOfDay) => {
                  if (!onUpdateTaskSchedule || !row.task.dueDate) return;
                  const dueDate = DateTime.fromJSDate(row.task.dueDate);
                  const displayStart = DateTime.fromJSDate(row.displayDueDate);
                  const range = resolveRowMinuteRange(row);
                  const durationMinutes =
                    range.endMinuteExclusive - range.startMinute;
                  setEditInteraction({
                    kind: "move",
                    taskId: row.task.id,
                    baseDueDate: dueDate,
                    hasEndDate: Boolean(row.task.endDate),
                    displayDurationMs: durationMinutes * 60 * 1000,
                    displayDurationMinutes: durationMinutes,
                    occurrenceOffsetMs: displayStart.toMillis() - dueDate.toMillis(),
                  });
                  setEditTarget({ day, minuteOfDay: slotMinuteOfDay });
                }}
                onEventResizeStart={(row, day, slotMinuteOfDay, edge) => {
                  if (!onUpdateTaskSchedule || !row.task.dueDate) return;
                  const dueDate = DateTime.fromJSDate(row.task.dueDate);
                  const displayStart = DateTime.fromJSDate(row.displayDueDate);
                  const range = resolveRowMinuteRange(row);
                  const occurrenceOffsetMs =
                    displayStart.toMillis() - dueDate.toMillis();
                  if (edge === "start") {
                    const baseEnd =
                      row.task.endDate && row.task.endDate > row.task.dueDate
                        ? DateTime.fromJSDate(row.task.endDate)
                        : dueDate.plus({ minutes: 15 });
                    setEditInteraction({
                      kind: "resize-start",
                      taskId: row.task.id,
                      baseDueDate: dueDate,
                      baseEndDate: baseEnd,
                      occurrenceOffsetMs,
                      baseDisplayEndMinute: range.endMinuteExclusive,
                    });
                  } else {
                    setEditInteraction({
                      kind: "resize-end",
                      taskId: row.task.id,
                      baseDueDate: dueDate,
                      occurrenceOffsetMs,
                      baseDisplayStartMinute: range.startMinute,
                    });
                  }
                  setEditTarget({ day, minuteOfDay: slotMinuteOfDay });
                }}
                previewRange={previewRange}
              />
            ))}
          </LayoutGroup>
        </div>
      </div>
    </div>
  );
}

type FragmentQuarterRowProps = {
  minuteOfDay: number;
  days: DateTime[];
  byDay: Map<string, CalendarTaskRow[]>;
  onSlotMouseDown: (day: DateTime, minuteOfDay: number) => void;
  onSlotMouseEnter: (day: DateTime, minuteOfDay: number) => void;
  onEventMoveStart: (
    row: CalendarTaskRow,
    day: DateTime,
    minuteOfDay: number,
  ) => void;
  onEventResizeStart: (
    row: CalendarTaskRow,
    day: DateTime,
    minuteOfDay: number,
    edge: "start" | "end",
  ) => void;
  previewRange: WeekPreviewRange | null;
};

function FragmentQuarterRow({
  minuteOfDay,
  days,
  byDay,
  onSlotMouseDown,
  onSlotMouseEnter,
  onEventMoveStart,
  onEventResizeStart,
  previewRange,
}: FragmentQuarterRowProps) {
  const isHourLine = minuteOfDay % 60 === 0;
  const isHalfLine = minuteOfDay % 60 === 30;
  return (
    <>
      <div
        className={`border-r border-white/35 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-white/10 dark:text-zinc-400 ${
          isHourLine
            ? "border-t border-white/35 dark:border-white/10"
            : isHalfLine
              ? "border-t border-white/20 dark:border-white/5"
              : "border-t border-dashed border-white/10 dark:border-white/5"
        }`}
      >
        {isHourLine ? minuteOfDayToLabel(minuteOfDay) : ""}
      </div>
      {days.map((day) => {
        const key = day.toISODate() ?? "";
        const slotStartMinute = minuteOfDay;
        const slotEndMinuteExclusive = minuteOfDay + 15;
        const slotTasks = (byDay.get(key) ?? []).filter((row) => {
          const dt = DateTime.fromJSDate(row.displayDueDate);
          if (isDateOnlyDue(dt)) return false;
          const range = resolveRowMinuteRange(row);
          return (
            slotStartMinute < range.endMinuteExclusive &&
            slotEndMinuteExclusive > range.startMinute
          );
        });
        const inPreview = (() => {
          if (!previewRange) return false;
          if (previewRange.dayIso !== key) return false;
          return (
            minuteOfDay >= previewRange.startMinute &&
            minuteOfDay < previewRange.endMinuteExclusive
          );
        })();
        const isPreviewStart = inPreview && previewRange?.startMinute === minuteOfDay;
        const isPreviewEnd =
          inPreview && previewRange?.endMinuteExclusive === minuteOfDay + 15;
        return (
          <div
            key={`${key}-${minuteOfDay}`}
            className={`relative min-h-[24px] border-r p-0 dark:border-white/10 ${
              isHourLine
                ? "border-t border-white/35 dark:border-white/10"
                : isHalfLine
                  ? "border-t border-white/20 dark:border-white/5"
                  : "border-t border-dashed border-white/10 dark:border-white/5"
            }`}
            onMouseDown={(e) => {
              onSlotMouseDown(day, minuteOfDay);
              e.preventDefault();
            }}
            onMouseEnter={() => onSlotMouseEnter(day, minuteOfDay)}
          >
            {inPreview ? (
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className={`pointer-events-none absolute inset-x-0 top-0 bottom-0 border border-sky-500/45 bg-sky-500/20 dark:border-sky-300/45 dark:bg-sky-400/20 ${
                  isPreviewStart ? "rounded-t-md" : ""
                } ${isPreviewEnd ? "rounded-b-md" : ""}`}
              />
            ) : null}
            <div className="flex h-full flex-col gap-0">
              {slotTasks.slice(0, 2).map((row) =>
                (() => {
                  const range = resolveRowMinuteRange(row);
                  const isStartSlot = range.startMinute === minuteOfDay;
                  const isEndSlot =
                    range.endMinuteExclusive === minuteOfDay + 15;
                  return (
                    <motion.button
                      layout="position"
                      transition={{ type: "spring", stiffness: 420, damping: 36 }}
                      key={row.rowKey}
                      type="button"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onEventMoveStart(row, day, minuteOfDay);
                      }}
                      className={`relative h-full min-h-[24px] w-full truncate px-1.5 py-0.5 text-left text-[10px] leading-tight ${
                        row.task.critical
                          ? "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-200"
                          : "bg-amber-500/20 text-amber-800 dark:bg-amber-500/30 dark:text-amber-100"
                      } ${isStartSlot ? "rounded-t-md" : ""} ${isEndSlot ? "rounded-b-md" : ""}`}
                      title={`${DateTime.fromJSDate(row.displayDueDate).toFormat("h:mm a")} ${row.task.title}`}
                    >
                      {isStartSlot ? (
                        <span
                          className="absolute inset-x-1 top-0 h-1 cursor-ns-resize rounded-full bg-current/50"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onEventResizeStart(row, day, minuteOfDay, "start");
                          }}
                        />
                      ) : null}
                      {isStartSlot
                        ? `${DateTime.fromJSDate(row.displayDueDate).toFormat("h:mm a")} ${row.task.title}`
                        : ""}
                      {isEndSlot ? (
                        <span
                          className="absolute inset-x-1 bottom-0 h-1 cursor-ns-resize rounded-full bg-current/50"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onEventResizeStart(row, day, minuteOfDay, "end");
                          }}
                        />
                      ) : null}
                    </motion.button>
                  );
                })(),
              )}
              {slotTasks.length > 2 ? (
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  +{slotTasks.length - 2} more
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </>
  );
}

export function ThreeDayView({
  startDay,
  tasks,
  onToggleTask,
  onPickDay,
  onAddTaskForDay,
}: ThreeDayProps) {
  const mdUp = useMdUp();
  const rangeStart = startDay.startOf("day");
  const rangeEnd = startDay.plus({ days: 2 }).endOf("day");
  const byDay = tasksByDueDateKeyInRange(tasks, rangeStart, rangeEnd);
  const days = [0, 1, 2].map((i) => startDay.plus({ days: i }).startOf("day"));
  const today = DateTime.local().startOf("day");

  const slantEase = [0.25, 0.1, 0.25, 1] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="md:perspective-[1400px] md:perspective-origin-x-center"
    >
      <div className="grid gap-3 md:grid-cols-3 md:gap-1 md:px-2 md:pb-3 md:pt-1">
        {days.map((day, col) => {
          const key = day.toISODate() ?? "";
          const dayTasks = byDay.get(key) ?? [];
          const isToday = day.hasSame(today, "day");

          const rotateY = mdUp && col === 0 ? 9 : mdUp && col === 2 ? -9 : 0;
          const transformOrigin =
            col === 0
              ? ("right center" as const)
              : col === 2
                ? ("left center" as const)
                : ("center center" as const);

          return (
            <motion.div
              key={key}
              initial={{
                opacity: 0,
                y: 14,
                rotateY: mdUp ? rotateY * 0.35 : 0,
              }}
              animate={{ opacity: 1, y: 0, rotateY }}
              transition={{
                delay: col * 0.06,
                duration: 0.36,
                ease: slantEase,
              }}
              style={{
                transformStyle: "preserve-3d",
                transformOrigin: mdUp ? transformOrigin : "center center",
              }}
              className={`flex flex-col rounded-2xl border border-white/70 bg-white/40 p-4 shadow-[0_4px_24px_rgba(15,15,15,0.06)] ring-1 backdrop-blur-xl dark:border-white/15 dark:bg-zinc-900/35 ${
                isToday
                  ? "ring-2 ring-sky-400/60 dark:ring-sky-500/45"
                  : "ring-white/30 dark:ring-white/10"
              } ${mdUp ? "md:z-1 md:shadow-[0_12px_40px_rgba(15,15,15,0.12)] dark:md:shadow-[0_16px_48px_rgba(0,0,0,0.35)]" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onPickDay(day)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {day.toFormat("ccc")}
                  </p>
                  <p className="mt-0.5 font-fava text-xl font-black text-zinc-900 dark:text-zinc-50">
                    {day.toFormat("d MMM")}
                  </p>
                </button>
                {onAddTaskForDay ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddTaskForDay(day);
                    }}
                    className="shrink-0 rounded-lg border border-sky-500/35 bg-sky-500/15 px-2.5 py-1 text-[11px] font-semibold text-sky-800 hover:bg-sky-500/25 dark:border-sky-400/30 dark:bg-sky-500/20 dark:text-sky-100 dark:hover:bg-sky-500/30"
                    aria-label={`Add task for ${day.toFormat("d MMM")}`}
                  >
                    + Task
                  </button>
                ) : null}
              </div>
              <div className="mt-4 min-h-[120px] flex-1">
                <TaskDueList items={dayTasks} onToggle={onToggleTask} compact />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

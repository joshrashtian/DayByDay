import { LayoutGroup, motion } from "motion/react";
import { DateTime } from "luxon";
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import type { Task } from "../../types/task";
import {
  buildMonthGrid,
  type CalendarTaskRow,
  tasksByDueDateKeyInRange,
  weekdayLabelsShort,
} from "../../lib/calendarUtils";
import { resolveCategoryVisual } from "../../lib/taskCategories";
import { formatTaskDue } from "../../lib/taskDates";
import { useContextMenu } from "../../providers/ContextMenuProvider";
import BottomSheet from "../../ui/BottomSheet";
import { IoAdd, IoCheckmarkDone, IoClose, IoDocument } from "react-icons/io5";

const cellEase = [0.25, 0.1, 0.25, 1] as const;

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
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  compact?: boolean;
};

function TaskDueList({
  items,
  onToggle,
  onEditTask,
  onDeleteTask,
  compact,
}: TaskListProps) {
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { openMenu } = useContextMenu();

  const openTask = (task: Task, e: ReactMouseEvent) => {
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
          {items.map(({ task, displayDueDate, rowKey }) => {
            const categoryVisual = resolveCategoryVisual(task.category);
            return (
              <li key={rowKey}>
                <button
                  type="button"
                  onClick={(e) => openTask(task, e)}
                  onContextMenu={(e) =>
                    openMenu(e, [
                      ...(onEditTask
                        ? [
                            {
                              id: `edit-${task.id}`,
                              label: "Edit task…",
                              onSelect: () => onEditTask(task),
                            } as const,
                          ]
                        : []),
                      {
                        id: `toggle-${task.id}`,
                        label: task.done ? "Mark not done" : "Mark done",
                        onSelect: () => onToggle(task.id),
                      },
                      ...(onDeleteTask
                        ? [
                            {
                              id: `delete-${task.id}`,
                              label: "Delete",
                              onSelect: () => onDeleteTask(task.id),
                              destructive: true,
                            } as const,
                          ]
                        : []),
                    ])
                  }
                  className={`w-full rounded-lg border px-2 py-1.5 text-left text-xs font-medium transition-colors hover:bg-white/60 dark:hover:bg-white/10 ${
                    task.critical
                      ? "border-red-500/80 bg-red-500/5"
                      : "border-white/30 bg-white/30 dark:border-white/15 dark:bg-white/5"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    {task.critical ? (
                      <span className="text-[10px] font-display italic text-red-500">
                        CRITICAL
                      </span>
                    ) : task.category && categoryVisual ? (
                      <span
                        className="inline-flex max-w-full items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                        style={{
                          backgroundColor: categoryVisual.bg,
                          color: categoryVisual.text,
                          borderColor: categoryVisual.border,
                        }}
                      >
                        {categoryVisual.icon ? (
                          <span>{categoryVisual.icon}</span>
                        ) : null}
                        <span className="truncate">{task.category}</span>
                      </span>
                    ) : null}
                    {task.done ? (
                      <IoCheckmarkDone
                        className={`${task.critical ? "text-red-500" : "text-blue-500"}`}
                      />
                    ) : null}
                  </div>
                  <span className="line-clamp-2 font-black leading-snug">
                    {task.title}
                  </span>
                  <time
                    dateTime={displayDueDate.toISOString()}
                    className="mt-1 block truncate text-[10px] text-zinc-500 dark:text-zinc-400"
                  >
                    {formatTaskDue(displayDueDate)}
                  </time>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map(({ task, displayDueDate, rowKey }) => {
            const categoryVisual = resolveCategoryVisual(task.category);
            return (
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
                  onContextMenu={(e) =>
                    openMenu(e, [
                      ...(onEditTask
                        ? [
                            {
                              id: `edit-${task.id}`,
                              label: "Edit task…",
                              onSelect: () => onEditTask(task),
                            } as const,
                          ]
                        : []),
                      {
                        id: `toggle-${task.id}`,
                        label: task.done ? "Mark not done" : "Mark done",
                        onSelect: () => onToggle(task.id),
                      },
                      ...(onDeleteTask
                        ? [
                            {
                              id: `delete-${task.id}`,
                              label: "Delete",
                              onSelect: () => onDeleteTask(task.id),
                              destructive: true,
                            } as const,
                          ]
                        : []),
                    ])
                  }
                  className="w-full rounded-xl  px-3 py-2 text-left font-medium  transition-colors hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  {task.priority && !task.critical ? (
                    <span className="block text-lg font-display italic text-zinc-500">
                      {task.priority.toUpperCase()} PRIORITY
                    </span>
                  ) : null}
                  {task.critical ? (
                    <span className="block text-lg font-display italic text-red-500">
                      CRITICAL — {formatTaskDue(displayDueDate)}
                    </span>
                  ) : (
                    <time
                      dateTime={displayDueDate.toISOString()}
                      className="mb-1 block text-base text-zinc-500 dark:text-zinc-400"
                    >
                      {formatTaskDue(displayDueDate)}
                    </time>
                  )}
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {task.block ? (
                      <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                        {task.block}
                      </span>
                    ) : null}
                    {task.category && categoryVisual ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
                        style={{
                          backgroundColor: categoryVisual.bg,
                          color: categoryVisual.text,
                          borderColor: categoryVisual.border,
                        }}
                      >
                        {categoryVisual.icon ? (
                          <span>{categoryVisual.icon}</span>
                        ) : null}
                        {task.category}
                      </span>
                    ) : null}
                  </div>
                  <span
                    className={`line-clamp-2 text-3xl font-black leading-tight ${task.done ? "line-through" : ""}`}
                  >
                    {task.title}
                  </span>
                </button>
              </li>
            );
          })}
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
            {onEditTask ? (
              <button
                type="button"
                onClick={() => {
                  onEditTask(selectedTask);
                  closeSheet();
                }}
                className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                Edit
              </button>
            ) : null}
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
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onPickDay: (day: DateTime) => void;
};

export function MonthGridView({
  month,
  tasks,
  onToggleTask,
  onEditTask,
  onDeleteTask,
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
                    onEditTask={onEditTask}
                    onDeleteTask={onDeleteTask}
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
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onAddTaskForDay?: (day: DateTime) => void;
};

export function DayAgendaView({
  day,
  tasks,
  onToggleTask,
  onEditTask,
  onDeleteTask,
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
        <TaskDueList
          items={dayTasks}
          onToggle={onToggleTask}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
        />
      </div>
    </motion.div>
  );
}

type ThreeDayProps = {
  startDay: DateTime;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onPickDay: (day: DateTime) => void;
  onAddTaskForDay?: (day: DateTime) => void;
  onCreateTimedTask?: (start: DateTime, end: DateTime) => void;
  onQuickAddTimedTask?: (title: string, start: DateTime, end: DateTime) => void;
  onUpdateTaskSchedule?: (
    taskId: string,
    dueDate: Date,
    endDate?: Date,
  ) => void;
};

type WeekViewProps = {
  startDay: DateTime;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onPickDay: (day: DateTime) => void;
  onAddTaskForDay?: (day: DateTime) => void;
  onCreateTimedTask?: (start: DateTime, end: DateTime) => void;
  onQuickAddTimedTask?: (title: string, start: DateTime, end: DateTime) => void;
  onUpdateTaskSchedule?: (
    taskId: string,
    dueDate: Date,
    endDate?: Date,
  ) => void;
  onEditTask?: (task: Task) => void;
  dayCount?: number;
  anchorToWeekStart?: boolean;
};

type WeekDragSelection = {
  dayIso: string;
  day: DateTime;
  startMinuteOfDay: number;
  endMinuteOfDay: number;
};

type WeekQuickAddDraft = {
  start: DateTime;
  end: DateTime;
};

type WeekQuickAddAnchor = {
  left: number;
  top: number;
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

function minuteOfDayToClockLabel(minuteOfDay: number): string {
  if (minuteOfDay >= 24 * 60) return "12:00 AM";
  const clampedMinute = Math.max(0, minuteOfDay);
  const hour = Math.floor(clampedMinute / 60);
  const minute = clampedMinute % 60;
  return DateTime.fromObject({ hour, minute }).toFormat("h:mm a");
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
      Math.max(dragSelection.startMinuteOfDay, dragSelection.endMinuteOfDay) +
      15,
  };
}

function resolveCreateRangeFromDragSelection(selection: WeekDragSelection): {
  start: DateTime;
  end: DateTime;
} {
  const minMinute = Math.min(
    selection.startMinuteOfDay,
    selection.endMinuteOfDay,
  );
  const maxMinute = Math.max(
    selection.startMinuteOfDay,
    selection.endMinuteOfDay,
  );
  const start = selection.day.set({
    hour: Math.floor(minMinute / 60),
    minute: minMinute % 60,
    second: 0,
    millisecond: 0,
  });
  const endMinuteExclusive = Math.min(maxMinute + 15, 24 * 60 - 1);
  const end = selection.day.set({
    hour: Math.floor(endMinuteExclusive / 60),
    minute: endMinuteExclusive % 60,
    second: 0,
    millisecond: 0,
  });
  return { start, end };
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
  onToggleTask,
  onDeleteTask,
  onPickDay,
  onAddTaskForDay,
  onCreateTimedTask,
  onQuickAddTimedTask,
  onUpdateTaskSchedule,
  onEditTask,
  dayCount = 7,
  anchorToWeekStart = true,
}: WeekViewProps) {
  const { openMenu } = useContextMenu();
  const safeDayCount = Math.max(1, Math.min(14, dayCount));
  const rangeStart = anchorToWeekStart
    ? startDay.startOf("week")
    : startDay.startOf("day");
  const rangeEnd = rangeStart.plus({ days: safeDayCount - 1 }).endOf("day");
  const byDay = tasksByDueDateKeyInRange(
    tasks,
    rangeStart.startOf("day"),
    rangeEnd,
  );
  const days = Array.from({ length: safeDayCount }, (_, i) =>
    rangeStart.plus({ days: i }).startOf("day"),
  );
  const today = DateTime.local().startOf("day");
  const quarterSlots = Array.from({ length: 60 }, (_, i) => 7 * 60 + i * 15);
  const showWeekMeta = anchorToWeekStart && safeDayCount === 7;
  const [dragSelection, setDragSelection] = useState<WeekDragSelection | null>(
    null,
  );
  const [editInteraction, setEditInteraction] =
    useState<WeekEditInteraction | null>(null);
  const [editTarget, setEditTarget] = useState<WeekEditTarget | null>(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [quickAddDraft, setQuickAddDraft] = useState<WeekQuickAddDraft | null>(
    null,
  );
  const [quickAddAnchor, setQuickAddAnchor] =
    useState<WeekQuickAddAnchor | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const editPreviewRange = resolvePreviewRange(editInteraction, editTarget);
  const createPreviewRange = resolveCreatePreviewRange(dragSelection);
  const previewRange = editPreviewRange ?? createPreviewRange;

  const openTaskSheet = (task: Task) => {
    setSelectedTask(task);
    setBottomSheetOpen(true);
  };

  const closeTaskSheet = () => {
    setBottomSheetOpen(false);
    setSelectedTask(null);
  };

  const clearQuickAdd = () => {
    setQuickAddDraft(null);
    setQuickAddAnchor(null);
    setQuickAddTitle("");
  };

  const getWeekTaskContextMenuItems = (task: Task) => [
    ...(onEditTask
      ? [
          {
            id: `edit-${task.id}`,
            label: "Edit task…",
            onSelect: () => onEditTask(task),
          } as const,
        ]
      : []),
    {
      id: `toggle-${task.id}`,
      label: task.done ? "Mark not done" : "Mark done",
      onSelect: () => onToggleTask(task.id),
    },
    ...(onDeleteTask
      ? [
          {
            id: `delete-${task.id}`,
            label: "Delete",
            onSelect: () => onDeleteTask(task.id),
            destructive: true,
          } as const,
        ]
      : []),
  ];

  const resolveQuickAddAnchor = (clientX?: number, clientY?: number) => {
    if (typeof window === "undefined") {
      return { left: 360, top: 260 };
    }
    const rawX = clientX ?? window.innerWidth / 2;
    const rawY = clientY ?? window.innerHeight / 2;
    const width = Math.min(560, window.innerWidth * 0.92);
    const halfWidth = width / 2;
    const panelHeight = 220;
    const margin = 12;
    const left = Math.min(
      window.innerWidth - halfWidth - margin,
      Math.max(halfWidth + margin, rawX),
    );
    const top = Math.min(
      window.innerHeight - margin,
      Math.max(panelHeight + margin, rawY - 10),
    );
    return { left, top };
  };

  const finishCreateDrag = (clientX?: number, clientY?: number) => {
    if (!dragSelection) return;
    const range = resolveCreateRangeFromDragSelection(dragSelection);
    if (onCreateTimedTask) {
      setQuickAddDraft(range);
      setQuickAddAnchor(resolveQuickAddAnchor(clientX, clientY));
    } else {
      onPickDay(dragSelection.day);
    }
    setDragSelection(null);
  };

  useEffect(() => {
    if (!dragSelection && !editInteraction) return;
    const onMouseUp = (event: globalThis.MouseEvent) => {
      if (editInteraction && editTarget && onUpdateTaskSchedule) {
        const targetStart = slotDateTime(
          editTarget.day,
          editTarget.minuteOfDay,
        );
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
          const dueDate =
            dueDateCandidate > minStart ? minStart : dueDateCandidate;
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
        finishCreateDrag(event.clientX, event.clientY);
      }
      setEditInteraction(null);
      setEditTarget(null);
      setDragSelection(null);
    };
    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, [dragSelection, editInteraction, editTarget, onUpdateTaskSchedule]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {showWeekMeta ? `W${rangeStart.weekNumber}` : `${safeDayCount} Day View`}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {rangeStart.toFormat("d MMM")} - {rangeEnd.toFormat("d MMM yyyy")}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-zinc-200/70 bg-white/75 shadow-[0_8px_30px_rgba(15,23,42,0.06)] ring-1 ring-white/60 dark:border-white/15 dark:bg-zinc-900/45 dark:ring-white/10">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `74px repeat(${safeDayCount}, minmax(116px, 1fr))`,
            minWidth: `${74 + safeDayCount * 116}px`,
          }}
        >
          <div className="sticky top-0 z-30 border-b border-r border-zinc-200/80 bg-zinc-50/95 px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 backdrop-blur dark:border-white/10 dark:bg-zinc-900/95 dark:text-zinc-400">
            Time
          </div>
          {days.map((day, dayIndex) => {
            const key = day.toISODate() ?? "";
            const count = (byDay.get(key) ?? []).length;
            const isToday = day.hasSame(today, "day");
            return (
              <button
                key={key}
                type="button"
                onClick={() => onPickDay(day)}
                onContextMenu={(e) =>
                  openMenu(e, [
                    ...(onAddTaskForDay
                      ? [
                          {
                            id: `add-day-${key}`,
                            label: "Add task for this day…",
                            onSelect: () => onAddTaskForDay(day),
                          } as const,
                        ]
                      : []),
                    {
                      id: `open-day-${key}`,
                      label: "Open day view",
                      onSelect: () => onPickDay(day),
                    },
                  ])
                }
                className={`sticky top-0 z-30 border-b border-r border-zinc-200/80 px-2 py-2 text-left backdrop-blur transition-colors hover:bg-white/80 dark:border-white/10 dark:hover:bg-white/5 ${
                  isToday
                    ? "bg-sky-100/90 dark:bg-sky-900/60"
                    : dayIndex % 2 === 0
                      ? "bg-zinc-50/95 dark:bg-zinc-900/95"
                      : "bg-white/95 dark:bg-zinc-900/90"
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

          <div className="border-r border-zinc-200/80 bg-zinc-50/60 p-2 dark:border-white/10 dark:bg-zinc-900/35">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              All Day
            </p>
          </div>
          {days.map((day, dayIndex) => {
            const key = day.toISODate() ?? "";
            const allDayItems = (byDay.get(key) ?? []).filter((row) =>
              isDateOnlyDue(DateTime.fromJSDate(row.displayDueDate)),
            );
            return (
              <div
                key={`${key}-all-day`}
                className={`border-r border-zinc-200/80 p-1.5 dark:border-white/10 ${
                  dayIndex % 2 === 0
                    ? "bg-zinc-50/45 dark:bg-zinc-900/30"
                    : "bg-white/65 dark:bg-zinc-900/20"
                }`}
              >
                <div className="flex min-h-[44px] flex-col gap-1">
                  {allDayItems.slice(0, 2).map((row) => (
                    <button
                      key={row.rowKey}
                      type="button"
                      onClick={() => openTaskSheet(row.task)}
                      onContextMenu={(e) =>
                        openMenu(e, getWeekTaskContextMenuItems(row.task))
                      }
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
                onSlotContextMenu={(e, day, slotMinuteOfDay) => {
                  const start = day.startOf("day").plus({ minutes: slotMinuteOfDay });
                  const end = start.plus({ minutes: 15 });
                  openMenu(e, [
                    ...(onCreateTimedTask
                      ? [
                          {
                            id: `add-slot-${day.toISODate()}-${slotMinuteOfDay}`,
                            label: `Add task at ${start.toFormat("h:mm a")}…`,
                            onSelect: () => onCreateTimedTask(start, end),
                          } as const,
                        ]
                      : []),
                    {
                      id: `open-day-${day.toISODate()}`,
                      label: "Open day view",
                      onSelect: () => onPickDay(day),
                    },
                  ]);
                }}
                onEventContextMenu={(e, row) => {
                  openMenu(e, getWeekTaskContextMenuItems(row.task));
                }}
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
                    occurrenceOffsetMs:
                      displayStart.toMillis() - dueDate.toMillis(),
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
                onEventClick={(row) => openTaskSheet(row.task)}
                previewRange={previewRange}
              />
            ))}
          </LayoutGroup>
        </div>
      </div>
      {quickAddDraft ? (
        <div
          className="fixed z-50 w-[min(92vw,560px)] bg-white origin-top-left shadow-lg border border-zinc-200/80 p-4 -translate-x-1/2 -translate-y-full rounded-2xl "
          style={{
            left: quickAddAnchor?.left ?? undefined,
            top: quickAddAnchor?.top ?? undefined,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {quickAddDraft.start.toFormat("EEE d MMM")} ·{" "}
                {quickAddDraft.start.toFormat("h:mm a")}-
                {quickAddDraft.end.toFormat("h:mm a")}
              </p>
            </div>
            <button
              type="button"
              onClick={clearQuickAdd}
              className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-500/10 dark:text-zinc-400 dark:hover:bg-white/10"
            >
              <IoClose />
            </button>
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              placeholder="Task title..."
              className="min-w-0 flex-1 rounded-lg border border-zinc-300/80 bg-white/90 px-3 py-2 text-sm text-zinc-900 outline-none ring-sky-400/40 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-100"
            />
            <button
              type="button"
              disabled={!quickAddTitle.trim() || !onQuickAddTimedTask}
              onClick={() => {
                const title = quickAddTitle.trim();
                if (!title || !onQuickAddTimedTask) return;
                onQuickAddTimedTask(
                  title,
                  quickAddDraft.start,
                  quickAddDraft.end,
                );
                clearQuickAdd();
              }}
              className="rounded-lg flex flex-row items-center justify-center gap-2 bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              <IoAdd /> Quick Add
            </button>
            <button
              type="button"
              onClick={() => {
                onCreateTimedTask?.(quickAddDraft.start, quickAddDraft.end);
                clearQuickAdd();
              }}
              className="rounded-lg border flex flex-row items-center justify-center gap-2 border-zinc-300/80 bg-white/80 px-3 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              <IoDocument /> Editor
            </button>
          </div>
        </div>
      ) : null}
      <BottomSheet
        open={bottomSheetOpen}
        onClose={closeTaskSheet}
        defaultSnap="half"
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
                onToggleTask(selectedTask.id);
                closeTaskSheet();
              }}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              {selectedTask.done ? "Mark not done" : "Mark done"}
            </button>
            <button
              type="button"
              onClick={() => {
                onEditTask?.(selectedTask);
                closeTaskSheet();
              }}
              className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Edit
            </button>
            {onDeleteTask ? (
              <button
                type="button"
                onClick={() => {
                  onDeleteTask(selectedTask.id);
                  closeTaskSheet();
                }}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500"
              >
                Delete
              </button>
            ) : null}
          </div>
        ) : null}
      </BottomSheet>
    </div>
  );
}

type FragmentQuarterRowProps = {
  minuteOfDay: number;
  days: DateTime[];
  byDay: Map<string, CalendarTaskRow[]>;
  onSlotContextMenu: (
    e: ReactMouseEvent<HTMLDivElement>,
    day: DateTime,
    minuteOfDay: number,
  ) => void;
  onEventContextMenu: (
    e: ReactMouseEvent<HTMLButtonElement>,
    row: CalendarTaskRow,
  ) => void;
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
  onEventClick: (row: CalendarTaskRow) => void;
  previewRange: WeekPreviewRange | null;
};

function FragmentQuarterRow({
  minuteOfDay,
  days,
  byDay,
  onSlotContextMenu,
  onEventContextMenu,
  onSlotMouseDown,
  onSlotMouseEnter,
  onEventMoveStart,
  onEventResizeStart,
  onEventClick,
  previewRange,
}: FragmentQuarterRowProps) {
  const dragHoldTimeoutRef = useRef<number | null>(null);
  const consumedByDragRef = useRef(false);
  const HOLD_TO_DRAG_MS = 110;
  const SMOOTH_DRAG_SPRING = {
    type: "spring" as const,
    stiffness: 260,
    damping: 32,
    mass: 0.7,
  };
  const PREVIEW_ENTER_EASE = [0.22, 1, 0.36, 1] as const;

  const clearDragHoldTimeout = () => {
    if (dragHoldTimeoutRef.current == null) return;
    window.clearTimeout(dragHoldTimeoutRef.current);
    dragHoldTimeoutRef.current = null;
  };

  useEffect(() => () => clearDragHoldTimeout(), []);

  const isHourLine = minuteOfDay % 60 === 0;
  return (
    <>
      <div className="border-r border-zinc-200/80 bg-zinc-50/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-white/10 dark:bg-zinc-900/35 dark:text-zinc-400">
        {isHourLine ? minuteOfDayToLabel(minuteOfDay) : ""}
      </div>
      {days.map((day, dayIndex) => {
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
        const isPreviewStart =
          inPreview && previewRange?.startMinute === minuteOfDay;
        const isPreviewEnd =
          inPreview && previewRange?.endMinuteExclusive === minuteOfDay + 15;
        return (
          <div
            key={`${key}-${minuteOfDay}`}
            className={`relative min-h-[24px] border-r border-zinc-200/80 p-0 dark:border-white/10 ${
              dayIndex % 2 === 0
                ? "bg-zinc-50/35 dark:bg-zinc-900/20"
                : "bg-white/55 dark:bg-zinc-900/10"
            }`}
            onMouseDown={(e) => {
              if (e.button !== 0) return;
              onSlotMouseDown(day, minuteOfDay);
              e.preventDefault();
            }}
            onContextMenu={(e) => onSlotContextMenu(e, day, minuteOfDay)}
            onMouseEnter={() => onSlotMouseEnter(day, minuteOfDay)}
          >
            {inPreview ? (
              <motion.div
                layout
                initial={{ opacity: 0.5, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  layout: SMOOTH_DRAG_SPRING,
                  opacity: { duration: 0.14, ease: PREVIEW_ENTER_EASE },
                  y: { duration: 0.14, ease: PREVIEW_ENTER_EASE },
                }}
                className={`pointer-events-none absolute inset-x-0 top-0 bottom-0  border-sky-500/45 bg-sky-500/20 dark:border-sky-300/45 dark:bg-sky-400/20 ${
                  isPreviewStart ? "rounded-t-md" : ""
                } ${isPreviewEnd ? "rounded-b-md" : ""}`}
              >
                {isPreviewStart ? (
                  <motion.span
                    initial={{ opacity: 0, x: -2 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.12, ease: PREVIEW_ENTER_EASE }}
                    className="absolute left-1.5 top-0.5  px-1 py-px text-[9px] font-semibold leading-none text-sky-900 italic font-display dark:bg-sky-400/90 dark:text-zinc-950"
                  >
                    {minuteOfDayToClockLabel(previewRange.startMinute)}
                  </motion.span>
                ) : null}
                {isPreviewEnd ? (
                  <motion.span
                    initial={{ opacity: 0, x: -2 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.12, ease: PREVIEW_ENTER_EASE }}
                    className="absolute left-1.5 bottom-0.5 rounded  px-1 py-px text-[9px] font-semibold leading-none italic font-display text-sky-900 dark:bg-sky-400/90 dark:text-zinc-950"
                  >
                    {minuteOfDayToClockLabel(previewRange.endMinuteExclusive)}
                  </motion.span>
                ) : null}
              </motion.div>
            ) : null}
            <div className="flex h-full flex-col gap-0">
              {slotTasks.slice(0, 2).map((row) =>
                (() => {
                  const range = resolveRowMinuteRange(row);
                  const isStartSlot = range.startMinute === minuteOfDay;
                  const isEndSlot =
                    range.endMinuteExclusive === minuteOfDay + 15;
                  const categoryVisual = resolveCategoryVisual(
                    row.task.category,
                  );
                  return (
                    <motion.button
                      layout="position"
                      transition={SMOOTH_DRAG_SPRING}
                      key={row.rowKey}
                      type="button"
                      onMouseDown={(e) => {
                        if (e.button !== 0) return;
                        e.stopPropagation();
                        e.preventDefault();
                        consumedByDragRef.current = false;
                        clearDragHoldTimeout();
                        const releasePendingDrag = () => clearDragHoldTimeout();
                        window.addEventListener("mouseup", releasePendingDrag, {
                          once: true,
                        });
                        dragHoldTimeoutRef.current = window.setTimeout(() => {
                          consumedByDragRef.current = true;
                          onEventMoveStart(row, day, minuteOfDay);
                        }, HOLD_TO_DRAG_MS);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (consumedByDragRef.current) {
                          consumedByDragRef.current = false;
                          return;
                        }
                        onEventClick(row);
                      }}
                      onContextMenu={(e) => {
                        e.stopPropagation();
                        onEventContextMenu(e, row);
                      }}
                      className={`relative h-full min-h-[24px] w-full truncate border-l-2 border-l-zinc-400/35 px-1.5 py-0.5 text-left text-[10px] leading-tight shadow-sm ${
                        row.task.critical
                          ? "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-200"
                          : "bg-white/90 text-zinc-800 dark:bg-white/15 dark:text-zinc-100"
                      } ${isStartSlot ? "rounded-t-md" : ""} ${isEndSlot ? "rounded-b-md" : ""}`}
                      style={
                        row.task.critical
                          ? undefined
                          : categoryVisual
                            ? {
                                backgroundColor: categoryVisual.bg,
                                color: categoryVisual.text,
                                borderLeftColor: categoryVisual.accent,
                              }
                            : undefined
                      }
                      title={`${DateTime.fromJSDate(row.displayDueDate).toFormat("h:mm a")} ${row.task.title}`}
                    >
                      {isStartSlot ? (
                        <span
                          className="absolute inset-x-1 top-0 h-1 cursor-ns-resize rounded-full bg-transparent"
                          onMouseDown={(e) => {
                            if (e.button !== 0) return;
                            e.stopPropagation();
                            e.preventDefault();
                            onEventResizeStart(row, day, minuteOfDay, "start");
                          }}
                        />
                      ) : null}
                      {isStartSlot
                        ? `${categoryVisual?.icon ? `${categoryVisual.icon} ` : ""}${DateTime.fromJSDate(row.displayDueDate).toFormat("h:mm a")} ${row.task.title}`
                        : ""}
                      {isEndSlot ? (
                        <span
                          className="absolute inset-x-1 bottom-0 h-1 cursor-ns-resize rounded-full bg-transparent"
                          onMouseDown={(e) => {
                            if (e.button !== 0) return;
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
  onEditTask,
  onDeleteTask,
  onPickDay,
  onAddTaskForDay,
  onCreateTimedTask,
  onQuickAddTimedTask,
  onUpdateTaskSchedule,
}: ThreeDayProps) {
  return (
    <WeekView
      startDay={startDay}
      tasks={tasks}
      onToggleTask={onToggleTask}
      onDeleteTask={onDeleteTask}
      onPickDay={onPickDay}
      onAddTaskForDay={onAddTaskForDay}
      onCreateTimedTask={onCreateTimedTask}
      onQuickAddTimedTask={onQuickAddTimedTask}
      onUpdateTaskSchedule={onUpdateTaskSchedule}
      onEditTask={onEditTask}
      dayCount={3}
      anchorToWeekStart={false}
    />
  );
}

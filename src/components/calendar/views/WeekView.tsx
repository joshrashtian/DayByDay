import { LayoutGroup, motion } from "motion/react";
import { DateTime } from "luxon";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { IoAdd, IoClose, IoDocument } from "react-icons/io5";
import type { CalendarTaskRow, Task } from "@/types";
import { tasksByDueDateKeyInRange } from "../../../lib/calendarUtils";
import { getCategoryIconOption, renderCategoryIcon } from "../../../lib/categoryIcons";
import { getTaskKindVisual } from "../../../lib/taskKinds";
import { resolveCategoryVisual } from "../../../lib/taskCategories";
import { formatTaskDue } from "../../../lib/taskDates";
import { useContextMenu } from "../../../providers/ContextMenuProvider";
import BottomSheet from "../../../ui/BottomSheet";
import { completedCheckeredStyle } from "./_shared";

function categoryIconTitlePrefix(icon: string | undefined): string {
  if (!icon) return "";
  if (getCategoryIconOption(icon)) return "";
  return `${icon} `;
}

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

type WeekPreviewRange = {
  dayIso: string;
  startMinute: number;
  endMinuteExclusive: number;
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
            <div className="flex h-full flex-col gap-0.5">
              <div className="flex min-h-0 flex-1 gap-0.5">
                {slotTasks.slice(0, 2).map((row) =>
                (() => {
                  const hasOverlap = slotTasks.length > 1;
                  const range = resolveRowMinuteRange(row);
                  const isStartSlot = range.startMinute === minuteOfDay;
                  const isEndSlot =
                    range.endMinuteExclusive === minuteOfDay + 15;
                  const categoryVisual = resolveCategoryVisual(
                    row.task.category,
                  );
                  const kindVisual = getTaskKindVisual(row.task.kind);
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
                      className={`relative min-h-[24px] ${
                        hasOverlap ? "min-w-0 flex-1" : "w-full"
                      } truncate border-l-2 border-dashed border-l-zinc-400/35 px-1.5 py-0.5 text-left text-sm leading-tight ${
                        row.task.done
                          ? "bg-emerald-500/20 text-emerald-900 line-through dark:bg-emerald-500/25 dark:text-emerald-100"
                          : row.task.critical
                          ? "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-200"
                          : "text-zinc-800 dark:text-zinc-100"
                      } ${isStartSlot ? "rounded-t-md" : ""} ${isEndSlot ? "rounded-b-md shadow-xl" : ""}`}
                      style={
                        row.task.done
                          ? completedCheckeredStyle
                          : row.task.critical
                            ? undefined
                            : categoryVisual
                            ? {
                                backgroundColor: categoryVisual.bg,
                                color: categoryVisual.text,
                                borderLeftColor: categoryVisual.accent,
                              }
                            : row.task.kind === "event"
                              ? {
                                  backgroundColor: "rgba(14, 165, 233, 0.18)",
                                  borderLeftColor: "rgba(14, 165, 233, 0.65)",
                                }
                              : row.task.kind === "reminder"
                                ? {
                                    backgroundColor: "rgba(245, 158, 11, 0.18)",
                                    borderLeftColor: "rgba(245, 158, 11, 0.65)",
                                  }
                                : row.task.kind === "habit"
                                  ? {
                                      backgroundColor: "rgba(139, 92, 246, 0.18)",
                                      borderLeftColor: "rgba(139, 92, 246, 0.65)",
                                    }
                                  : row.task.kind === "class"
                                    ? {
                                        backgroundColor: "rgba(99, 102, 241, 0.2)",
                                        borderLeftColor: "rgba(99, 102, 241, 0.65)",
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
                      {isStartSlot ? (
                        <span className="inline-flex max-w-full items-center gap-1 truncate">
                          {categoryVisual?.icon ? (
                            <span className="inline-flex items-center">
                              {renderCategoryIcon(categoryVisual.icon)}
                            </span>
                          ) : null}
                          <span className="truncate">
                            {`${categoryIconTitlePrefix(
                              categoryVisual?.icon,
                            )}${DateTime.fromJSDate(row.displayDueDate).toFormat("h:mm a")} [${kindVisual.label}] ${row.task.title}`}
                          </span>
                        </span>
                      ) : null}
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
              </div>
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
  const quarterSlots = Array.from({ length: 96 }, (_, i) => i * 15);
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
          {showWeekMeta
            ? `W${rangeStart.weekNumber}`
            : `${safeDayCount} Day View`}
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
                  {count} {count === 1 ? "item" : "items"}
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
                        row.task.done
                          ? "bg-emerald-500/25 text-emerald-900 dark:bg-emerald-500/30 dark:text-emerald-100"
                          : row.task.critical
                          ? "bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-200"
                          : getTaskKindVisual(row.task.kind).subtleBadgeClass
                      }`}
                      style={row.task.done ? completedCheckeredStyle : undefined}
                    >
                      <span className={row.task.done ? "line-through" : ""}>
                        {row.task.title}
                      </span>
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
                  const start = day
                    .startOf("day")
                    .plus({ minutes: slotMinuteOfDay });
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
              <p>Type: {getTaskKindVisual(selectedTask.kind).label}</p>
              {selectedTask.block ? <p>Block: {selectedTask.block}</p> : null}
              {selectedTask.category ? (
                <p>Category: {selectedTask.category}</p>
              ) : null}
              {selectedTask.tags?.length ? (
                <p>Tags: {selectedTask.tags.join(", ")}</p>
              ) : null}
            </div>
            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/70">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Metadata
              </p>
              <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                {JSON.stringify(selectedTask, null, 2)}
              </pre>
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

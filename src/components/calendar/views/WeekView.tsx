import { LayoutGroup, motion } from "motion/react";
import { DateTime } from "luxon";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  IoAdd,
  IoClose,
  IoDocument,
  IoEllipseOutline,
  IoTimeOutline,
} from "react-icons/io5";
import type { CalendarTaskRow, CategoryConfig, Task } from "@/types";
import { tasksByDueDateKeyInRange } from "../../../lib/calendarUtils";
import {
  getCategoryIconOption,
  renderCategoryIcon,
} from "../../../lib/categoryIcons";
import { getTaskKindVisual } from "../../../lib/taskKinds";
import {
  resolveTaskCardVisual,
  type TaskCardVisual,
} from "../../../lib/taskCategories";
import { isIcsTask } from "../../../lib/icsTasks";
import { formatTaskDue } from "../../../lib/taskDates";
import { useContextMenu } from "../../../providers/ContextMenuProvider";
import { Tooltip } from "../../base/tooltip/tooltip";
import BottomSheet from "../../../ui/BottomSheet";
import { completedCheckeredStyle } from "./_shared";

function categoryIconTitlePrefix(icon: string | undefined): string {
  if (!icon) return "";
  if (getCategoryIconOption(icon)) return "";
  return `${icon} `;
}

function weekEventTooltipContent(
  task: Task,
  displayDueDate: Date,
): { title: string; description?: string } {
  const time = DateTime.fromJSDate(displayDueDate).toFormat("h:mm a");
  const kindVisual = getTaskKindVisual(task.kind);
  const title = [
    time,
    task.kind !== "task" ? kindVisual.label : null,
    task.title,
  ]
    .filter(Boolean)
    .join(" · ");

  const detailLines: string[] = [];
  if (task.critical) {
    detailLines.push("Critical");
  } else if (task.priority) {
    detailLines.push(
      `${task.priority.charAt(0).toUpperCase()}${task.priority.slice(1)} priority`,
    );
  }
  if (task.description?.trim()) {
    detailLines.push(task.description.trim());
  }

  return {
    title,
    description: detailLines.length > 0 ? detailLines.join("\n\n") : undefined,
  };
}

function weekAllDayEventTooltipContent(task: Task): {
  title: string;
  description?: string;
} {
  const kindVisual = getTaskKindVisual(task.kind);
  const title = [
    "All day",
    task.kind !== "task" ? kindVisual.label : null,
    task.title,
  ]
    .filter(Boolean)
    .join(" · ");

  const detailLines: string[] = [];
  if (task.critical) {
    detailLines.push("Critical");
  } else if (task.priority) {
    detailLines.push(
      `${task.priority.charAt(0).toUpperCase()}${task.priority.slice(1)} priority`,
    );
  }
  if (task.description?.trim()) {
    detailLines.push(task.description.trim());
  }

  return {
    title,
    description: detailLines.length > 0 ? detailLines.join("\n\n") : undefined,
  };
}

type WeekViewProps = {
  startDay: DateTime;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onDuplicateTask?: (taskId: string) => void;
  onPickDay: (day: DateTime) => void;
  onAddTaskForDay?: (day: DateTime) => void;
  onCreateTimedTask?: (
    start: DateTime,
    end: DateTime,
    category?: string,
  ) => void;
  onQuickAddTimedTask?: (
    title: string,
    start: DateTime,
    end: DateTime,
    category?: string,
  ) => void;
  onUpdateTaskSchedule?: (
    taskId: string,
    dueDate: Date,
    endDate?: Date,
  ) => void;
  onEditTask?: (task: Task) => void;
  categoryConfigs?: CategoryConfig[];
  dayCount?: number;
  anchorToWeekStart?: boolean;
};

type ThreeDayProps = {
  startDay: DateTime;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onDuplicateTask?: (taskId: string) => void;
  onPickDay: (day: DateTime) => void;
  onAddTaskForDay?: (day: DateTime) => void;
  onCreateTimedTask?: (
    start: DateTime,
    end: DateTime,
    category?: string,
  ) => void;
  onQuickAddTimedTask?: (
    title: string,
    start: DateTime,
    end: DateTime,
    category?: string,
  ) => void;
  onUpdateTaskSchedule?: (
    taskId: string,
    dueDate: Date,
    endDate?: Date,
  ) => void;
  categoryConfigs?: CategoryConfig[];
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

function quickAddClockLabel(dt: DateTime): string {
  return dt.minute === 0 ? dt.toFormat("h") : dt.toFormat("h:mm");
}

function quickAddTimeRangeLabel(start: DateTime, end: DateTime): string {
  const startMeridiem = start.toFormat("a");
  const endMeridiem = end.toFormat("a");
  const startLabel = quickAddClockLabel(start);
  const endLabel = quickAddClockLabel(end);
  if (startMeridiem === endMeridiem) {
    return `${startLabel}–${endLabel} ${endMeridiem}`;
  }
  return `${startLabel} ${startMeridiem}–${endLabel} ${endMeridiem}`;
}

function quickAddDurationLabel(start: DateTime, end: DateTime): string {
  const totalMinutes = Math.max(
    0,
    Math.round(end.diff(start, "minutes").minutes),
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) return `${hours} hr ${minutes} min`;
  if (hours) return `${hours} hr`;
  return `${minutes} min`;
}

type MinuteRange = {
  startMinute: number;
  endMinuteExclusive: number;
};

const MINUTES_PER_DAY = 24 * 60;
const SLOTS_PER_DAY = MINUTES_PER_DAY / 15;
const MIN_SLOT_HEIGHT_PX = 28;

const SMOOTH_DRAG_SPRING = {
  type: "spring" as const,
  stiffness: 260,
  damping: 32,
  mass: 0.7,
};

const PREVIEW_ENTER_EASE = [0.22, 1, 0.36, 1] as const;

function minuteRangeToPercent(range: MinuteRange): {
  top: number;
  height: number;
} {
  return {
    top: (range.startMinute / MINUTES_PER_DAY) * 100,
    height:
      ((range.endMinuteExclusive - range.startMinute) / MINUTES_PER_DAY) * 100,
  };
}

function rangesOverlap(a: MinuteRange, b: MinuteRange): boolean {
  return (
    a.startMinute < b.endMinuteExclusive && a.endMinuteExclusive > b.startMinute
  );
}

type TimedEventLayout = {
  row: CalendarTaskRow;
  range: MinuteRange;
  column: number;
  columnCount: number;
};

function layoutDayTimedEvents(rows: CalendarTaskRow[]): {
  layouts: TimedEventLayout[];
  hiddenCount: number;
} {
  const items = rows
    .filter((row) => !isDateOnlyDue(DateTime.fromJSDate(row.displayDueDate)))
    .map((row) => ({ row, range: resolveRowMinuteRange(row) }))
    .sort(
      (a, b) =>
        a.range.startMinute - b.range.startMinute ||
        a.row.rowKey.localeCompare(b.row.rowKey),
    );

  const placed: Array<{ range: MinuteRange; column: number }> = [];
  const layouts: TimedEventLayout[] = [];

  for (const item of items) {
    const overlappingPlaced = placed.filter((entry) =>
      rangesOverlap(item.range, entry.range),
    );
    const usedColumns = new Set(overlappingPlaced.map((entry) => entry.column));
    let column = 0;
    while (usedColumns.has(column) && column < 2) column += 1;
    if (column >= 2) continue;

    const concurrentCount = items.filter((other) =>
      rangesOverlap(item.range, other.range),
    ).length;

    placed.push({ range: item.range, column });
    layouts.push({
      row: item.row,
      range: item.range,
      column,
      columnCount: Math.min(2, concurrentCount),
    });
  }

  return {
    layouts,
    hiddenCount: items.length - layouts.length,
  };
}

function resolveEventBlockStyle(
  task: Task,
  visual: TaskCardVisual,
): CSSProperties | undefined {
  if (task.done) return completedCheckeredStyle;
  return {
    backgroundColor: visual.color,
    color: visual.onColor,
    borderLeftColor: visual.iconBg,
  };
}

function eventContentDensity(durationMinutes: number): {
  titleClass: string;
  showMeta: boolean;
} {
  if (durationMinutes <= 30) {
    return {
      titleClass: "line-clamp-1 text-[11px] font-semibold leading-tight",
      showMeta: false,
    };
  }
  if (durationMinutes <= 75) {
    return {
      titleClass: "line-clamp-2 text-xs font-semibold leading-snug",
      showMeta: false,
    };
  }
  return {
    titleClass: "line-clamp-3 text-xs font-semibold leading-snug",
    showMeta: true,
  };
}

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

type WeekDayTimeColumnProps = {
  day: DateTime;
  dayIndex: number;
  rows: CalendarTaskRow[];
  quarterSlots: number[];
  previewRange: WeekPreviewRange | null;
  disableTooltips: boolean;
  editingTaskId: string | null;
  isToday: boolean;
  nowMinuteOfDay: number | null;
  onSlotContextMenu: (
    e: ReactMouseEvent<HTMLDivElement>,
    minuteOfDay: number,
  ) => void;
  onEventContextMenu: (
    e: ReactMouseEvent<HTMLButtonElement>,
    row: CalendarTaskRow,
  ) => void;
  onSlotMouseDown: (minuteOfDay: number) => void;
  onSlotMouseEnter: (minuteOfDay: number) => void;
  onEventMoveStart: (row: CalendarTaskRow, minuteOfDay: number) => void;
  onEventResizeStart: (
    row: CalendarTaskRow,
    minuteOfDay: number,
    edge: "start" | "end",
  ) => void;
  onEventClick: (row: CalendarTaskRow) => void;
};

function WeekEventBlock({
  layout,
  disableTooltips,
  isBeingEdited,
  readOnly = false,
  onEventContextMenu,
  onEventMoveStart,
  onEventResizeStart,
  onEventClick,
}: {
  layout: TimedEventLayout;
  disableTooltips: boolean;
  isBeingEdited: boolean;
  readOnly?: boolean;
  onEventContextMenu: (
    e: ReactMouseEvent<HTMLButtonElement>,
    row: CalendarTaskRow,
  ) => void;
  onEventMoveStart: (row: CalendarTaskRow, minuteOfDay: number) => void;
  onEventResizeStart: (
    row: CalendarTaskRow,
    minuteOfDay: number,
    edge: "start" | "end",
  ) => void;
  onEventClick: (row: CalendarTaskRow) => void;
}) {
  const dragHoldTimeoutRef = useRef<number | null>(null);
  const consumedByDragRef = useRef(false);
  const HOLD_TO_DRAG_MS = 110;

  const clearDragHoldTimeout = () => {
    if (dragHoldTimeoutRef.current == null) return;
    window.clearTimeout(dragHoldTimeoutRef.current);
    dragHoldTimeoutRef.current = null;
  };

  useEffect(() => () => clearDragHoldTimeout(), []);

  if (isBeingEdited) return null;

  const { row, range, column, columnCount } = layout;
  const { top, height } = minuteRangeToPercent(range);
  const widthPct = 100 / columnCount;
  const leftPct = column * widthPct;
  const durationMinutes = range.endMinuteExclusive - range.startMinute;
  const categoryVisual = resolveTaskCardVisual(row.task);
  const kindVisual = getTaskKindVisual(row.task.kind);
  const tooltipContent = weekEventTooltipContent(row.task, row.displayDueDate);
  const density = eventContentDensity(durationMinutes);
  const timeLabel = DateTime.fromJSDate(row.displayDueDate).toFormat("h:mm a");
  const hasOverlap = columnCount > 1;

  return (
    <Tooltip
      title={tooltipContent.title}
      description={tooltipContent.description}
      placement="top"
      delay={400}
      isDisabled={disableTooltips}
    >
      <motion.button
        layout="position"
        transition={SMOOTH_DRAG_SPRING}
        type="button"
        onMouseDown={(e) => {
          if (readOnly) return;
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
            onEventMoveStart(row, range.startMinute);
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
        className={`pointer-events-auto absolute overflow-hidden rounded-md border-l-2 px-1.5 py-1 text-left shadow-sm ${
          hasOverlap ? "border-dashed border-l-zinc-400/35" : "border-solid"
        } ${readOnly ? "cursor-default" : ""} ${
          row.task.done
            ? "bg-emerald-500/20 text-emerald-900 line-through dark:bg-emerald-500/25 dark:text-emerald-100"
            : row.task.critical
              ? "border-l-red-500/70 bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-200"
              : "border-l-zinc-400/50 text-ink"
        }`}
        style={{
          top: `${top}%`,
          height: `${height}%`,
          left: `calc(${leftPct}% + 2px)`,
          width: `calc(${widthPct}% - 4px)`,
          ...resolveEventBlockStyle(row.task, categoryVisual),
        }}
      >
        <span
          className={`absolute inset-x-1 top-0 z-10 h-1.5 rounded-full bg-transparent ${
            readOnly ? "pointer-events-none" : "cursor-ns-resize"
          }`}
          onMouseDown={(e) => {
            if (readOnly) return;
            if (e.button !== 0) return;
            e.stopPropagation();
            e.preventDefault();
            onEventResizeStart(row, range.startMinute, "start");
          }}
        />
        <div className="flex h-full min-h-0 flex-col gap-0.5 overflow-hidden">
          <div className="flex shrink-0 items-center gap-1">
            <span className="inline-flex shrink-0 items-center">
              {categoryVisual.icon ? (
                renderCategoryIcon(categoryVisual.icon, "h-3 w-3")
              ) : (
                <IoEllipseOutline className="h-3 w-3" aria-hidden />
              )}
            </span>
            {row.task.kind !== "task" ? (
              <span
                className="inline-flex shrink-0 items-center opacity-80"
                aria-label={kindVisual.label}
              >
                <kindVisual.Icon className="h-3 w-3" aria-hidden />
              </span>
            ) : null}
            <span className="shrink-0 text-[10px] font-medium tabular-nums opacity-80">
              {timeLabel}
            </span>
          </div>
          <p className={density.titleClass}>
            {`${categoryIconTitlePrefix(categoryVisual?.icon)}${row.task.title}`}
          </p>
          {density.showMeta && row.task.description?.trim() ? (
            <p className="line-clamp-2 text-[10px] leading-snug opacity-75">
              {row.task.description.trim()}
            </p>
          ) : null}
          {density.showMeta && row.task.priority ? (
            <p className="text-[10px] capitalize leading-none opacity-70">
              {row.task.priority} priority
            </p>
          ) : null}
        </div>
        <span
          className={`absolute inset-x-1 bottom-0 z-10 h-1.5 rounded-full bg-transparent ${
            readOnly ? "pointer-events-none" : "cursor-ns-resize"
          }`}
          onMouseDown={(e) => {
            if (readOnly) return;
            if (e.button !== 0) return;
            e.stopPropagation();
            e.preventDefault();
            onEventResizeStart(row, range.endMinuteExclusive - 15, "end");
          }}
        />
      </motion.button>
    </Tooltip>
  );
}

function WeekDayTimeColumn({
  day,
  dayIndex,
  rows,
  quarterSlots,
  previewRange,
  disableTooltips,
  editingTaskId,
  isToday,
  nowMinuteOfDay,
  onSlotContextMenu,
  onEventContextMenu,
  onSlotMouseDown,
  onSlotMouseEnter,
  onEventMoveStart,
  onEventResizeStart,
  onEventClick,
}: WeekDayTimeColumnProps) {
  const key = day.toISODate() ?? "";
  const { layouts, hiddenCount } = layoutDayTimedEvents(rows);
  const dayPreview =
    previewRange?.dayIso === key
      ? minuteRangeToPercent({
          startMinute: previewRange.startMinute,
          endMinuteExclusive: previewRange.endMinuteExclusive,
        })
      : null;

  return (
    <div
      className={`relative min-h-0 border-r border-line/80 ${
        dayIndex % 2 === 0
          ? "bg-sunken/35 dark:bg-overlay"
          : "bg-surface/55 dark:bg-overlay"
      }`}
      style={{
        gridRow: `3 / span ${SLOTS_PER_DAY}`,
        gridColumn: dayIndex + 2,
      }}
    >
      <div className="absolute inset-0 grid grid-rows-96">
        {quarterSlots.map((minuteOfDay) => (
          <div
            key={`${key}-slot-${minuteOfDay}`}
            className="min-h-0"
            data-calendar-drop="timed"
            data-calendar-day={key}
            data-calendar-minute={minuteOfDay}
            onMouseDown={(e) => {
              if (e.button !== 0) return;
              onSlotMouseDown(minuteOfDay);
              e.preventDefault();
            }}
            onContextMenu={(e) => onSlotContextMenu(e, minuteOfDay)}
            onMouseEnter={() => onSlotMouseEnter(minuteOfDay)}
          />
        ))}
      </div>

      {isToday && nowMinuteOfDay !== null ? (
        <div
          className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
          style={{ top: `${(nowMinuteOfDay / MINUTES_PER_DAY) * 100}%` }}
        >
          <span className="ml-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          <span className="h-px flex-1 bg-blue-500/70" />
        </div>
      ) : null}

      <LayoutGroup id={`week-events-${key}`}>
        <div className="pointer-events-none absolute inset-0 z-10">
          {layouts.map((layout) => (
            <WeekEventBlock
              key={layout.row.rowKey}
              layout={layout}
              disableTooltips={disableTooltips}
              isBeingEdited={editingTaskId === layout.row.task.id}
              readOnly={isIcsTask(layout.row.task)}
              onEventContextMenu={onEventContextMenu}
              onEventMoveStart={onEventMoveStart}
              onEventResizeStart={onEventResizeStart}
              onEventClick={onEventClick}
            />
          ))}

          {dayPreview ? (
            <motion.div
              layout
              initial={{ opacity: 0.5, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                layout: SMOOTH_DRAG_SPRING,
                opacity: { duration: 0.14, ease: PREVIEW_ENTER_EASE },
                y: { duration: 0.14, ease: PREVIEW_ENTER_EASE },
              }}
              className="pointer-events-none absolute overflow-hidden rounded-md border border-sky-500/45 bg-sky-500/20 dark:border-sky-300/45 dark:bg-sky-400/20"
              style={{
                top: `${dayPreview.top}%`,
                height: `${dayPreview.height}%`,
                left: "2px",
                width: "calc(100% - 4px)",
              }}
            >
              {previewRange ? (
                <>
                  <span className="absolute left-1.5 top-0.5 px-1 py-px text-[9px] font-semibold leading-none text-sky-900 italic font-display">
                    {minuteOfDayToClockLabel(previewRange.startMinute)}
                  </span>
                  <span className="absolute bottom-0.5 left-1.5 px-1 py-px text-[9px] font-semibold leading-none text-sky-900 italic font-display">
                    {minuteOfDayToClockLabel(previewRange.endMinuteExclusive)}
                  </span>
                </>
              ) : null}
            </motion.div>
          ) : null}
        </div>
      </LayoutGroup>

      {hiddenCount > 0 ? (
        <p className="pointer-events-none absolute inset-x-1 bottom-1 z-20 rounded bg-surface/90 px-1 py-0.5 text-center text-[9px] font-medium text-muted shadow-sm dark:bg-overlay">
          +{hiddenCount} more
        </p>
      ) : null}
    </div>
  );
}

function WeekTimeLabelsColumn({ quarterSlots }: { quarterSlots: number[] }) {
  return (
    <div
      className="grid grid-rows-96 border-r border-line/80 bg-sunken/55 dark:bg-overlay"
      style={{ gridRow: `3 / span ${SLOTS_PER_DAY}`, gridColumn: 1 }}
    >
      {quarterSlots.map((minuteOfDay) => (
        <div
          key={`time-${minuteOfDay}`}
          className="flex min-h-0 items-start px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted"
        >
          {minuteOfDay % 60 === 0 ? minuteOfDayToLabel(minuteOfDay) : ""}
        </div>
      ))}
    </div>
  );
}

export function WeekView({
  startDay,
  tasks,
  onToggleTask,
  onDeleteTask,
  onDuplicateTask,
  onPickDay,
  onAddTaskForDay,
  onCreateTimedTask,
  onQuickAddTimedTask,
  onUpdateTaskSchedule,
  onEditTask,
  categoryConfigs = [],
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

  const getNowMinute = () => {
    const now = DateTime.local();
    return now.hour * 60 + now.minute;
  };
  const [nowMinuteOfDay, setNowMinuteOfDay] = useState<number>(getNowMinute);
  useEffect(() => {
    const tick = () => setNowMinuteOfDay(getNowMinute());
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
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
  const [quickAddCategory, setQuickAddCategory] = useState<
    string | undefined
  >(undefined);
  const editPreviewRange = resolvePreviewRange(editInteraction, editTarget);
  const createPreviewRange = resolveCreatePreviewRange(dragSelection);
  const previewRange = editPreviewRange ?? createPreviewRange;
  const disableTooltips = Boolean(dragSelection || editInteraction);
  const editingTaskId = editInteraction?.taskId ?? null;

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
    setQuickAddCategory(undefined);
  };

  const getWeekTaskContextMenuItems = (task: Task) => {
    if (isIcsTask(task)) {
      return [
        ...(onEditTask
          ? [
              {
                id: `view-${task.id}`,
                label: "View ICS event…",
                onSelect: () => onEditTask(task),
              } as const,
            ]
          : []),
        ...(onDeleteTask
          ? [
              {
                id: `delete-${task.id}`,
                label: "Remove import",
                onSelect: () => onDeleteTask(task.id),
                destructive: true,
              } as const,
            ]
          : []),
      ];
    }

    return [
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
      ...(onDuplicateTask
        ? [
            {
              id: `duplicate-${task.id}`,
              label: "Duplicate task",
              onSelect: () => onDuplicateTask(task.id),
            } as const,
          ]
        : []),
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
  };

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
      setQuickAddCategory(categoryConfigs[0]?.name);
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-auto rounded-none border-0 bg-surface/75 dark:bg-overlay [&>div]:min-h-full">
        <div
          className="grid min-h-full"
          style={{
            gridTemplateColumns: `74px repeat(${safeDayCount}, minmax(116px, 1fr))`,
            gridTemplateRows: `auto auto repeat(${SLOTS_PER_DAY}, minmax(${MIN_SLOT_HEIGHT_PX}px, 1fr))`,
            minWidth: `${74 + safeDayCount * 116}px`,
          }}
        >
          <div className="sticky top-0 z-30 border-b border-r border-line/80 bg-sunken/95 px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted backdrop-blur dark:bg-overlay">
            Time
          </div>
          {days.map((day, dayIndex) => {
            const key = day.toISODate() ?? "";
            const isToday = day.hasSame(today, "day");
            return (
              <button
                key={key}
                type="button"
                data-calendar-drop="all-day"
                data-calendar-day={key}
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
                className={`sticky top-0 z-30 border-b border-r border-line/80 px-2 py-2 text-center flex flex-col items-center backdrop-blur transition-colors hover:bg-surface/80 ${
                  dayIndex % 2 === 0
                    ? "bg-sunken/95 dark:bg-overlay"
                    : "bg-surface/95 dark:bg-overlay"
                }`}
              >
                <p
                  className={`text-[11px] font-display font-semibold uppercase tracking-wide  ${isToday ? "text-blue-600" : "text-muted"}`}
                >
                  {day.toFormat("ccc")}
                </p>
                <div
                  className={` w-8 h-8 rounded-full flex justify-center items-center ${isToday ? "bg-blue-600 text-white font-display" : "text-ink"}`}
                >
                  <p
                    className={`text-sm font-black flex items-center justify-center `}
                  >
                    {day.toFormat("d")}
                  </p>
                </div>
              </button>
            );
          })}

          <div className="border-r border-line/80 bg-sunken/60 p-2 dark:bg-overlay">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
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
                data-calendar-drop="all-day"
                data-calendar-day={key}
                className={`border-r border-line/80 p-1.5 ${
                  dayIndex % 2 === 0
                    ? "bg-sunken/45 dark:bg-overlay"
                    : "bg-surface/65 dark:bg-overlay"
                }`}
              >
                <div className="flex min-h-11 flex-col gap-1">
                  {allDayItems.slice(0, 2).map((row) => {
                    const tooltipContent = weekAllDayEventTooltipContent(
                      row.task,
                    );
                    return (
                      <Tooltip
                        key={row.rowKey}
                        title={tooltipContent.title}
                        description={tooltipContent.description}
                        placement="top"
                        delay={400}
                        isDisabled={disableTooltips}
                      >
                        <button
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
                                : getTaskKindVisual(row.task.kind)
                                    .subtleBadgeClass
                          }`}
                          style={
                            row.task.done ? completedCheckeredStyle : undefined
                          }
                        >
                          <span className={row.task.done ? "line-through" : ""}>
                            {row.task.title}
                          </span>
                        </button>
                      </Tooltip>
                    );
                  })}
                  {allDayItems.length > 2 ? (
                    <p className="text-[10px] text-muted">
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

          <WeekTimeLabelsColumn quarterSlots={quarterSlots} />
          {days.map((day, dayIndex) => {
            const key = day.toISODate() ?? "";
            return (
              <WeekDayTimeColumn
                key={`${key}-timed`}
                day={day}
                dayIndex={dayIndex}
                rows={byDay.get(key) ?? []}
                quarterSlots={quarterSlots}
                previewRange={previewRange}
                disableTooltips={disableTooltips}
                editingTaskId={editingTaskId}
                isToday={day.hasSame(today, "day")}
                nowMinuteOfDay={nowMinuteOfDay}
                onSlotContextMenu={(e, slotMinuteOfDay) => {
                  const start = day
                    .startOf("day")
                    .plus({ minutes: slotMinuteOfDay });
                  const end = start.plus({ minutes: 15 });
                  openMenu(e, [
                    ...(onCreateTimedTask
                      ? [
                          {
                            id: `add-slot-${key}-${slotMinuteOfDay}`,
                            label: `Add task at ${start.toFormat("h:mm a")}…`,
                            onSelect: () => onCreateTimedTask(start, end),
                          } as const,
                        ]
                      : []),
                    {
                      id: `open-day-${key}`,
                      label: "Open day view",
                      onSelect: () => onPickDay(day),
                    },
                  ]);
                }}
                onEventContextMenu={(e, row) => {
                  openMenu(e, getWeekTaskContextMenuItems(row.task));
                }}
                onSlotMouseDown={(slotMinuteOfDay) => {
                  if (editInteraction) return;
                  setDragSelection({
                    dayIso: key,
                    day,
                    startMinuteOfDay: slotMinuteOfDay,
                    endMinuteOfDay: slotMinuteOfDay,
                  });
                }}
                onSlotMouseEnter={(slotMinuteOfDay) => {
                  if (editInteraction) {
                    setEditTarget({ day, minuteOfDay: slotMinuteOfDay });
                    return;
                  }
                  if (!dragSelection) return;
                  setDragSelection((prev) => {
                    if (!prev) return prev;
                    if (key !== prev.dayIso) return prev;
                    return { ...prev, endMinuteOfDay: slotMinuteOfDay };
                  });
                }}
                onEventMoveStart={(row, slotMinuteOfDay) => {
                  if (isIcsTask(row.task)) return;
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
                onEventResizeStart={(row, slotMinuteOfDay, edge) => {
                  if (isIcsTask(row.task)) return;
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
              />
            );
          })}
        </div>
      </div>
      {quickAddDraft ? (
        <div
          className="fixed z-50 w-[min(92vw,420px)] origin-top-left rounded-2xl border border-line/80 bg-surface p-4 shadow-lg -translate-x-1/2 -translate-y-full"
          style={{
            left: quickAddAnchor?.left ?? undefined,
            top: quickAddAnchor?.top ?? undefined,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <IoTimeOutline className="text-base" />
              {quickAddDraft.start.toFormat("EEE")} ·{" "}
              {quickAddTimeRangeLabel(quickAddDraft.start, quickAddDraft.end)}{" "}
              · {quickAddDurationLabel(quickAddDraft.start, quickAddDraft.end)}
            </p>
            <button
              type="button"
              onClick={clearQuickAdd}
              className="rounded-md p-1 text-faint hover:bg-zinc-500/10 hover:text-muted"
            >
              <IoClose />
            </button>
          </div>
          <input
            type="text"
            autoFocus
            value={quickAddTitle}
            onChange={(e) => setQuickAddTitle(e.target.value)}
            placeholder="Task title..."
            className="mt-3 w-full rounded-lg border border-line-strong/80 bg-surface px-3 py-2.5 text-base font-semibold text-ink outline-none ring-sky-400/40 focus:ring-2 dark:bg-overlay"
          />
          {categoryConfigs.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              {categoryConfigs.map((config) => {
                const isSelected = quickAddCategory === config.name;
                return (
                  <button
                    key={config.name}
                    type="button"
                    title={config.name}
                    onClick={() =>
                      setQuickAddCategory(isSelected ? undefined : config.name)
                    }
                    className={`relative flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-105 ${
                      isSelected
                        ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900"
                        : ""
                    }`}
                    style={{
                      backgroundColor: config.color,
                      ...(isSelected
                        ? ({
                            "--tw-ring-color": config.color,
                          } as CSSProperties)
                        : {}),
                    }}
                  >
                    {isSelected ? (
                      <span className="h-2 w-2 rounded-full bg-surface" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
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
                  quickAddCategory,
                );
                clearQuickAdd();
              }}
              className="flex flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <IoAdd /> Quick Add
            </button>
            <button
              type="button"
              onClick={() => {
                onCreateTimedTask?.(
                  quickAddDraft.start,
                  quickAddDraft.end,
                  quickAddCategory,
                );
                clearQuickAdd();
              }}
              className="flex flex-row items-center justify-center gap-2 rounded-lg border border-line-strong/80 bg-surface px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-sunken dark:bg-overlay"
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
            <p className="text-xs text-muted">
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
            <div className="flex flex-col gap-1 text-sm text-muted">
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
            <div className="rounded-xl border border-line/80 bg-sunken/80 p-3 dark:bg-overlay">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Metadata
              </p>
              <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed text-muted">
                {JSON.stringify(selectedTask, null, 2)}
              </pre>
            </div>
            <button
              type="button"
              onClick={() => {
                onToggleTask(selectedTask.id);
                closeTaskSheet();
              }}
              className="rounded-xl border border-line bg-sunken px-4 py-2.5 text-sm font-semibold text-ink hover:bg-sunken"
            >
              {selectedTask.done ? "Mark not done" : "Mark done"}
            </button>
            <button
              type="button"
              onClick={() => {
                onEditTask?.(selectedTask);
                closeTaskSheet();
              }}
              className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink"
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
  onDuplicateTask,
  onPickDay,
  onAddTaskForDay,
  onCreateTimedTask,
  onQuickAddTimedTask,
  onUpdateTaskSchedule,
  categoryConfigs,
}: ThreeDayProps) {
  return (
    <WeekView
      startDay={startDay}
      tasks={tasks}
      onToggleTask={onToggleTask}
      onDeleteTask={onDeleteTask}
      onDuplicateTask={onDuplicateTask}
      onPickDay={onPickDay}
      onAddTaskForDay={onAddTaskForDay}
      onCreateTimedTask={onCreateTimedTask}
      onQuickAddTimedTask={onQuickAddTimedTask}
      onUpdateTaskSchedule={onUpdateTaskSchedule}
      onEditTask={onEditTask}
      categoryConfigs={categoryConfigs}
      dayCount={3}
      anchorToWeekStart={false}
    />
  );
}

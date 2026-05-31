import { LayoutGroup, motion } from "motion/react";
import { DateTime } from "luxon";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { IoAdd, IoClose, IoDocument } from "react-icons/io5";
import type { CalendarTaskRow, Task } from "@/types";
import { tasksByDueDateKeyInRange } from "../../../lib/calendarUtils";
import {
  getCategoryIconOption,
  renderCategoryIcon,
} from "../../../lib/categoryIcons";
import { getTaskKindVisual } from "../../../lib/taskKinds";
import { resolveCategoryVisual } from "../../../lib/taskCategories";
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
  categoryVisual: ReturnType<typeof resolveCategoryVisual>,
): CSSProperties | undefined {
  if (task.done) return completedCheckeredStyle;
  if (task.critical) return undefined;
  if (categoryVisual) {
    return {
      backgroundColor: categoryVisual.bg,
      color: categoryVisual.text,
      borderLeftColor: categoryVisual.accent,
    };
  }
  if (task.kind === "event") {
    return {
      backgroundColor: "rgba(14, 165, 233, 0.18)",
      borderLeftColor: "rgba(14, 165, 233, 0.65)",
    };
  }
  if (task.kind === "reminder") {
    return {
      backgroundColor: "rgba(245, 158, 11, 0.18)",
      borderLeftColor: "rgba(245, 158, 11, 0.65)",
    };
  }
  if (task.kind === "habit") {
    return {
      backgroundColor: "rgba(139, 92, 246, 0.18)",
      borderLeftColor: "rgba(139, 92, 246, 0.65)",
    };
  }
  if (task.kind === "class") {
    return {
      backgroundColor: "rgba(99, 102, 241, 0.2)",
      borderLeftColor: "rgba(99, 102, 241, 0.65)",
    };
  }
  if (task.kind === "ics") {
    return {
      backgroundColor: "rgba(20, 184, 166, 0.16)",
      borderLeftColor: "rgba(20, 184, 166, 0.7)",
    };
  }
  return undefined;
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
  const categoryVisual = resolveCategoryVisual(row.task.category);
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
          window.addEventListener("mouseup", releasePendingDrag, { once: true });
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
              : "border-l-zinc-400/50 text-zinc-800 dark:text-zinc-100"
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
            {categoryVisual?.icon ? (
              <span className="inline-flex shrink-0 items-center">
                {renderCategoryIcon(categoryVisual.icon, "h-3 w-3")}
              </span>
            ) : null}
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
            onEventResizeStart(
              row,
              range.endMinuteExclusive - 15,
              "end",
            );
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
      className={`relative min-h-0 border-r border-zinc-200/80 dark:border-white/10 ${
        dayIndex % 2 === 0
          ? "bg-zinc-50/35 dark:bg-zinc-900/20"
          : "bg-white/55 dark:bg-zinc-900/10"
      }`}
      style={{
        gridRow: `3 / span ${SLOTS_PER_DAY}`,
        gridColumn: dayIndex + 2,
      }}
    >
      <div className="absolute inset-0 grid grid-rows-[repeat(96,minmax(0,1fr))]">
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
                  <span className="absolute left-1.5 top-0.5 px-1 py-px text-[9px] font-semibold leading-none text-sky-900 italic font-display dark:text-zinc-950">
                    {minuteOfDayToClockLabel(previewRange.startMinute)}
                  </span>
                  <span className="absolute bottom-0.5 left-1.5 px-1 py-px text-[9px] font-semibold leading-none text-sky-900 italic font-display dark:text-zinc-950">
                    {minuteOfDayToClockLabel(previewRange.endMinuteExclusive)}
                  </span>
                </>
              ) : null}
            </motion.div>
          ) : null}
        </div>
      </LayoutGroup>

      {hiddenCount > 0 ? (
        <p className="pointer-events-none absolute inset-x-1 bottom-1 z-20 rounded bg-white/90 px-1 py-0.5 text-center text-[9px] font-medium text-zinc-500 shadow-sm dark:bg-zinc-900/90 dark:text-zinc-400">
          +{hiddenCount} more
        </p>
      ) : null}
    </div>
  );
}

function WeekTimeLabelsColumn({ quarterSlots }: { quarterSlots: number[] }) {
  return (
    <div
      className="grid grid-rows-[repeat(96,minmax(0,1fr))] border-r border-zinc-200/80 bg-zinc-50/55 dark:border-white/10 dark:bg-zinc-900/35"
      style={{ gridRow: `3 / span ${SLOTS_PER_DAY}`, gridColumn: 1 }}
    >
      {quarterSlots.map((minuteOfDay) => (
        <div
          key={`time-${minuteOfDay}`}
          className="flex min-h-0 items-start px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
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

      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-zinc-200/70 bg-white/75 shadow-[0_8px_30px_rgba(15,23,42,0.06)] ring-1 ring-white/60 dark:border-white/15 dark:bg-zinc-900/45 dark:ring-white/10 [&>div]:min-h-full">
        <div
          className="grid min-h-full"
          style={{
            gridTemplateColumns: `74px repeat(${safeDayCount}, minmax(116px, 1fr))`,
            gridTemplateRows: `auto auto repeat(${SLOTS_PER_DAY}, minmax(${MIN_SLOT_HEIGHT_PX}px, 1fr))`,
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
                data-calendar-drop="all-day"
                data-calendar-day={key}
                className={`border-r border-zinc-200/80 p-1.5 dark:border-white/10 ${
                  dayIndex % 2 === 0
                    ? "bg-zinc-50/45 dark:bg-zinc-900/30"
                    : "bg-white/65 dark:bg-zinc-900/20"
                }`}
              >
                <div className="flex min-h-[44px] flex-col gap-1">
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

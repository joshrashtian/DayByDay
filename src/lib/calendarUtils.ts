import { DateTime } from "luxon";
import type { CalendarTaskRow, Task } from "@/types";
import { advanceRecurrenceDate } from "./taskDates";

export type { CalendarTaskRow } from "@/types";

function combineDateAndTime(
  dateDay: DateTime,
  timeSource: DateTime,
): DateTime {
  return dateDay.set({
    hour: timeSource.hour,
    minute: timeSource.minute,
    second: timeSource.second,
    millisecond: timeSource.millisecond,
  });
}

export function collectOccurrencesInRange(
  task: Task,
  rangeStart: DateTime,
  rangeEnd: DateTime,
): { displayDueDate: Date; rowKey: string }[] {
  if (!task.dueDate) return [];

  const anchor = DateTime.fromJSDate(task.dueDate);
  const anchorDay = anchor.startOf("day");
  const start = rangeStart.startOf("day");
  const end = rangeEnd.endOf("day");

  if (!task.recurrence) {
    if (anchorDay < start || anchorDay > end) return [];
    const display = combineDateAndTime(anchorDay, anchor);
    return [{ displayDueDate: display.toJSDate(), rowKey: task.id }];
  }

  const recurrenceEndDay = task.recurrence.untilDate
    ? DateTime.fromJSDate(task.recurrence.untilDate).startOf("day")
    : null;
  const visibleEndDay =
    recurrenceEndDay && recurrenceEndDay < end ? recurrenceEndDay : end;

  let cursor = anchor;
  let safety = 0;
  while (cursor.startOf("day") < start && safety < 10000) {
    cursor = DateTime.fromJSDate(
      advanceRecurrenceDate(cursor.toJSDate(), task.recurrence),
    );
    safety++;
  }

  const out: { displayDueDate: Date; rowKey: string }[] = [];
  safety = 0;
  while (cursor.startOf("day") <= visibleEndDay && safety < 10000) {
    const iso = cursor.toISODate();
    if (iso) {
      out.push({
        displayDueDate: cursor.toJSDate(),
        rowKey: `${task.id}@${iso}`,
      });
    }
    cursor = DateTime.fromJSDate(
      advanceRecurrenceDate(cursor.toJSDate(), task.recurrence),
    );
    safety++;
  }
  return out;
}

export function tasksByDueDateKeyInRange(
  tasks: Task[],
  rangeStart: DateTime,
  rangeEnd: DateTime,
): Map<string, CalendarTaskRow[]> {
  const map = new Map<string, CalendarTaskRow[]>();
  for (const t of tasks) {
    for (const occ of collectOccurrencesInRange(t, rangeStart, rangeEnd)) {
      const key = DateTime.fromJSDate(occ.displayDueDate).toISODate();
      if (!key) continue;
      const row: CalendarTaskRow = {
        task: t,
        displayDueDate: occ.displayDueDate,
        rowKey: occ.rowKey,
      };
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
  }
  for (const list of map.values()) {
    list.sort(
      (a, b) =>
        DateTime.fromJSDate(a.displayDueDate).toMillis() -
        DateTime.fromJSDate(b.displayDueDate).toMillis(),
    );
  }
  return map;
}

/** Six rows × seven columns, starting at the week that contains the 1st of `month`. */
export function buildMonthGrid(month: DateTime): DateTime[][] {
  const start = month.startOf("month").startOf("week");
  const weeks: DateTime[][] = [];
  let d = start;
  for (let w = 0; w < 6; w++) {
    const row: DateTime[] = [];
    for (let i = 0; i < 7; i++) {
      row.push(d);
      d = d.plus({ days: 1 });
    }
    weeks.push(row);
  }
  return weeks;
}

export function weekdayLabelsShort(): string[] {
  const monday = DateTime.fromObject({ weekday: 1 });
  return Array.from({ length: 7 }, (_, i) =>
    monday.plus({ days: i }).toFormat("ccc"),
  );
}

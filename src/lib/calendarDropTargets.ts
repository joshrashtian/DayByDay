import { DateTime } from "luxon";

export type CalendarDropTarget =
  | { kind: "timed"; dayIso: string; minuteOfDay: number }
  | { kind: "all-day"; dayIso: string };

const DROP_ATTR = "data-calendar-drop";
const DROP_ACTIVE_CLASS = "calendar-drop-active";

export function resolveCalendarDropTarget(
  x: number,
  y: number,
): CalendarDropTarget | null {
  const el = document.elementFromPoint(x, y)?.closest(`[${DROP_ATTR}]`);
  if (!el || !(el instanceof HTMLElement)) return null;

  const kind = el.getAttribute(DROP_ATTR);
  const dayIso = el.getAttribute("data-calendar-day");
  if (!dayIso) return null;

  if (kind === "timed") {
    const minuteRaw = el.getAttribute("data-calendar-minute");
    const minuteOfDay = minuteRaw == null ? NaN : Number.parseInt(minuteRaw, 10);
    if (Number.isNaN(minuteOfDay)) return null;
    return { kind: "timed", dayIso, minuteOfDay };
  }

  if (kind === "all-day") {
    return { kind: "all-day", dayIso };
  }

  return null;
}

export function setActiveCalendarDropTarget(x: number, y: number) {
  clearActiveCalendarDropTarget();
  const target = resolveCalendarDropTarget(x, y);
  if (!target) return;

  const selector =
    target.kind === "timed"
      ? `[${DROP_ATTR}="timed"][data-calendar-day="${target.dayIso}"][data-calendar-minute="${target.minuteOfDay}"]`
      : `[${DROP_ATTR}="all-day"][data-calendar-day="${target.dayIso}"]`;

  document.querySelector(selector)?.classList.add(DROP_ACTIVE_CLASS);
}

export function clearActiveCalendarDropTarget() {
  document
    .querySelectorAll(`.${DROP_ACTIVE_CLASS}`)
    .forEach((el) => el.classList.remove(DROP_ACTIVE_CLASS));
}

export function scheduleDatesForDropTarget(
  target: CalendarDropTarget,
  existingDueDate?: Date,
  existingEndDate?: Date,
): { dueDate: Date; endDate?: Date } {
  const day = DateTime.fromISO(target.dayIso, { zone: "local" }).startOf("day");
  if (!day.isValid) {
    return { dueDate: new Date() };
  }

  if (target.kind === "all-day") {
    return { dueDate: day.endOf("day").toJSDate() };
  }

  const dueDate = day.plus({ minutes: target.minuteOfDay }).toJSDate();
  const durationMs =
    existingDueDate && existingEndDate && existingEndDate > existingDueDate
      ? existingEndDate.getTime() - existingDueDate.getTime()
      : 60 * 60 * 1000;

  return {
    dueDate,
    endDate: new Date(dueDate.getTime() + durationMs),
  };
}

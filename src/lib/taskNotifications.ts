import { DateTime } from "luxon";
import type { Task } from "@/types";
import type { NotificationItem } from "./sendNotification";

/** How long before a task's start time its reminder goes off. 0 = right at
 * the start time. */
export const REMINDER_LEAD_MINUTES = 5;

/** Only tasks starting within this window are queued; the hook re-syncs on an
 * interval, so later tasks are picked up as they come into range. */
const HORIZON_MS = 24 * 60 * 60_000;

/** Calendar "date-only" dues are stored as local 11:59 PM — they have no real
 * start time to remind about. */
function isDateOnly(due: Date): boolean {
  const dt = DateTime.fromJSDate(due);
  return dt.hour === 23 && dt.minute === 59;
}

/**
 * Builds the full reminder list for `tasks`: one per open task with a real
 * start time that hasn't started yet. Ids are stable (`task-<id>`), and a
 * reminder whose lead time already passed (e.g. the app was just opened) is
 * kept with its original `fire_at`, so Rust fires it once, immediately.
 */
export function buildTaskNotifications(
  tasks: Task[],
  now: Date = new Date(),
  leadMinutes: number = REMINDER_LEAD_MINUTES,
): NotificationItem[] {
  const nowMs = now.getTime();
  const items: NotificationItem[] = [];

  for (const task of tasks) {
    if (task.done || !task.dueDate || isDateOnly(task.dueDate)) continue;

    const startMs = task.dueDate.getTime();
    if (startMs <= nowMs || startMs - nowMs > HORIZON_MS) continue;

    const start = DateTime.fromJSDate(task.dueDate);
    const time = start.toLocaleString(DateTime.TIME_SIMPLE);
    const where = task.classLocation ? ` · ${task.classLocation}` : "";
    const when = leadMinutes === 0 ? `Starting now · ${time}` : `Starts at ${time}`;

    items.push({
      id: `task-${task.id}`,
      title: task.title,
      body: `${when}${where}`,
      fire_at: startMs - leadMinutes * 60_000,
    });
  }

  return items;
}

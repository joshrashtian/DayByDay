import type { Task } from "@/types";
import { formatTaskDue } from "./taskDates";

const DAY_LABELS: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};

/** Human-readable summary of a task's recurrence, e.g. "Repeats every 2 weeks on Mon, Wed". */
export function recurrenceLabel(task: Task): string | undefined {
  if (!task.recurrence) return undefined;
  const cadence =
    task.recurrence.frequency === "daily"
      ? task.recurrence.interval === 1
        ? "day"
        : "days"
      : task.recurrence.frequency === "weekly"
        ? task.recurrence.interval === 1
          ? "week"
          : "weeks"
        : task.recurrence.interval === 1
          ? "month"
          : "months";
  let base = `Repeats every ${task.recurrence.interval} ${cadence}`;
  if (
    task.recurrence.frequency === "weekly" &&
    task.recurrence.weekdays?.length
  ) {
    const onDays = task.recurrence.weekdays
      .map((day) => DAY_LABELS[day] ?? "")
      .filter(Boolean)
      .join(", ");
    if (onDays) base += ` on ${onDays}`;
  }
  if (!task.recurrence.untilDate) return base;
  return `${base}, until ${formatTaskDue(task.recurrence.untilDate)}`;
}

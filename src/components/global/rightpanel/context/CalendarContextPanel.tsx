import { useMemo } from "react";
import { DateTime } from "luxon";
import { tasksByDueDateKeyInRange } from "@/lib/calendarUtils";
import { useTasksStore } from "@/stores/tasksStore";
import { sidebarTokens } from "../../sidebar/sidebarTokens";
import { EmptyNote, PanelSection, TaskRow } from "./primitives";

/** How many days ahead the agenda looks, starting today. */
const AGENDA_DAYS = 7;

function dayHeading(day: DateTime): string {
  const today = DateTime.now().startOf("day");
  if (day.equals(today)) return "Today";
  if (day.equals(today.plus({ days: 1 }))) return "Tomorrow";
  return day.toFormat("cccc");
}

/** Calendar: a rolling agenda of the next week, recurrences expanded. */
export function CalendarContextPanel() {
  const tasks = useTasksStore((s) => s.tasks);

  const days = useMemo(() => {
    const start = DateTime.now().startOf("day");
    const end = start.plus({ days: AGENDA_DAYS - 1 });
    const byKey = tasksByDueDateKeyInRange(
      tasks.filter((t) => !t.done),
      start,
      end,
    );
    return Array.from({ length: AGENDA_DAYS }, (_, i) => {
      const day = start.plus({ days: i });
      return { day, rows: byKey.get(day.toISODate() ?? "") ?? [] };
    });
  }, [tasks]);

  const total = days.reduce((sum, d) => sum + d.rows.length, 0);

  return (
    <div>
      <PanelSection title={`Next ${AGENDA_DAYS} days`} aside={`${total}`}>
        {total === 0 ? (
          <EmptyNote>Nothing scheduled this week.</EmptyNote>
        ) : null}
      </PanelSection>
      {days.map(({ day, rows }) => (
        <section
          key={day.toISODate()}
          className={`border-t py-2.5 first:border-t-0 ${sidebarTokens.divider}`}
        >
          <header className="mb-1 flex items-baseline justify-between px-1.5">
            <h3
              className={`font-display text-xs font-semibold uppercase tracking-wide ${sidebarTokens.primaryText}`}
            >
              {dayHeading(day)}
            </h3>
            <span className={`text-[11px] tabular-nums ${sidebarTokens.mutedText}`}>
              {day.toFormat("MMM d")}
            </span>
          </header>
          {rows.length === 0 ? (
            <p className={`px-1.5 text-[11px] ${sidebarTokens.mutedText}`}>—</p>
          ) : (
            <ul className="space-y-0.5">
              {rows.map((row) => {
                const at = DateTime.fromJSDate(row.displayDueDate);
                const hasTime = at.hour !== 0 || at.minute !== 0;
                return (
                  <TaskRow
                    key={row.rowKey}
                    task={row.task}
                    when={hasTime ? at.toFormat("h:mm a") : "All day"}
                  />
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

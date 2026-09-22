import { useMemo } from "react";
import { isIcsTask } from "@/lib/icsTasks";
import { resolveCategoryVisual } from "@/lib/taskCategories";
import { isTaskDueToday, isTaskOverdue } from "@/lib/taskDates";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTasksStore } from "@/stores/tasksStore";
import { sidebarTokens } from "../../sidebar/sidebarTokens";
import { EmptyNote, PanelSection, StatTile, TaskList } from "./primitives";

/** Tasks: a scoreboard for the whole list plus the overdue queue. */
export function TasksContextPanel() {
  const tasks = useTasksStore((s) => s.tasks);
  // Subscribed so category colours update live when edited in settings.
  useSettingsStore((s) => s.categoryConfigs);

  const stats = useMemo(() => {
    const own = tasks.filter((t) => !isIcsTask(t));
    const open = own.filter((t) => !t.done);
    const overdue = open
      .filter((t) => isTaskOverdue(t.dueDate))
      .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime());
    const dueToday = open.filter((t) => isTaskDueToday(t.dueDate));
    const doneToday = own.filter(
      (t) =>
        t.done &&
        (isTaskDueToday(t.dueDate) || isTaskDueToday(t.lastCompletedAt)),
    );
    const critical = open.filter((t) => t.critical);

    const byCategory = new Map<string, number>();
    for (const t of open) {
      const key = t.category?.trim() || "Uncategorized";
      byCategory.set(key, (byCategory.get(key) ?? 0) + 1);
    }
    const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);

    return { open, overdue, dueToday, doneToday, critical, categories };
  }, [tasks]);

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-2 px-1.5">
        <StatTile label="Open" value={stats.open.length} />
        <StatTile
          label="Overdue"
          value={stats.overdue.length}
          accent={stats.overdue.length > 0}
        />
        <StatTile label="Due today" value={stats.dueToday.length} />
        <StatTile label="Done today" value={stats.doneToday.length} />
      </div>

      {stats.critical.length > 0 ? (
        <PanelSection title="Critical" aside={`${stats.critical.length}`}>
          <TaskList tasks={stats.critical} empty="" />
        </PanelSection>
      ) : null}

      <PanelSection title="Overdue" aside={`${stats.overdue.length}`}>
        <TaskList tasks={stats.overdue} empty="Nothing overdue." />
      </PanelSection>

      <PanelSection title="Open by category">
        {stats.categories.length === 0 ? (
          <EmptyNote>No open tasks.</EmptyNote>
        ) : (
          <ul className="space-y-0.5">
            {stats.categories.map(([name, count]) => {
              const visual = resolveCategoryVisual(
                name === "Uncategorized" ? undefined : name,
              );
              const share = Math.round((count / stats.open.length) * 100);
              return (
                <li key={name} className="px-1.5 py-1">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span
                      className={`flex min-w-0 items-center gap-1.5 text-xs font-semibold ${sidebarTokens.primaryText}`}
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: visual.color }}
                      />
                      <span className="truncate">{name}</span>
                    </span>
                    <span
                      className={`shrink-0 font-mono text-[10px] tabular-nums ${sidebarTokens.mutedText}`}
                    >
                      {count}
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-sunken">
                    <div
                      className="h-full duration-300 rounded-full"
                      style={{ width: `${share}%`, background: visual.color }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PanelSection>
    </div>
  );
}

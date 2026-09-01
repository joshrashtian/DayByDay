import { useMemo, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { TOOLKIT_PANELS } from "../lib/toolkitPanels";
import { useTasksStore } from "../stores/tasksStore";
import type { Task, UpdateTaskPayload } from "@/types";
import { normalizeRecurrenceWeekdays } from "../types/task";

const WEEK_DAYS = [
  { label: "Mon", dayIndex: 1 },
  { label: "Tue", dayIndex: 2 },
  { label: "Wed", dayIndex: 3 },
  { label: "Thu", dayIndex: 4 },
  { label: "Fri", dayIndex: 5 },
] as const;

function sanitizeInput(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function formatClock(date?: Date): string {
  if (!(date instanceof Date)) return "No time";
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTimeRange(start?: Date, end?: Date): string {
  if (!(start instanceof Date)) return "No time";
  if (!(end instanceof Date)) return formatClock(start);
  return `${formatClock(start)} - ${formatClock(end)}`;
}

function formatDateTimeLocalInput(date?: Date): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function parseDateTimeLocalInput(value: string): Date | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

function toUpdatePayload(
  task: Task,
  patch: Partial<UpdateTaskPayload>,
): UpdateTaskPayload {
  const classLocation =
    patch.metadata?.class?.location ??
    patch.classLocation ??
    task.metadata?.class?.location ??
    task.classLocation;
  const classGrade =
    patch.metadata?.class?.grade ??
    patch.classGrade ??
    task.metadata?.class?.grade ??
    task.classGrade;

  return {
    kind: "class",
    title: patch.title ?? task.title,
    dueDate: patch.dueDate,
    endDate: patch.endDate,
    priority: patch.priority ?? task.priority,
    critical: patch.critical ?? task.critical,
    block: patch.block ?? task.block,
    category: patch.category ?? task.category,
    description: patch.description ?? task.description,
    notes: patch.notes ?? task.notes,
    metadata:
      classLocation || classGrade
        ? {
            class: {
              ...(classLocation ? { location: classLocation } : {}),
              ...(classGrade ? { grade: classGrade } : {}),
            },
          }
        : undefined,
    classLocation: classLocation || undefined,
    classGrade: classGrade || undefined,
    tags: patch.tags ?? task.tags,
    recurrence: patch.recurrence ?? task.recurrence,
  };
}

function ClassesView() {
  const tasks = useTasksStore((state) => state.tasks);
  const updateTask = useTasksStore((state) => state.updateTask);
  const toggleTask = useTasksStore((state) => state.toggleTask);

  const classTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.kind === "class")
        .sort((a, b) => {
          const aTime = a.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
          const bTime = b.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
          return aTime - bTime;
        }),
    [tasks],
  );

  const weeklyClassTasks = useMemo(
    () =>
      classTasks.filter((task) => !task.done && task.dueDate instanceof Date),
    [classTasks],
  );

  const weeklyByDay = useMemo(() => {
    const byDaySeries = new Map<number, Map<string, Task>>();
    for (const day of WEEK_DAYS) byDaySeries.set(day.dayIndex, new Map());
    for (const task of weeklyClassTasks) {
      const recurrenceDays = normalizeRecurrenceWeekdays(
        task.recurrence?.weekdays,
      );
      const fallbackDay = task.dueDate!.getDay();
      const dayIndexes = recurrenceDays?.length ? recurrenceDays : [fallbackDay];
      const seriesKey = task.recurringSourceId ?? task.id;
      for (const dayIndex of dayIndexes) {
        const bucket = byDaySeries.get(dayIndex);
        if (!bucket) continue;
        const existing = bucket.get(seriesKey);
        if (!existing) {
          bucket.set(seriesKey, task);
          continue;
        }
        // Prefer the canonical recurring source over detached copies, then latest edit.
        const chooseCurrent =
          Boolean(task.recurrence) && !existing.recurrence
            ? true
            : task.recurrence === existing.recurrence
              ? task.updatedAt > existing.updatedAt
              : false;
        if (chooseCurrent) bucket.set(seriesKey, task);
      }
    }
    const byDay = new Map<number, Task[]>();
    for (const [dayIndex, seriesMap] of byDaySeries.entries()) {
      const list = [...seriesMap.values()];
      list.sort((a, b) => {
        const aTime = a.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bTime = b.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      });
      byDay.set(dayIndex, list);
    }
    return byDay;
  }, [weeklyClassTasks]);

  const weeklyScheduledCount = useMemo(
    () =>
      WEEK_DAYS.reduce(
        (total, day) => total + (weeklyByDay.get(day.dayIndex)?.length ?? 0),
        0,
      ),
    [weeklyByDay],
  );

  const onSaveClassTask = (task: Task, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextTitle = sanitizeInput(String(formData.get("title") ?? ""));
    if (!nextTitle) return;

    const nextCategory = sanitizeInput(String(formData.get("course") ?? ""));
    const nextDueDate = parseDateTimeLocalInput(
      String(formData.get("dueDate") ?? ""),
    );
    const nextLocation = sanitizeInput(String(formData.get("location") ?? ""));
    const nextGrade = sanitizeInput(String(formData.get("grade") ?? ""));

    let nextEndDate: Date | undefined = task.endDate;
    if (nextDueDate) {
      if (task.dueDate && task.endDate && task.endDate > task.dueDate) {
        const durationMs = task.endDate.getTime() - task.dueDate.getTime();
        nextEndDate = new Date(nextDueDate.getTime() + durationMs);
      }
    } else {
      nextEndDate = undefined;
    }

    updateTask(
      task.id,
      toUpdatePayload(task, {
        title: nextTitle,
        category: nextCategory || undefined,
        dueDate: nextDueDate,
        endDate: nextEndDate,
        classLocation: nextLocation || undefined,
        classGrade: nextGrade || undefined,
      }),
    );
  };

  return (
    <>
      <h1 className="font-quantify text-3xl text-ink sm:text-4xl">
        Classes
      </h1>

      <section className="mt-6 w-full rounded-2xl border border-line/80 bg-surface/80 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] dark:bg-overlay">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">
            Your School Schedule
          </h2>
          <span className="rounded-full border border-line bg-sunken px-2.5 py-1 text-xs font-semibold text-muted">
            {weeklyScheduledCount} scheduled
          </span>
        </div>

        {weeklyScheduledCount ? (
          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
            {WEEK_DAYS.map((day) => {
              const dayTasks = weeklyByDay.get(day.dayIndex) ?? [];
              return (
                <div
                  key={day.label}
                  className="-skew-x-12 rounded-xl border border-sky-100 bg-sky-50/60 p-3 dark:border-sky-900/30 dark:bg-sky-950/20"
                >
                  <p className="skew-x-12 text-[11px] font-quantify font-semibold uppercase tracking-[0.14em] text-muted">
                    {day.label}
                  </p>
                  {dayTasks.length ? (
                    <ul className="mt-2 skew-x-12 space-y-2">
                      {dayTasks.slice(0, 4).map((task) => {
                        return (
                          <li
                            key={task.id}
                            className="-skew-x-12 rounded-lg border border-line/80 bg-surface/95 p-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] dark:bg-overlay"
                          >
                            <p className="skew-x-12 truncate text-xs font-semibold text-ink">
                              {task.title}
                            </p>
                            {task.metadata?.class?.location ||
                            task.classLocation ? (
                              <p className="mt-0.5 skew-x-12 truncate text-[10px] text-muted">
                                {task.metadata?.class?.location ??
                                  task.classLocation}
                              </p>
                            ) : null}
                            <div className="mt-1.5 flex skew-x-12 flex-wrap items-center gap-1.5">
                              <p className="whitespace-nowrap text-[11px] font-semibold text-blue-600 dark:text-blue-300">
                                {formatTimeRange(task.dueDate, task.endDate)}
                              </p>
                              {task.metadata?.class?.grade ||
                              task.classGrade ? (
                                <span className="inline-flex shrink-0 items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/20 dark:text-blue-200">
                                  {task.metadata?.class?.grade ??
                                    task.classGrade}
                                </span>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                      {dayTasks.length > 4 ? (
                        <li className="skew-x-12 text-[10px] font-medium text-muted">
                          +{dayTasks.length - 4} more
                        </li>
                      ) : null}
                    </ul>
                  ) : (
                    <p className="mt-3 skew-x-12 text-[11px] italic text-faint">
                      No classes
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            No scheduled class tasks yet. Assign due dates to your class tasks
            to place them in the weekly calendar.
          </p>
        )}
      </section>

      <section className="mt-5 w-full rounded-2xl border border-line/80 bg-surface/70 p-5 dark:bg-overlay">
        <h2 className="text-lg font-semibold text-ink">
          Edit Class Tasks
        </h2>

        {classTasks.length ? (
          <div className="mt-4 space-y-3">
            {classTasks.map((task) => {
              return (
                <form
                  key={task.id}
                  onSubmit={(event) => onSaveClassTask(task, event)}
                  className="rounded-xl border border-line/80 bg-surface/80 p-3 dark:bg-overlay"
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    <input
                      name="title"
                      defaultValue={task.title}
                      placeholder="Class task title"
                      className="rounded-lg border border-line-strong/80 bg-surface px-2.5 py-1.5 text-xs text-ink outline-none transition focus:border-zinc-500"
                    />
                    <input
                      name="course"
                      defaultValue={task.category ?? ""}
                      placeholder="Course / class name"
                      className="rounded-lg border border-line-strong/80 bg-surface px-2.5 py-1.5 text-xs text-ink outline-none transition focus:border-zinc-500"
                    />
                    <input
                      name="dueDate"
                      type="datetime-local"
                      defaultValue={formatDateTimeLocalInput(task.dueDate)}
                      className="rounded-lg border border-line-strong/80 bg-surface px-2.5 py-1.5 text-xs text-ink outline-none transition focus:border-zinc-500"
                    />
                    <input
                      name="location"
                      defaultValue={
                        task.metadata?.class?.location ?? task.classLocation ?? ""
                      }
                      placeholder="Location"
                      className="rounded-lg border border-line-strong/80 bg-surface px-2.5 py-1.5 text-xs text-ink outline-none transition focus:border-zinc-500"
                    />
                    <input
                      name="grade"
                      defaultValue={
                        task.metadata?.class?.grade ?? task.classGrade ?? ""
                      }
                      placeholder="Grade"
                      className="rounded-lg border border-line-strong/80 bg-surface px-2.5 py-1.5 text-xs text-ink outline-none transition focus:border-zinc-500"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[11px] text-muted">
                      {task.done ? "Completed" : "Open"} •{" "}
                      {task.dueDate
                        ? `${task.dueDate.toLocaleDateString()} ${formatClock(task.dueDate)}`
                        : "No schedule"}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className="rounded-md border border-line-strong px-2 py-1 text-[11px] font-semibold text-muted transition hover:bg-sunken"
                      >
                        {task.done ? "Mark Open" : "Mark Done"}
                      </button>
                      <button
                        type="submit"
                        className="rounded-md bg-ink px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-ink"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            No class tasks yet. Create a task with type `class` and it will
            appear here and on the calendar.
          </p>
        )}
      </section>
    </>
  );
}

export default function ToolkitWindowScreen() {
  const { panelId } = useParams();
  const selectedPanel = TOOLKIT_PANELS.find((panel) => panel.id === panelId);

  if (!selectedPanel) {
    return (
      <main className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-5xl flex-col px-3 pb-24 pt-20 sm:px-6 sm:pt-24 lg:px-8">
        <h1 className="font-quantify text-3xl text-ink sm:text-4xl">
          Panel Not Found
        </h1>
        <p className="mt-3 text-base text-muted">
          This panel is not currently part of Toolkit.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-5xl flex-col px-3 pb-24 pt-20 sm:px-6 sm:pt-24 lg:px-8">
      {selectedPanel.id === "classes" ? <ClassesView /> : null}
      {selectedPanel.id !== "classes" ? (
        <>
          <h1 className="font-quantify text-3xl text-ink sm:text-4xl">
            {selectedPanel.label}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted">
            {selectedPanel.description}
          </p>
          <div className="mt-6 w-full rounded-2xl border border-dashed border-line-strong/80 bg-sunken/80 p-5 dark:bg-overlay">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Coming Soon
            </p>
            <p className="mt-2 text-sm text-muted">
              This dedicated panel is reserved for first-party features we add
              in the app.
            </p>
          </div>
        </>
      ) : null}
    </main>
  );
}

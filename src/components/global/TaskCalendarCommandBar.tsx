import { useMemo, useState, type FormEvent } from "react";
import { DateTime } from "luxon";
import { useLocation, useNavigate } from "react-router-dom";
import { IoArrowUp } from "react-icons/io5";
import { useShallow } from "zustand/react/shallow";
import { parseTaskChatInput } from "../tasks/functions/parseTokens";
import { useTasksStore } from "../../stores/tasksStore";

type Mode = "task" | "calendar";
type Feedback = { tone: "neutral" | "success" | "error"; text: string };

function parseCalendarDayArg(
  raw: string,
  fallback: DateTime,
): DateTime | undefined {
  const v = raw.trim().toLowerCase();
  if (!v) return undefined;
  if (v === "today") return DateTime.local().startOf("day");
  if (v === "tomorrow")
    return DateTime.local().plus({ days: 1 }).startOf("day");
  if (v === "yesterday")
    return DateTime.local().minus({ days: 1 }).startOf("day");

  const iso = DateTime.fromISO(v, { zone: "local" }).startOf("day");
  if (iso.isValid) return iso;

  const md = DateTime.fromFormat(v, "M/d", { zone: "local" });
  if (md.isValid) {
    let withYear = md.set({ year: fallback.year }).startOf("day");
    if (withYear < fallback.startOf("day"))
      withYear = withYear.plus({ years: 1 });
    return withYear;
  }

  return undefined;
}

function includesNormalized(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.trim().toLowerCase());
}

export function TaskCalendarCommandBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [raw, setRaw] = useState("");
  const [feedback, setFeedback] = useState<Feedback>({
    tone: "neutral",
    text: "Type a task or command. Use /help.",
  });

  const mode: Mode | null = useMemo(() => {
    if (location.pathname.startsWith("/calendar")) return "calendar";
    if (location.pathname.startsWith("/tasks")) return "task";
    return null;
  }, [location.pathname]);

  const { tasks, addTask, toggleTask, removeTask } = useTasksStore(
    useShallow((s) => ({
      tasks: s.tasks,
      addTask: s.addTask,
      toggleTask: s.toggleTask,
      removeTask: s.removeTask,
    })),
  );

  const calendarDay = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const dayParam = params.get("day");
    const day = dayParam
      ? DateTime.fromISO(dayParam, { zone: "local" }).startOf("day")
      : DateTime.local().startOf("day");
    return day.isValid ? day : DateTime.local().startOf("day");
  }, [location.search]);

  const taskParsePreview = useMemo(() => {
    const input = raw.trim();
    if (!input || input.startsWith("/")) return null;
    return parseTaskChatInput(input);
  }, [raw]);

  if (!mode) return null;

  const setCalendarDay = (nextDay: DateTime) => {
    const params = new URLSearchParams(location.search);
    params.set(
      "day",
      nextDay.toISODate() ?? DateTime.local().toISODate() ?? "",
    );
    navigate(
      {
        pathname: "/calendar",
        search: `?${params.toString()}`,
      },
      { replace: true },
    );
  };

  const submitTask = (input: string) => {
    const parsed = parseTaskChatInput(input);
    if (!parsed.title.trim()) {
      setFeedback({ tone: "error", text: "Task title is missing." });
      return;
    }
    if (parsed.hints.some((h) => h.partial)) {
      setFeedback({ tone: "error", text: "Finish the partial token first." });
      return;
    }

    const fallbackDueDate =
      mode === "calendar" && !parsed.dueDate
        ? calendarDay.endOf("day").toJSDate()
        : undefined;

    addTask({
      title: parsed.title.trim(),
      ...(parsed.priority ? { priority: parsed.priority } : {}),
      ...(parsed.critical ? { critical: true } : {}),
      ...(parsed.block ? { block: parsed.block } : {}),
      ...(parsed.category ? { category: parsed.category } : {}),
      ...(parsed.tags ? { tags: parsed.tags } : {}),
      ...(parsed.dueDate ? { dueDate: parsed.dueDate } : {}),
      ...(parsed.endDate ? { endDate: parsed.endDate } : {}),
      ...(fallbackDueDate ? { dueDate: fallbackDueDate } : {}),
    });

    setFeedback({
      tone: "success",
      text:
        mode === "calendar" && !parsed.dueDate
          ? `Task added for ${calendarDay.toFormat("ccc, d MMM")} (end of day).`
          : "Task added.",
    });
    setRaw("");
  };

  const findTaskIdByQuery = (
    query: string,
    onlyDone: boolean | null,
  ): string | undefined => {
    const q = query.trim().toLowerCase();
    if (!q) return undefined;
    return tasks.find((task) => {
      if (onlyDone === true && !task.done) return false;
      if (onlyDone === false && task.done) return false;
      return includesNormalized(task.title, q);
    })?.id;
  };

  const runCommand = (input: string) => {
    const body = input.slice(1).trim();
    if (!body) {
      setFeedback({ tone: "error", text: "Command is empty. Try /help." });
      return;
    }

    const [head] = body.split(/\s+/, 1);
    const command = head.toLowerCase();
    const arg = body.slice(head.length).trim();

    if (command === "help") {
      setFeedback({
        tone: "neutral",
        text:
          mode === "calendar"
            ? "Commands: /done <task>, /undo <task>, /delete <task>, /day <today|tomorrow|YYYY-MM-DD>, /next, /prev"
            : "Commands: /done <task>, /undo <task>, /delete <task>",
      });
      return;
    }

    if (command === "done") {
      const id = findTaskIdByQuery(arg, false);
      if (!id) {
        setFeedback({ tone: "error", text: "No unfinished task matched." });
        return;
      }
      toggleTask(id);
      setFeedback({ tone: "success", text: "Marked task done." });
      setRaw("");
      return;
    }

    if (command === "undo") {
      const id = findTaskIdByQuery(arg, true);
      if (!id) {
        setFeedback({ tone: "error", text: "No completed task matched." });
        return;
      }
      toggleTask(id);
      setFeedback({ tone: "success", text: "Marked task as not done." });
      setRaw("");
      return;
    }

    if (command === "delete" || command === "remove") {
      const id = findTaskIdByQuery(arg, null);
      if (!id) {
        setFeedback({ tone: "error", text: "No task matched for deletion." });
        return;
      }
      removeTask(id);
      setFeedback({ tone: "success", text: "Task deleted." });
      setRaw("");
      return;
    }

    if (
      command === "day" ||
      command === "today" ||
      command === "next" ||
      command === "prev"
    ) {
      if (mode !== "calendar") {
        setFeedback({
          tone: "error",
          text: "Calendar commands only work on Calendar.",
        });
        return;
      }
      if (command === "today") {
        setCalendarDay(DateTime.local().startOf("day"));
        setFeedback({ tone: "success", text: "Moved to today." });
        setRaw("");
        return;
      }
      if (command === "next") {
        setCalendarDay(calendarDay.plus({ days: 1 }).startOf("day"));
        setFeedback({ tone: "success", text: "Moved to next day." });
        setRaw("");
        return;
      }
      if (command === "prev") {
        setCalendarDay(calendarDay.minus({ days: 1 }).startOf("day"));
        setFeedback({ tone: "success", text: "Moved to previous day." });
        setRaw("");
        return;
      }

      const nextDay = parseCalendarDayArg(arg, calendarDay);
      if (!nextDay) {
        setFeedback({
          tone: "error",
          text: "Could not parse day. Use today, tomorrow, or YYYY-MM-DD.",
        });
        return;
      }
      setCalendarDay(nextDay);
      setFeedback({
        tone: "success",
        text: `Moved to ${nextDay.toFormat("cccc, d MMM yyyy")}.`,
      });
      setRaw("");
      return;
    }

    setFeedback({ tone: "error", text: `Unknown command: /${command}` });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const input = raw.trim();
    if (!input) return;
    if (input.startsWith("/")) runCommand(input);
    else submitTask(input);
  };

  return (
    <div className="pointer-events-none fixed bottom-3 left-1/2 z-50 w-[min(92vw,760px)] -translate-x-1/2">
      <form
        onSubmit={onSubmit}
        className="pointer-events-auto rounded-2xl border border-zinc-200/90 bg-white/90 p-2 shadow-[0_8px_36px_rgba(15,15,15,0.14)] ring-1 ring-black/5 backdrop-blur-xl dark:border-zinc-700/70 dark:bg-zinc-900/90 dark:ring-white/10"
      >
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            {mode}
          </span>
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={
              mode === "calendar"
                ? "Type task or command... (/day today, /next)"
                : "Type task or command... (/done, /delete)"
            }
            className="min-w-0 flex-1 bg-transparent px-1.5 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            aria-label="Global command input"
          />
          <button
            type="submit"
            disabled={
              !raw.trim() ||
              (!raw.trim().startsWith("/") &&
                Boolean(taskParsePreview?.hints.some((h) => h.partial)))
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            aria-label="Submit command"
          >
            <IoArrowUp className="h-4 w-4" />
          </button>
        </div>
        {taskParsePreview?.hints.length ? (
          <div className="flex flex-wrap gap-1.5 px-2 pb-1 pt-1">
            {taskParsePreview.hints.map((hint, i) => (
              <span
                key={`${hint.key}-${i}-${hint.label}`}
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  hint.partial
                    ? "border border-amber-400/80 bg-amber-100/70 text-amber-900 dark:border-amber-500/60 dark:bg-amber-500/10 dark:text-amber-200"
                    : "border border-zinc-300/80 bg-zinc-100/70 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-200"
                }`}
              >
                {hint.label}
              </span>
            ))}
          </div>
        ) : null}
        <p
          className={`px-2 pb-0.5 pt-1 font-display text-xs ${
            feedback.tone === "error"
              ? "text-rose-600 dark:text-rose-300"
              : feedback.tone === "success"
                ? "text-emerald-600 dark:text-emerald-300"
                : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {feedback.text}
        </p>
      </form>
    </div>
  );
}

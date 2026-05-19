import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { DateTime } from "luxon";
import { useLocation, useNavigate } from "react-router-dom";
import { IoArrowUp } from "react-icons/io5";
import { useShallow } from "zustand/react/shallow";
import { parseTaskChatInput } from "../tasks/functions/parseTokens";
import { useTasksStore } from "../../stores/tasksStore";
import { getActiveBlockNameAt } from "../../lib/taskBlocks";
import {
  parseCalendarDayArg,
  includesNormalized,
} from "./commandbar/calendarCommands";
import {
  extractInlineCategoryQuery,
  formatCategoryToken,
  parseCategoryPartialLabel,
  sanitizeCategoryValue,
} from "./commandbar/categoryHelpers";
import { CategoryPicker } from "./commandbar/CategoryPicker";

type Mode = "task" | "calendar";
type Feedback = { tone: "neutral" | "success" | "error"; text: string };

export function TaskCalendarCommandBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [raw, setRaw] = useState("");
  const [manualMode, setManualMode] = useState<Mode | null>(null);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [highlightedCategoryIndex, setHighlightedCategoryIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>({
    tone: "neutral",
    text: "Type a task or command. Use /help.",
  });

  const routeMode: Mode = useMemo(() => {
    if (location.pathname.startsWith("/calendar")) return "calendar";
    return "task";
  }, [location.pathname]);
  const mode: Mode = manualMode ?? routeMode;

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

  const knownCategories = useMemo(() => {
    const byLower = new Map<string, string>();
    for (const task of tasks) {
      const c = task.category?.trim();
      if (!c) continue;
      if (!byLower.has(c.toLowerCase())) byLower.set(c.toLowerCase(), c);
    }
    return [...byLower.values()].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [tasks]);

  const activeCategoryQuery = useMemo(() => {
    const inline = extractInlineCategoryQuery(raw);
    if (inline !== null) return inline;

    const hint = taskParsePreview?.hints.find(
      (h) => h.key === "category" && h.partial,
    );
    if (!hint) return null;
    return parseCategoryPartialLabel(hint.label);
  }, [raw, taskParsePreview]);

  const categorySuggestions = useMemo(() => {
    if (activeCategoryQuery === null) return [];
    const query = sanitizeCategoryValue(activeCategoryQuery);
    if (!query) return knownCategories.slice(0, 6);
    return knownCategories
      .filter((c) => c.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6);
  }, [knownCategories, activeCategoryQuery]);

  const categoryOptionRows = useMemo(() => {
    const rows: Array<{ label: string; value: string; isCreate?: boolean }> =
      [];
    const draftValue = sanitizeCategoryValue(categoryDraft);
    const hasExactMatch = draftValue
      ? categorySuggestions.some(
          (c) => c.toLowerCase() === draftValue.toLowerCase(),
        )
      : false;
    if (draftValue && !hasExactMatch) {
      rows.push({
        label: `Use "${draftValue}"`,
        value: draftValue,
        isCreate: true,
      });
    }
    rows.push(...categorySuggestions.map((c) => ({ label: c, value: c })));
    return rows;
  }, [categorySuggestions, categoryDraft]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.shiftKey || event.altKey) return;
      if (event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    setManualMode(null);
  }, [location.pathname]);

  useEffect(() => {
    if (activeCategoryQuery === null) return;
    setCategoryDraft(sanitizeCategoryValue(activeCategoryQuery));
  }, [activeCategoryQuery]);

  useEffect(() => {
    if (!categoryOptionRows.length) {
      setHighlightedCategoryIndex(-1);
      return;
    }
    setHighlightedCategoryIndex((prev) =>
      prev >= 0 && prev < categoryOptionRows.length ? prev : 0,
    );
  }, [categoryOptionRows]);

  const setCalendarDay = (nextDay: DateTime) => {
    const params = new URLSearchParams(location.search);
    params.set(
      "day",
      nextDay.toISODate() ?? DateTime.local().toISODate() ?? "",
    );
    navigate(
      { pathname: "/calendar", search: `?${params.toString()}` },
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
    const effectiveDueDate = parsed.dueDate ?? fallbackDueDate;
    const blockMinuteSource = effectiveDueDate ?? new Date();
    const minuteOfDay =
      blockMinuteSource.getHours() * 60 + blockMinuteSource.getMinutes();
    const autoBlockName = getActiveBlockNameAt(minuteOfDay);

    addTask({
      title: parsed.title.trim(),
      ...(parsed.priority ? { priority: parsed.priority } : {}),
      ...(parsed.critical ? { critical: true } : {}),
      ...(parsed.block
        ? { block: parsed.block }
        : autoBlockName
          ? { block: autoBlockName }
          : {}),
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
        text: "Commands: /done <task>, /undo <task>, /delete <task>, /day <today|tomorrow|YYYY-MM-DD>, /next, /prev. Time: @9am or @9am-11am",
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

  const modes: { id: Mode; label: string }[] = [
    { id: "task", label: "Task" },
    { id: "calendar", label: "Calendar" },
  ];

  const selectMode = (nextMode: Mode) => {
    setManualMode(nextMode);
  };

  const applyCategoryToken = (value: string) => {
    const token = formatCategoryToken(value);
    if (!token) return;

    setRaw((prev) => {
      const replaceTail =
        /@@(?:"[^"]*"?|'[^']*'?|\u201c[^"]*\u201d?|\u2018[^']*\u2019?|[^\s]*)$/;
      const maybeReplaced = prev.replace(replaceTail, token);
      if (maybeReplaced !== prev) return `${maybeReplaced} `;
      const spacer = prev.trimEnd().length > 0 ? " " : "";
      return `${prev.trimEnd()}${spacer}${token} `;
    });
    inputRef.current?.focus();
  };

  const onMainInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (activeCategoryQuery === null || !categoryOptionRows.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedCategoryIndex(
        Math.min(highlightedCategoryIndex + 1, categoryOptionRows.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedCategoryIndex(
        Math.max(highlightedCategoryIndex - 1, 0),
      );
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const option =
        categoryOptionRows[highlightedCategoryIndex] ?? categoryOptionRows[0];
      if (!option) return;
      setCategoryDraft(option.value);
      applyCategoryToken(option.value);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const option =
        categoryOptionRows[highlightedCategoryIndex] ?? categoryOptionRows[0];
      if (option) applyCategoryToken(option.value);
    }
  };

  return (
    <div className="pointer-events-none fixed bottom-3 left-1/2 z-50 w-[min(92vw,760px)] -translate-x-1/2">
      <form
        onSubmit={onSubmit}
        className="pointer-events-auto relative -skew-x-12 bg-white/90 p-2 px-6 shadow-[0_8px_36px_rgba(15,15,15,0.14)] ring-1 ring-black/5 backdrop-blur-xl dark:border-zinc-700/70 dark:bg-zinc-900/90 dark:ring-white/10"
      >
        {activeCategoryQuery !== null ? (
          <CategoryPicker
            categoryDraft={categoryDraft}
            setCategoryDraft={setCategoryDraft}
            categoryOptionRows={categoryOptionRows}
            highlightedCategoryIndex={highlightedCategoryIndex}
            setHighlightedCategoryIndex={setHighlightedCategoryIndex}
            applyCategoryToken={applyCategoryToken}
          />
        ) : null}
        <div className="flex skew-x-12 items-center gap-2">
          <div className="group/mode relative">
            <button
              type="button"
              className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              aria-haspopup="menu"
              aria-label="Select command mode"
            >
              {mode}
            </button>
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 flex min-w-max -translate-x-1/2 translate-y-0 flex-col gap-1 opacity-0 transition-all duration-200 group-hover/mode:pointer-events-auto group-hover/mode:translate-y-0 group-hover/mode:opacity-100 group-focus-within/mode:pointer-events-auto group-focus-within/mode:translate-y-0 group-focus-within/mode:opacity-100">
              {modes.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => selectMode(m.id)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide shadow-sm transition-colors ${
                    mode === m.id
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                      : "border-zinc-200 bg-white/95 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/95 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                  aria-current={mode === m.id ? "true" : undefined}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <input
            ref={inputRef}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onKeyDown={onMainInputKeyDown}
            placeholder="Type task or command... (@9am, @9am-11am, /day today, /done)"
            className="min-w-0 flex-1 font-eudoxus font-bold bg-transparent px-1.5 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
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

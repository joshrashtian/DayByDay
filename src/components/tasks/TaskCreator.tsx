import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { IoArrowUp, IoChevronDown, IoPencil, IoWarning } from "react-icons/io5";
import { parseDueLocalInput } from "../../lib/taskDates";
import type { AddTaskPayload, TaskPriority } from "../../types/task";
import { parseTaskChatInput } from "./functions/parseTokens";
import { motion } from "motion/react";

type Props = {
  onAdd: (payload: AddTaskPayload) => void;
  variant?: "default" | "chatDock";

  onOpenFullForm?: () => void;
};

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function TaskCreator({
  onAdd,
  variant = "default",
  onOpenFullForm,
}: Props) {
  const [title, setTitle] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [dueLocal, setDueLocal] = useState("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [critical, setCritical] = useState(false);
  const [category, setCategory] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isChatDock = variant === "chatDock";

  const chatParse = useMemo(
    () => (isChatDock ? parseTaskChatInput(title) : null),
    [isChatDock, title],
  );

  const adjustTextareaHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 200);
    el.style.height = `${Math.max(next, 48)}px`;
  };

  useEffect(() => {
    if (isChatDock) adjustTextareaHeight();
  }, [title, isChatDock]);

  const commitTask = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    if (isChatDock) {
      const parsed = parseTaskChatInput(trimmed);
      if (!parsed.title.trim() || parsed.hints.some((h) => h.partial)) return;
      onAdd({
        title: parsed.title.trim(),
        ...(parsed.priority ? { priority: parsed.priority } : {}),
        ...(parsed.critical ? { critical: true } : {}),
        ...(parsed.category ? { category: parsed.category } : {}),
        ...(parsed.dueDate ? { dueDate: parsed.dueDate } : {}),
      });
    } else {
      const dueDate = parseDueLocalInput(dueLocal);
      const cat = category.trim();
      onAdd({
        title: trimmed,
        ...(dueDate ? { dueDate } : {}),
        ...(priority ? { priority } : {}),
        ...(critical ? { critical } : {}),
        ...(cat ? { category: cat } : {}),
      });
    }
    setTitle("");
    setDueLocal("");
    setPriority("");
    setCritical(false);
    setCategory("");
    if (isChatDock) {
      textareaRef.current?.focus();
      requestAnimationFrame(() => adjustTextareaHeight());
    } else {
      inputRef.current?.focus();
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    commitTask();
  };

  const onChatKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commitTask();
    }
  };

  const shellClass = isChatDock
    ? "max-w-screen w-full rounded-[1.75rem] border border-zinc-200/90 bg-white/90 shadow-[0_8px_44px_rgba(15,15,15,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/5 backdrop-blur-xl backdrop-saturate-150 dark:border-zinc-600/50 dark:bg-zinc-900/90 dark:shadow-[0_12px_48px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] dark:ring-white/10"
    : "max-w-screen w-full rounded-2xl border border-white/70 bg-white/45 shadow-[0_4px_24px_rgba(15,15,15,0.06),inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-white/30 backdrop-blur-xl backdrop-saturate-150 dark:border-white/15 dark:bg-zinc-900/35 dark:shadow-[0_4px_28px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] dark:ring-white/10";

  return (
    <div className={shellClass}>
      <form
        onSubmit={submit}
        className={isChatDock ? "p-2.5 pl-4" : "p-2 pl-3"}
      >
        <div className={`flex gap-2 ${isChatDock ? "items-start" : ""}`}>
          {isChatDock ? (
            <div className="min-w-0 flex-1">
              <textarea
                ref={textareaRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={onChatKeyDown}
                rows={1}
                placeholder="What needs to get done?"
                autoComplete="off"
                onInput={adjustTextareaHeight}
                className="min-h-12 max-h-[200px] w-full resize-none bg-transparent py-2.5 text-base leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                aria-label="New task"
              />
              {chatParse && chatParse.hints.length > 0 ? (
                <div
                  className="flex flex-wrap gap-1.5 pb-1 pt-0.5"
                  aria-live="polite"
                >
                  {chatParse.hints.map((h, i) => (
                    <motion.span
                      key={`${i}-${h.key}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        ease: "easeInOut",
                        delay: i * 0.1,
                      }}
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold font-display tracking-wide ${
                        h.partial
                          ? "border-dashed text-amber-900 "
                          : "text-zinc-800 dark:text-zinc-100"
                      }`}
                    >
                      {h.label.split("").map((char, j) => (
                        <motion.span
                          key={`${i}-${h.key}-${j}-${char}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.5,
                            ease: "easeInOut",
                          }}
                        >
                          {char}
                        </motion.span>
                      ))}
                    </motion.span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs doing?"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent py-2 text-lg text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              aria-label="New task title"
            />
          )}
          {isChatDock ? (
            <>
              <button
                type="submit"
                disabled={
                  !title.trim() ||
                  !chatParse?.title.trim() ||
                  chatParse.hints.some((h) => h.partial)
                }
                aria-label="Add task"
                className="mb-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-opacity enabled:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-white dark:text-zinc-900 dark:enabled:hover:bg-zinc-100"
              >
                <IoArrowUp className="h-5 w-5" aria-hidden />
              </button>
              {onOpenFullForm ? (
                <button
                  type="button"
                  onClick={onOpenFullForm}
                  aria-label="Open full task form"
                  className="mb-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-300/90 bg-white/80 text-zinc-800 transition-colors hover:bg-white dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  <IoPencil className="h-5 w-5" aria-hidden />
                </button>
              ) : null}
            </>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              {onOpenFullForm ? (
                <button
                  type="button"
                  onClick={onOpenFullForm}
                  className="rounded-xl border border-zinc-300/80 bg-white/50 px-3 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-white dark:border-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  Full form
                </button>
              ) : null}
              <button
                type="submit"
                disabled={!title.trim()}
                className="rounded-xl bg-zinc-900/90 px-4 py-2 text-sm font-semibold text-white transition-opacity enabled:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-35 dark:bg-white/90 dark:text-zinc-900 dark:enabled:hover:bg-white"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {!isChatDock ? (
          <>
            <div className="mt-2">
              <label htmlFor="task-category" className="sr-only">
                Category — used when you search the list
              </label>
              <input
                id="task-category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category (optional — matched by task search)"
                autoComplete="off"
                className="w-full rounded-xl border border-zinc-300/50 bg-white/40 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400/40 dark:border-zinc-600/60 dark:bg-zinc-950/30 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-white/40 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
            >
              <IoChevronDown
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                aria-hidden
              />
              {expanded ? "Hide details" : "Due & priority"}
            </button>

            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="space-y-3 border-t border-white/50 pt-3 dark:border-white/10">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="task-due"
                      className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
                    >
                      Due
                    </label>
                    <input
                      id="task-due"
                      type="datetime-local"
                      value={dueLocal}
                      onChange={(e) => setDueLocal(e.target.value)}
                      className="rounded-xl border border-zinc-300/80 bg-white/60 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400/50 dark:border-zinc-600 dark:bg-zinc-950/50 dark:text-zinc-100 dark:focus:border-zinc-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Priority
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setPriority("")}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                          priority === ""
                            ? "border-zinc-800 bg-zinc-800 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                            : "border-zinc-300/80 bg-white/50 text-zinc-700 hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-950/40 dark:text-zinc-300 dark:hover:border-zinc-500"
                        }`}
                      >
                        None
                      </button>
                      {PRIORITIES.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setPriority(value)}
                          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                            priority === value
                              ? value === "high"
                                ? "border-rose-500/60 bg-rose-500/20 text-rose-900 dark:text-rose-100"
                                : value === "medium"
                                  ? "border-amber-500/60 bg-amber-500/20 text-amber-900 dark:text-amber-100"
                                  : "border-slate-500/50 bg-slate-500/15 text-slate-800 dark:text-slate-200"
                              : "border-zinc-300/80 bg-white/50 text-zinc-700 hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-950/40 dark:text-zinc-300 dark:hover:border-zinc-500"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCritical(!critical)}
                        className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
                      >
                        <IoWarning
                          className={`h-4 w-4 ${critical ? "text-red-500" : "text-zinc-500"}`}
                        />{" "}
                        {critical ? "Critical Event" : "Not Critical"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </form>
    </div>
  );
}

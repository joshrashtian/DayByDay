import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  IoCalendarOutline,
  IoClose,
  IoDocumentTextOutline,
  IoWarning,
} from "react-icons/io5";
import { parseDueLocalInput } from "../../lib/taskDates";
import {
  type AddTaskPayload,
  parseTagsInput,
  type RecurrenceFrequency,
  type TaskPriority,
} from "../../types/task";
import { motion } from "motion/react";

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const fieldLabel =
  "text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400";
const inputClass =
  "w-full rounded-xl border border-zinc-300/80 bg-white/80 px-3 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/30 dark:border-zinc-600 dark:bg-zinc-950/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/25";

type Props = {
  onAdd: (payload: AddTaskPayload) => void;
  onAddAnother: (payload: AddTaskPayload) => void;
  onDismiss?: () => void;
};

type SectionId = "basics" | "events" | "notes";

type RecurrenceChoice = "none" | RecurrenceFrequency;

const RECURRENCE_OPTIONS: { value: RecurrenceChoice; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function TaskCreatorPopupForm({
  onAdd,
  onAddAnother,
  onDismiss,
}: Props) {
  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [dueLocal, setDueLocal] = useState("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [critical, setCritical] = useState(false);
  const [recurrenceChoice, setRecurrenceChoice] =
    useState<RecurrenceChoice>("none");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [section, setSection] = useState<SectionId>("basics");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => titleRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, []);

  const buildPayload = (): AddTaskPayload | null => {
    const trimmed = title.trim();
    if (!trimmed) return null;
    const dueDate = parseDueLocalInput(dueLocal);
    const cat = category.trim();
    const tags = parseTagsInput(tagsInput);
    const desc = description.trim();
    const n = notes.trim();
    const recurrence =
      dueDate && recurrenceChoice !== "none"
        ? {
            frequency: recurrenceChoice,
            interval: Math.max(1, Math.min(365, recurrenceInterval || 1)),
          }
        : undefined;
    return {
      title: trimmed,
      ...(dueDate ? { dueDate } : {}),
      ...(priority ? { priority } : {}),
      ...(critical ? { critical: true } : {}),
      ...(cat ? { category: cat } : {}),
      ...(tags ? { tags } : {}),
      ...(desc ? { description: desc } : {}),
      ...(n ? { notes: n } : {}),
      ...(recurrence ? { recurrence } : {}),
    };
  };

  const resetForm = () => {
    setTitle("");
    setTagsInput("");
    setCategory("");
    setDescription("");
    setNotes("");
    setDueLocal("");
    setPriority("");
    setCritical(false);
    setRecurrenceChoice("none");
    setRecurrenceInterval(1);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) return;
    onAdd(payload);
  };

  const handleAddAnother = () => {
    const payload = buildPayload();
    if (!payload) return;
    onAddAnother(payload);
    resetForm();
    requestAnimationFrame(() => titleRef.current?.focus());
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <motion.h2
            className="font-display text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
          >
            NEW TASK
          </motion.h2>
          <motion.p
            className="mt-1 text-xs text-zinc-500 dark:text-zinc-400"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            Use{" "}
            <span className="font-medium text-zinc-600 dark:text-zinc-300">
              Add another
            </span>{" "}
            to save and keep adding without closing.
          </motion.p>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-500/15 hover:text-zinc-900 dark:hover:text-zinc-100"
            aria-label="Close"
          >
            <IoClose className="h-6 w-6" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="no-scrollbar grid h-[300px] gap-4 overflow-y-auto md:grid-cols-[10rem_minmax(0,1fr)]">
        <nav
          aria-label="Task form sections"
          className="no-scrollbar flex flex-row gap-2 overflow-x-auto pb-1 md:sticky md:top-0 md:flex-col md:overflow-visible md:pb-0"
        >
          <SectionTab
            label="Basics"
            icon={<IoDocumentTextOutline />}
            active={section === "basics"}
            onClick={() => setSection("basics")}
          />
          <SectionTab
            label="Events"
            icon={<IoCalendarOutline />}
            active={section === "events"}
            onClick={() => setSection("events")}
          />
          <SectionTab
            label="Notes"
            icon={<IoDocumentTextOutline />}
            active={section === "notes"}
            onClick={() => setSection("notes")}
          />
        </nav>

        <div className="space-y-4">
          {section === "basics" ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="popup-task-title" className={fieldLabel}>
                  Title
                </label>
                <input
                  ref={titleRef}
                  id="popup-task-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs doing?"
                  autoComplete="off"
                  className={inputClass}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="popup-task-category" className={fieldLabel}>
                  Category
                </label>
                <input
                  id="popup-task-category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Searchable label (optional)"
                  autoComplete="off"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="popup-task-tags" className={fieldLabel}>
                  Tags
                </label>
                <input
                  id="popup-task-tags"
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Comma-separated (optional)"
                  autoComplete="off"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="popup-task-description" className={fieldLabel}>
                  Description
                </label>
                <textarea
                  id="popup-task-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short summary or context"
                  rows={3}
                  className={`${inputClass} min-h-20 resize-y`}
                />
              </div>
            </>
          ) : null}

          {section === "events" ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="popup-task-due" className={fieldLabel}>
                  Due
                </label>
                <input
                  id="popup-task-due"
                  type="datetime-local"
                  value={dueLocal}
                  onChange={(e) => setDueLocal(e.target.value)}
                  className={inputClass}
                />
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Repeating tasks use this as the first occurrence; later dates
                  keep the same time of day.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="popup-task-repeat" className={fieldLabel}>
                  Repeats
                </label>
                <select
                  id="popup-task-repeat"
                  value={recurrenceChoice}
                  onChange={(e) =>
                    setRecurrenceChoice(e.target.value as RecurrenceChoice)
                  }
                  className={inputClass}
                >
                  {RECURRENCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {recurrenceChoice !== "none" ? (
                  <div className="flex flex-col gap-1 pt-1">
                    <label htmlFor="popup-task-repeat-interval" className={fieldLabel}>
                      Every
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="popup-task-repeat-interval"
                        type="number"
                        min={1}
                        max={365}
                        value={recurrenceInterval}
                        onChange={(e) =>
                          setRecurrenceInterval(
                            Math.max(
                              1,
                              Math.min(365, Number(e.target.value) || 1),
                            ),
                          )
                        }
                        className={`${inputClass} max-w-24`}
                      />
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {recurrenceChoice === "daily"
                          ? recurrenceInterval === 1
                            ? "day"
                            : "days"
                          : recurrenceChoice === "weekly"
                            ? recurrenceInterval === 1
                              ? "week"
                              : "weeks"
                            : recurrenceInterval === 1
                              ? "month"
                              : "months"}
                      </span>
                    </div>
                    {!dueLocal.trim() ? (
                      <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                        Set a due date so repeats have a starting point.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <span className={fieldLabel}>Priority</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority("")}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      priority === ""
                        ? "border-zinc-800 bg-zinc-800 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                        : "border-zinc-300/80 bg-white/60 text-zinc-700 hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-950/40 dark:text-zinc-300 dark:hover:border-zinc-500"
                    }`}
                  >
                    None
                  </button>
                  {PRIORITIES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPriority(value)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        priority === value
                          ? value === "high"
                            ? "border-rose-500/60 bg-rose-500/20 text-rose-900 dark:text-rose-100"
                            : value === "medium"
                              ? "border-amber-500/60 bg-amber-500/20 text-amber-900 dark:text-amber-100"
                              : "border-slate-500/50 bg-slate-500/15 text-slate-800 dark:text-slate-200"
                          : "border-zinc-300/80 bg-white/60 text-zinc-700 hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-950/40 dark:text-zinc-300 dark:hover:border-zinc-500"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCritical(!critical)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      critical
                        ? "border-red-500/50 bg-red-500/10 text-red-800 dark:text-red-200"
                        : "border-zinc-300/80 bg-white/60 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-950/40 dark:text-zinc-300"
                    }`}
                  >
                    <IoWarning
                      className={`h-4 w-4 ${critical ? "text-red-500" : "text-zinc-500"}`}
                      aria-hidden
                    />
                    Critical
                  </button>
                </div>
              </div>
            </>
          ) : null}

          {section === "notes" ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="popup-task-notes" className={fieldLabel}>
                Notes
              </label>
              <textarea
                id="popup-task-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Extra detail, links, reminders…"
                rows={6}
                className={`${inputClass} min-h-32 resize-y`}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200/80 pt-4 dark:border-white/10">
        <button
          type="submit"
          disabled={!title.trim()}
          className="min-w-32 flex-1 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-opacity enabled:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-35 dark:bg-white dark:text-zinc-900 dark:enabled:hover:bg-zinc-100"
        >
          Create task
        </button>
        <button
          type="button"
          disabled={!title.trim()}
          onClick={handleAddAnother}
          className="min-w-32 rounded-xl border border-zinc-300/80 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition-colors enabled:hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:enabled:hover:bg-zinc-700"
        >
          Add another
        </button>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-xl border border-zinc-300/80 bg-white/60 px-4 py-3 text-sm font-medium text-zinc-800 transition-colors hover:bg-white dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

function SectionTab({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-24 rounded-xl border px-3 py-2 text-left transition-colors md:min-w-0 ${
        active
          ? "border-zinc-800 bg-zinc-800 text-white dark:border-white dark:bg-white dark:text-zinc-900"
          : "border-zinc-300/80 bg-white/70 text-zinc-700 hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-950/40 dark:text-zinc-300 dark:hover:border-zinc-500"
      }`}
    >
      <span
        className={`block text-[11px] ${
          active
            ? "text-zinc-200 dark:text-zinc-700"
            : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        <span className="flex items-center gap-2">
          {icon}
          <span className="block text-sm font-semibold">{label}</span>
        </span>
      </span>
    </button>
  );
}

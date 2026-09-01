import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { IoClose, IoWarning } from "react-icons/io5";
import { Select, type SelectItemType } from "../base/select/select";
import { taskPopupField } from "./taskPopupFieldStyles";
import { parseDueLocalInput } from "../../lib/taskDates";
import { collectAvailableBlocks } from "../../lib/taskBlocks";
import { collectAvailableCategories } from "../../lib/taskCategories";
import { getTaskKindVisual, TASK_KIND_OPTIONS } from "../../lib/taskKinds";
import type {
  AddTaskPayload,
  RecurrenceFrequency,
  RecurrenceWeekday,
  TaskKind,
  TaskPriority,
  UpdateTaskPayload,
} from "@/types";
import { normalizeRecurrenceWeekdays, parseTagsInput } from "../../types/task";
import { useTasksStore } from "../../stores/tasksStore";

const PRIORITY_ITEMS: SelectItemType[] = [
  { id: "none", label: "None" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

const fieldLabel = taskPopupField.label;
const sectionLabel = taskPopupField.sectionTitle;
const inputClass = taskPopupField.input;
const popupSelectProps = {
  labelClassName: taskPopupField.selectLabel,
  triggerClassName: taskPopupField.selectTrigger,
  popoverClassName: taskPopupField.selectPopover,
} as const;
const popupSelectItemClass = taskPopupField.selectItem;

type Props = {
  onAdd?: (payload: AddTaskPayload) => void;
  onAddAnother?: (payload: AddTaskPayload) => void;
  onSave?: (payload: UpdateTaskPayload) => void;
  onDismiss?: () => void;
  mode?: "create" | "edit";
  headingText?: string;
  submitText?: string;

  initialDueLocal?: string;
  initialEndLocal?: string;
  initialKind?: TaskKind;
  initialTitle?: string;
  initialTagsInput?: string;
  initialBlock?: string;
  initialCategory?: string;
  initialDescription?: string;
  initialNotes?: string;
  initialPriority?: TaskPriority | "";
  initialCritical?: boolean;
  initialRecurrenceChoice?: RecurrenceChoice;
  initialRecurrenceInterval?: number;
  initialRecurrenceWeekdays?: RecurrenceWeekday[];
  initialRecurrenceUntilLocal?: string;
};

type RecurrenceChoice = "none" | RecurrenceFrequency;

const RECURRENCE_OPTIONS: { value: RecurrenceChoice; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const TASK_KIND_COPY: Record<TaskKind, string> = {
  task: "Something To Do",
  event: "Time-Based Event",
  class: "Classes of the Week",
  reminder: "One-Time Reminder",
  habit: "Routine or Recurring Practice",
  ics: "Imported Calendar Event (Read-Only)",
};

const WEEKDAY_OPTIONS: Array<{
  value: RecurrenceWeekday;
  short: string;
  label: string;
}> = [
  { value: 1, short: "M", label: "Mon" },
  { value: 2, short: "T", label: "Tue" },
  { value: 3, short: "W", label: "Wed" },
  { value: 4, short: "T", label: "Thu" },
  { value: 5, short: "F", label: "Fri" },
  { value: 6, short: "S", label: "Sat" },
  { value: 7, short: "S", label: "Sun" },
];

function jsDayToRecurrenceWeekday(day: number): RecurrenceWeekday {
  return (((day + 6) % 7) + 1) as RecurrenceWeekday;
}

function WeekdayPicker({
  value,
  onChange,
}: {
  value: RecurrenceWeekday[];
  onChange: (next: RecurrenceWeekday[]) => void;
}) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {WEEKDAY_OPTIONS.map((day) => {
        const active = value.includes(day.value);
        return (
          <button
            key={day.value}
            type="button"
            aria-pressed={active}
            title={day.label}
            onClick={() =>
              onChange(
                normalizeRecurrenceWeekdays(
                  active
                    ? value.filter((d) => d !== day.value)
                    : [...value, day.value],
                ) ?? [],
              )
            }
            className={`h-9 min-w-9 -skew-x-6 rounded-lg px-2 text-xs font-semibold font-display transition-colors ${
              active ? taskPopupField.weekdayActive : taskPopupField.weekdayIdle
            }`}
          >
            {day.short}
          </button>
        );
      })}
    </div>
  );
}

export function TaskCreatorPopupForm({
  onAdd,
  onAddAnother,
  onSave,
  onDismiss,
  mode = "create",
  headingText = "NEW TASK",
  submitText = "Create Task",
  initialDueLocal,
  initialEndLocal,
  initialKind = "task",
  initialTitle = "",
  initialTagsInput = "",
  initialBlock = "",
  initialCategory = "",
  initialDescription = "",
  initialNotes = "",
  initialPriority = "",
  initialCritical = false,
  initialRecurrenceChoice = "none",
  initialRecurrenceInterval = 1,
  initialRecurrenceWeekdays = [],
  initialRecurrenceUntilLocal = "",
}: Props) {
  const isEditMode = mode === "edit";
  const pinnedDueRef = useRef(initialDueLocal ?? "");
  pinnedDueRef.current = initialDueLocal ?? "";
  const pinnedEndRef = useRef(initialEndLocal ?? "");
  pinnedEndRef.current = initialEndLocal ?? "";

  const [title, setTitle] = useState(initialTitle);
  const [kind, setKind] = useState<TaskKind>(initialKind);
  const [tagsInput, setTagsInput] = useState(initialTagsInput);
  const [block, setBlock] = useState(initialBlock);
  const [category, setCategory] = useState(initialCategory);
  const [description, setDescription] = useState(initialDescription);
  const [notes, setNotes] = useState(initialNotes);
  const [dueLocal, setDueLocal] = useState(initialDueLocal ?? "");
  const [endLocal, setEndLocal] = useState(initialEndLocal ?? "");
  const [priority, setPriority] = useState<TaskPriority | "">(initialPriority);
  const [critical, setCritical] = useState(initialCritical);
  const [recurrenceChoice, setRecurrenceChoice] = useState<RecurrenceChoice>(
    initialRecurrenceChoice,
  );
  const [recurrenceInterval, setRecurrenceInterval] = useState(
    Math.max(1, Math.min(365, initialRecurrenceInterval || 1)),
  );
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<
    RecurrenceWeekday[]
  >(normalizeRecurrenceWeekdays(initialRecurrenceWeekdays) ?? []);
  const [recurrenceUntilLocal, setRecurrenceUntilLocal] = useState(
    initialRecurrenceUntilLocal,
  );
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(
      initialBlock ||
      initialCategory ||
      initialTagsInput ||
      initialDescription ||
      initialNotes,
    ),
  );
  const titleRef = useRef<HTMLInputElement>(null);
  const tasks = useTasksStore((s) => s.tasks);
  const blockSuggestions = collectAvailableBlocks(tasks);
  const categorySuggestions = collectAvailableCategories(tasks);
  const kindItems = useMemo<SelectItemType[]>(
    () =>
      TASK_KIND_OPTIONS.map((opt) => ({
        id: opt.value,
        label: opt.label,
        supportingText: TASK_KIND_COPY[opt.value],
        icon: getTaskKindVisual(opt.value).Icon,
      })),
    [],
  );
  const recurrenceItems = useMemo<SelectItemType[]>(
    () =>
      RECURRENCE_OPTIONS.map((opt) => ({
        id: opt.value,
        label: opt.label,
      })),
    [],
  );
  const blockItems = useMemo<SelectItemType[]>(
    () => blockSuggestions.map((name) => ({ id: name, label: name })),
    [blockSuggestions],
  );
  const categoryItems = useMemo<SelectItemType[]>(
    () => categorySuggestions.map((name) => ({ id: name, label: name })),
    [categorySuggestions],
  );
  const isClassKind = kind === "class";
  const parsedDueLocal = parseDueLocalInput(dueLocal);
  const parsedEndLocal = parseDueLocalInput(endLocal);
  const parsedRecurrenceUntilLocal = parseDueLocalInput(recurrenceUntilLocal);

  useEffect(() => {
    const t = requestAnimationFrame(() => titleRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    if (recurrenceChoice !== "weekly" || recurrenceWeekdays.length > 0) return;
    const base = parsedDueLocal ?? new Date();
    setRecurrenceWeekdays([jsDayToRecurrenceWeekday(base.getDay())]);
  }, [recurrenceChoice, recurrenceWeekdays.length, parsedDueLocal]);

  useEffect(() => {
    if (!isClassKind || recurrenceWeekdays.length > 0) return;
    const base = parsedDueLocal ?? new Date();
    setRecurrenceWeekdays([jsDayToRecurrenceWeekday(base.getDay())]);
  }, [isClassKind, recurrenceWeekdays.length, parsedDueLocal]);

  const classValidationMessage = (() => {
    if (!isClassKind) return "";
    if (!parsedDueLocal || !parsedEndLocal) {
      return "Classes require both start and end date/time.";
    }
    if (parsedEndLocal <= parsedDueLocal) {
      return "Class end time must be after the start time.";
    }
    if (!parsedRecurrenceUntilLocal) {
      return "Set a semester end date so the class recurrence can stop.";
    }
    if (parsedRecurrenceUntilLocal < parsedDueLocal) {
      return "Semester end must be after the first class occurrence.";
    }
    return "";
  })();
  const canSubmit = Boolean(title.trim()) && !classValidationMessage;

  const buildPayload = (): UpdateTaskPayload | null => {
    const trimmed = title.trim();
    if (!trimmed) return null;
    const dueDate = parsedDueLocal;
    const endDate = parsedEndLocal;
    const recurrenceUntilDate = parsedRecurrenceUntilLocal;
    if (isClassKind && classValidationMessage) return null;
    const normalizedBlock = block.trim();
    const cat = category.trim();
    const tags = parseTagsInput(tagsInput);
    const desc = description.trim();
    const n = notes.trim();
    let recurrence: UpdateTaskPayload["recurrence"];
    if (isClassKind && dueDate) {
      const classWeekdays = normalizeRecurrenceWeekdays(recurrenceWeekdays) ?? [
        jsDayToRecurrenceWeekday(dueDate.getDay()),
      ];
      recurrence = {
        frequency: "weekly",
        interval: 1,
        weekdays: classWeekdays,
        ...(recurrenceUntilDate ? { untilDate: recurrenceUntilDate } : {}),
      };
    } else if (dueDate && recurrenceChoice !== "none") {
      const weeklyDays =
        recurrenceChoice === "weekly"
          ? (normalizeRecurrenceWeekdays(recurrenceWeekdays) ?? [
              jsDayToRecurrenceWeekday(dueDate.getDay()),
            ])
          : undefined;
      recurrence = {
        frequency: recurrenceChoice,
        interval: Math.max(1, Math.min(365, recurrenceInterval || 1)),
        ...(weeklyDays ? { weekdays: weeklyDays } : {}),
        ...(recurrenceUntilDate ? { untilDate: recurrenceUntilDate } : {}),
      };
    }
    return {
      kind,
      title: trimmed,
      ...(dueDate ? { dueDate } : {}),
      ...(dueDate && endDate && endDate >= dueDate ? { endDate } : {}),
      ...(priority ? { priority } : {}),
      ...(critical ? { critical: true } : {}),
      ...(normalizedBlock ? { block: normalizedBlock } : {}),
      ...(cat ? { category: cat } : {}),
      ...(tags ? { tags } : {}),
      ...(desc ? { description: desc } : {}),
      ...(n ? { notes: n } : {}),
      ...(recurrence ? { recurrence } : {}),
    };
  };

  const resetForm = () => {
    setTitle(initialTitle);
    setKind(initialKind);
    setTagsInput(initialTagsInput);
    setBlock(initialBlock);
    setCategory(initialCategory);
    setDescription(initialDescription);
    setNotes(initialNotes);
    setDueLocal(pinnedDueRef.current);
    setEndLocal(pinnedEndRef.current);
    setPriority(initialPriority);
    setCritical(initialCritical);
    setRecurrenceChoice(initialRecurrenceChoice);
    setRecurrenceInterval(
      Math.max(1, Math.min(365, initialRecurrenceInterval || 1)),
    );
    setRecurrenceWeekdays(
      normalizeRecurrenceWeekdays(initialRecurrenceWeekdays) ?? [],
    );
    setRecurrenceUntilLocal(initialRecurrenceUntilLocal);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) return;
    if (isEditMode) {
      onSave?.(payload);
      return;
    }
    onAdd?.(payload);
  };

  const handleAddAnother = () => {
    const payload = buildPayload();
    if (!payload) return;
    onAddAnother?.(payload);
    resetForm();
    requestAnimationFrame(() => titleRef.current?.focus());
  };

  const dueLabel =
    kind === "class"
      ? "Start"
      : kind === "event"
        ? "Starts"
        : kind === "habit"
          ? "Starts"
          : kind === "reminder"
            ? "Remind At"
            : "Due";
  const showEndField = kind === "event" || kind === "class";
  const showRepeats = kind !== "class" && kind !== "reminder";

  return (
    <form onSubmit={submit} className="task-popup-form flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 border-b border-line/80 pb-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase text-faint">
            {isEditMode ? "How Can We Readjust?" : "What Needs Doing?"}
          </p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
            {headingText}
          </h2>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-xl border border-line/80 bg-surface/70 p-2 text-muted transition-colors hover:bg-surface hover:text-ink"
            aria-label="Close"
          >
            <IoClose className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="no-scrollbar -mx-1 space-y-4 overflow-visible px-1 pb-1">
        <section className={`${taskPopupField.panel} space-y-3`}>
          <p className={sectionLabel}>Basics</p>
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
              className={`${inputClass} text-base font-medium`}
              required
            />
          </div>

          <Select
            label="Type"
            size="sm"
            items={kindItems}
            selectedKey={kind}
            onSelectionChange={(key) => {
              if (key) setKind(String(key) as TaskKind);
            }}
            {...popupSelectProps}
          >
            {(item) => (
              <Select.Item
                id={item.id}
                supportingText={item.supportingText}
                icon={item.icon}
                className={popupSelectItemClass}
              >
                {item.label}
              </Select.Item>
            )}
          </Select>
        </section>

        <section className={`${taskPopupField.panel} space-y-3`}>
          <p className={sectionLabel}>Schedule</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="popup-task-due" className={fieldLabel}>
                {dueLabel}
              </label>
              <input
                id="popup-task-due"
                type="datetime-local"
                value={dueLocal}
                onChange={(e) => setDueLocal(e.target.value)}
                className={inputClass}
              />
            </div>

            {showEndField ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="popup-task-end" className={fieldLabel}>
                  End
                </label>
                <input
                  id="popup-task-end"
                  type="datetime-local"
                  value={endLocal}
                  onChange={(e) => setEndLocal(e.target.value)}
                  className={inputClass}
                />
              </div>
            ) : null}
          </div>

          {isClassKind || showRepeats ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {showRepeats ? (
                <Select
                  label="Repeats"
                  size="sm"
                  items={recurrenceItems}
                  selectedKey={recurrenceChoice}
                  onSelectionChange={(key) => {
                    if (key)
                      setRecurrenceChoice(String(key) as RecurrenceChoice);
                  }}
                  {...popupSelectProps}
                >
                  {(item) => (
                    <Select.Item id={item.id} className={popupSelectItemClass}>
                      {item.label}
                    </Select.Item>
                  )}
                </Select>
              ) : null}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="popup-task-repeat-until" className={fieldLabel}>
                  {isClassKind ? "Semester ends" : "Repeat until"}
                </label>
                <input
                  id="popup-task-repeat-until"
                  type="datetime-local"
                  value={recurrenceUntilLocal}
                  onChange={(e) => setRecurrenceUntilLocal(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          ) : null}

          {showRepeats && recurrenceChoice !== "none" ? (
            <div className="flex flex-col gap-3 rounded-xl border border-line/80 bg-surface/60 p-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="popup-task-repeat-interval"
                  className={fieldLabel}
                >
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
                        Math.max(1, Math.min(365, Number(e.target.value) || 1)),
                      )
                    }
                    className={`${inputClass} max-w-24`}
                  />
                  <span className="text-sm text-muted">
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
              </div>
              {recurrenceChoice === "weekly" ? (
                <div className="flex flex-col gap-1.5">
                  <span className={fieldLabel}>On days</span>
                  <WeekdayPicker
                    value={recurrenceWeekdays}
                    onChange={setRecurrenceWeekdays}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {isClassKind ? (
            <div className="flex flex-col gap-1.5">
              <span className={fieldLabel}>Class days</span>
              <WeekdayPicker
                value={recurrenceWeekdays}
                onChange={setRecurrenceWeekdays}
              />
            </div>
          ) : null}
        </section>

        <section className={`${taskPopupField.panel} space-y-3`}>
          <p className={sectionLabel}>Options</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Priority"
              size="sm"
              items={PRIORITY_ITEMS}
              selectedKey={priority || "none"}
              onSelectionChange={(key) => {
                setPriority(
                  key === "none" || !key ? "" : (String(key) as TaskPriority),
                );
              }}
              {...popupSelectProps}
            >
              {(item) => (
                <Select.Item id={item.id} className={popupSelectItemClass}>
                  {item.label}
                </Select.Item>
              )}
            </Select>
            <div className="flex flex-col justify-end gap-1.5">
              <span className={fieldLabel}>Flags</span>
              <button
                type="button"
                onClick={() => setCritical(!critical)}
                aria-pressed={critical}
                className={`flex h-[42px] items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors ${
                  critical
                    ? "border-red-500/50 bg-red-500/10 text-red-800 dark:text-red-200"
                    : taskPopupField.weekdayIdle
                }`}
              >
                <IoWarning
                  className={`h-4 w-4 ${critical ? "text-red-500" : "text-muted"}`}
                  aria-hidden
                />
                Critical
              </button>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="self-start rounded-full border border-line/90 bg-surface/70 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted shadow-sm transition-colors hover:bg-surface"
          >
            {showAdvanced ? "Hide details" : "More details"}
          </button>

          {showAdvanced ? (
            <div className={`${taskPopupField.panel} space-y-3`}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select.ComboBox
                  label="Block"
                  size="sm"
                  items={blockItems}
                  inputValue={block}
                  onInputChange={setBlock}
                  allowsCustomValue
                  shortcut={false}
                  placeholder="Morning, Work, Home…"
                  {...popupSelectProps}
                >
                  {(item) => (
                    <Select.Item id={item.id} className={popupSelectItemClass}>
                      {item.label}
                    </Select.Item>
                  )}
                </Select.ComboBox>
                <Select.ComboBox
                  label="Category"
                  size="sm"
                  items={categoryItems}
                  inputValue={category}
                  onInputChange={setCategory}
                  allowsCustomValue
                  shortcut={false}
                  placeholder="School, Work, Health…"
                  {...popupSelectProps}
                >
                  {(item) => (
                    <Select.Item id={item.id} className={popupSelectItemClass}>
                      {item.label}
                    </Select.Item>
                  )}
                </Select.ComboBox>
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

              <div className="flex flex-col gap-1.5">
                <label htmlFor="popup-task-notes" className={fieldLabel}>
                  Notes
                </label>
                <textarea
                  id="popup-task-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Extra detail, links, reminders…"
                  rows={4}
                  className={`${inputClass} min-h-24 resize-y`}
                />
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center gap-2.5 border-t border-line/80 bg-surface/90 px-5 py-4 backdrop-blur-md sm:-mx-6 sm:px-6">
        {classValidationMessage ? (
          <p className="w-full text-xs font-medium text-amber-700 dark:text-amber-300">
            {classValidationMessage}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={!canSubmit}
          className="min-w-32 flex-1 font-quantify rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition-opacity enabled:hover:bg-ink disabled:cursor-not-allowed disabled:opacity-35"
        >
          {submitText}
        </button>
        {!isEditMode ? (
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleAddAnother}
            className="min-w-32 rounded-xl border border-line-strong/80 bg-surface px-4 py-3 text-sm font-semibold text-ink transition-colors enabled:hover:bg-sunken font-display disabled:cursor-not-allowed disabled:opacity-35"
          >
            1 More
          </button>
        ) : null}
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-xl border border-line-strong/80 bg-surface/60 px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

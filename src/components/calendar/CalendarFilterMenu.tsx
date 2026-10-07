import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IoCheckmark, IoFilter } from "react-icons/io5";
import type { Task, TaskKind } from "@/types";
import {
  countActiveCalendarFilters,
  EMPTY_CALENDAR_FILTER,
  type CalendarFilter,
} from "../../lib/calendarFilters";
import {
  collectAvailableCategories,
  resolveCategoryVisual,
} from "../../lib/taskCategories";
import { TASK_KIND_OPTIONS } from "../../lib/taskKinds";

const KIND_OPTIONS: Array<{ value: TaskKind; label: string }> = [
  ...TASK_KIND_OPTIONS,
  { value: "ics", label: "Imported" },
];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

type CalendarFilterMenuProps = {
  tasks: Task[];
  filter: CalendarFilter;
  onChange: (filter: CalendarFilter) => void;
  /** Icon-only trigger for cramped headers. */
  compact?: boolean;
};

export function CalendarFilterMenu({
  tasks,
  filter,
  onChange,
  compact = false,
}: CalendarFilterMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeCount = countActiveCalendarFilters(filter);
  const categories = useMemo(() => collectAvailableCategories(tasks), [tasks]);
  const presentKinds = useMemo(
    () => new Set(tasks.map((task) => task.kind)),
    [tasks],
  );
  // Only offer kinds that exist, but keep any already selected so they can be cleared.
  const kindOptions = KIND_OPTIONS.filter(
    ({ value }) => presentKinds.has(value) || filter.kinds.includes(value),
  );

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Filter"
        className={`flex items-center gap-1.5 rounded-full border py-1.5 ${compact ? "px-2" : "px-3"} text-xs font-semibold transition-colors ${
          activeCount > 0
            ? "border-accent/60 bg-accent/10 text-ink"
            : "border-line/80 bg-surface/60 text-muted hover:text-ink"
        }`}
      >
        <IoFilter className="h-3.5 w-3.5" aria-hidden />
        {!compact && "Filter"}
        {activeCount > 0 && (
          <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold tabular-nums text-white">
            {activeCount}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Filter calendar"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-50 mt-2 flex max-h-[70vh] w-64 origin-top-right flex-col gap-3 overflow-y-auto rounded-xl border border-line/80 bg-surface p-3 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink">Filter</span>
              <button
                type="button"
                disabled={activeCount === 0}
                onClick={() => onChange(EMPTY_CALENDAR_FILTER)}
                className="text-[11px] font-semibold text-muted transition-colors hover:text-ink disabled:opacity-40 disabled:hover:text-muted"
              >
                Clear
              </button>
            </div>

            <FilterRow
              label="Hide completed"
              checked={filter.hideCompleted}
              onToggle={() =>
                onChange({ ...filter, hideCompleted: !filter.hideCompleted })
              }
            />

            {categories.length > 0 && (
              <FilterSection title="Categories">
                {categories.map((name) => (
                  <FilterRow
                    key={name}
                    label={name}
                    color={resolveCategoryVisual(name).color}
                    checked={filter.categories.some(
                      (c) => c.toLowerCase() === name.toLowerCase(),
                    )}
                    onToggle={() =>
                      onChange({
                        ...filter,
                        categories: toggle(filter.categories, name),
                      })
                    }
                  />
                ))}
              </FilterSection>
            )}

            {kindOptions.length > 1 && (
              <FilterSection title="Type">
                {kindOptions.map(({ value, label }) => (
                  <FilterRow
                    key={value}
                    label={label}
                    checked={filter.kinds.includes(value)}
                    onToggle={() =>
                      onChange({ ...filter, kinds: toggle(filter.kinds, value) })
                    }
                  />
                ))}
              </FilterSection>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
        {title}
      </span>
      {children}
    </div>
  );
}

function FilterRow({
  label,
  checked,
  color,
  onToggle,
}: {
  label: string;
  checked: boolean;
  color?: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      onClick={onToggle}
      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-bold transition-colors ${
        checked ? "bg-sunken text-ink" : "text-muted hover:bg-sunken hover:text-ink"
      }`}
    >
      <span
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
          checked ? "border-accent bg-accent text-white" : "border-line-strong"
        }`}
      >
        {checked && <IoCheckmark className="h-2.5 w-2.5" aria-hidden />}
      </span>
      {color && (
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
}

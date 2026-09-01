import { AnimatePresence, motion } from "motion/react";
import { IoArrowDown, IoArrowUp, IoClose } from "react-icons/io5";
import {
  DEFAULT_GROUP_SORT,
  DEFAULT_TASK_SORT,
  GROUP_SORT_OPTIONS,
  TASK_SORT_OPTIONS,
  type GroupSortConfig,
  type GroupSortField,
  type TaskSortConfig,
  type TaskSortDirection,
  type TaskSortField,
} from "../../lib/taskSort";

type Props = {
  open: boolean;
  onClose: () => void;
  taskSort: TaskSortConfig;
  onTaskSortChange: (config: TaskSortConfig) => void;
  groupSort: GroupSortConfig;
  onGroupSortChange: (config: GroupSortConfig) => void;
  className?: string;
  hideSectionOrder?: boolean;
};

function DirectionToggle({
  direction,
  onChange,
}: {
  direction: TaskSortDirection;
  onChange: (direction: TaskSortDirection) => void;
}) {
  return (
    <div
      className="flex rounded-lg bg-sunken p-0.5"
      role="group"
      aria-label="Sort direction"
    >
      {(
        [
          { id: "asc" as const, label: "Asc", icon: IoArrowUp },
          { id: "desc" as const, label: "Desc", icon: IoArrowDown },
        ] as const
      ).map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-pressed={direction === id}
          className={`inline-flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
            direction === id
              ? "bg-surface text-ink shadow-sm"
              : "text-muted hover:text-ink"
          }`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}

export function TasksSortMenu({
  open,
  onClose,
  taskSort,
  onTaskSortChange,
  groupSort,
  onGroupSortChange,
  className = "",
  hideSectionOrder = false,
}: Props) {
  const setTaskField = (field: TaskSortField) => {
    onTaskSortChange({ ...taskSort, field });
  };

  const setGroupField = (field: GroupSortField) => {
    onGroupSortChange({ ...groupSort, field });
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 8 }}
          transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          className={`w-[min(92vw,17rem)] rounded-2xl border border-line/60 bg-surface/95 p-3 shadow-xl backdrop-blur-xl ${className}`}
          role="dialog"
          aria-label="Sort tasks"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">
                Sort & order
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Within groups and across sections
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-sunken hover:text-ink"
              aria-label="Close sort menu"
            >
              <IoClose className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            <section>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Tasks in each group
                </h3>
                <DirectionToggle
                  direction={taskSort.direction}
                  onChange={(direction) =>
                    onTaskSortChange({ ...taskSort, direction })
                  }
                />
              </div>
              <ul className="space-y-1">
                {TASK_SORT_OPTIONS.map((option) => {
                  const active = taskSort.field === option.field;
                  return (
                    <li key={option.field}>
                      <button
                        type="button"
                        onClick={() => setTaskField(option.field)}
                        aria-pressed={active}
                        className={`w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                          active
                            ? "bg-sky-500/15 ring-1 ring-sky-500/35 dark:bg-sky-500/20"
                            : "hover:bg-sunken"
                        }`}
                      >
                        <span className="block text-sm font-medium text-ink">
                          {option.label}
                        </span>
                        <span className="block text-[11px] text-muted">
                          {option.description}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            {hideSectionOrder ? null : (
              <section className="border-t border-line/80 pt-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Section order
                  </h3>
                  {groupSort.field !== "default" ? (
                    <DirectionToggle
                      direction={groupSort.direction}
                      onChange={(direction) =>
                        onGroupSortChange({ ...groupSort, direction })
                      }
                    />
                  ) : null}
                </div>
                <ul className="space-y-1">
                  {GROUP_SORT_OPTIONS.map((option) => {
                    const active = groupSort.field === option.field;
                    return (
                      <li key={option.field}>
                        <button
                          type="button"
                          onClick={() => setGroupField(option.field)}
                          aria-pressed={active}
                          className={`w-full rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors ${
                            active
                              ? "bg-violet-500/15 ring-1 ring-violet-500/35 dark:bg-violet-500/20"
                              : "hover:bg-sunken"
                          } text-ink`}
                        >
                          {option.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <button
              type="button"
              onClick={() => {
                onTaskSortChange(DEFAULT_TASK_SORT);
                onGroupSortChange(DEFAULT_GROUP_SORT);
              }}
              className="w-full rounded-lg border border-line bg-sunken px-2.5 py-2 text-xs font-medium text-muted transition-colors hover:bg-sunken"
            >
              Reset to defaults
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

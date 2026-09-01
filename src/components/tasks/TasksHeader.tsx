import { IoCalendarOutline, IoSearch, IoSwapVertical } from "react-icons/io5";
import type { TaskViewMode } from "./taskView";
import { TASK_ICON_CLASS } from "./taskView";
import type { Selection } from "react-aria-components";
import { MultiSelect, type MultiSelectItemType } from "../base/input/multi-select";
import type { GroupSortConfig, TaskSortConfig } from "../../lib/taskSort";
import { sortLabel } from "../../lib/taskSort";
import { TasksSortMenu } from "./TasksSortMenu";

export type TasksHeaderProps = {
  taskSearch: string;
  onTaskSearchChange: (value: string) => void;
  blockFilters: Set<string>;
  onBlockFiltersChange: (value: Set<string>) => void;
  categoryFilters: Set<string>;
  onCategoryFiltersChange: (value: Set<string>) => void;
  dueTodayOnly: boolean;
  onDueTodayOnlyChange: (value: boolean) => void;
  blocks: string[];
  categories: string[];
  sortMenuOpen: boolean;
  onSortMenuOpenChange: (open: boolean) => void;
  taskSort: TaskSortConfig;
  onTaskSortChange: (config: TaskSortConfig) => void;
  groupSort: GroupSortConfig;
  onGroupSortChange: (config: GroupSortConfig) => void;
  viewMode: TaskViewMode;
  hideCategoryFilter?: boolean;
};

const shellInputClass =
  "rounded-2xl border border-line/70 bg-surface/50 text-sm text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-line/30 backdrop-blur-xl outline-none focus:border-line-strong/80 focus:ring-2 focus:ring-line-strong/30 dark:bg-overlay";

export function TasksHeader({
  taskSearch,
  onTaskSearchChange,
  blockFilters,
  onBlockFiltersChange,
  categoryFilters,
  onCategoryFiltersChange,
  dueTodayOnly,
  onDueTodayOnlyChange,
  blocks,
  categories,
  sortMenuOpen,
  onSortMenuOpenChange,
  taskSort,
  onTaskSortChange,
  groupSort,
  onGroupSortChange,
  viewMode,
  hideCategoryFilter = false,
}: TasksHeaderProps) {
  const blockItems: MultiSelectItemType[] = blocks.map((block) => ({
    id: block,
    label: block,
    textValue: block,
  }));
  const categoryItems: MultiSelectItemType[] = categories.map((category) => ({
    id: category,
    label: category,
    textValue: category,
  }));

  const selectionToSet = (selection: Selection, values: string[]): Set<string> => {
    if (selection === "all") return new Set(values);
    if (selection instanceof Set) {
      return new Set(Array.from(selection, (value) => String(value)));
    }
    return new Set<string>();
  };

  return (
    <header className="shrink-0 border-b border-line/40 bg-linear-to-b from-zinc-100/90 to-zinc-50/40 px-5 pb-4 pt-6 backdrop-blur-md dark:from-zinc-950/90 dark:to-zinc-900/35 sm:px-8 sm:pb-5 sm:pt-8">
      <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-5 xl:max-w-4xl">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="relative block min-w-0 flex-1 sm:min-w-[200px]">
            <IoSearch
              className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint ${TASK_ICON_CLASS}`}
              aria-hidden
            />
            <input
              type="search"
              value={taskSearch}
              onChange={(e) => onTaskSearchChange(e.target.value)}
              placeholder="Search tasks, category, or tags…"
              autoComplete="off"
              className={`w-full py-2.5 pl-10 pr-3 placeholder:text-faint ${shellInputClass}`}
              aria-label="Search tasks by title, category, or tags"
            />
          </label>

          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
            <div className="min-w-44 max-w-60">
              <MultiSelect
                items={blockItems}
                selectedKeys={blockFilters}
                onSelectionChange={(keys) =>
                  onBlockFiltersChange(selectionToSet(keys, blocks))
                }
                placeholder="All blocks"
                showFooter
                size="sm"
                selectedCountFormatter={(count) =>
                  count === 1 ? "1 block" : `${count} blocks`
                }
              />
            </div>

            {!hideCategoryFilter ? (
              <div className="min-w-48 max-w-64">
                <MultiSelect
                  items={categoryItems}
                  selectedKeys={categoryFilters}
                  onSelectionChange={(keys) =>
                    onCategoryFiltersChange(selectionToSet(keys, categories))
                  }
                  placeholder="All categories"
                  showFooter
                  size="sm"
                  selectedCountFormatter={(count) =>
                    count === 1 ? "1 category" : `${count} categories`
                  }
                />
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => onDueTodayOnlyChange(!dueTodayOnly)}
              aria-pressed={dueTodayOnly}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                dueTodayOnly
                  ? "border-sky-500/50 bg-sky-500/15 text-sky-950 ring-2 ring-sky-400/35 dark:text-sky-100"
                  : "border-line/70 bg-surface/50 text-ink ring-1 ring-line/30 backdrop-blur-xl hover:bg-surface/70 dark:bg-overlay dark:hover:bg-overlay"
              }`}
            >
              <IoCalendarOutline className={`${TASK_ICON_CLASS} opacity-90`} aria-hidden />
              Due Today
            </button>

            <button
              type="button"
              onClick={() => onSortMenuOpenChange(!sortMenuOpen)}
              aria-pressed={sortMenuOpen}
              aria-expanded={sortMenuOpen}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors sm:hidden ${
                sortMenuOpen
                  ? "border-zinc-500/50 bg-zinc-500/15 text-ink ring-2 ring-line-strong/35"
                  : "border-line/70 bg-surface/50 text-ink ring-1 ring-line/30 backdrop-blur-xl hover:bg-surface/70 dark:bg-overlay dark:hover:bg-overlay"
              }`}
            >
              <IoSwapVertical className={`${TASK_ICON_CLASS} opacity-90`} aria-hidden />
              Sort
            </button>
          </div>
        </div>

        {sortMenuOpen ? (
          <div className="sm:hidden">
            <TasksSortMenu
              open={sortMenuOpen}
              onClose={() => onSortMenuOpenChange(false)}
              taskSort={taskSort}
              onTaskSortChange={onTaskSortChange}
              groupSort={groupSort}
              onGroupSortChange={onGroupSortChange}
              hideSectionOrder={viewMode === "all"}
              className="w-full"
            />
            <p className="mt-2 text-xs text-muted">
              {sortLabel(taskSort)}
            </p>
          </div>
        ) : null}
      </div>
    </header>
  );
}

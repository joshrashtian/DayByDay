import { IoCalendarOutline, IoSearch } from "react-icons/io5";

export type TasksHeaderProps = {
  taskSearch: string;
  onTaskSearchChange: (value: string) => void;
  categoryFilter: "all" | string;
  onCategoryFilterChange: (value: "all" | string) => void;
  dueTodayOnly: boolean;
  onDueTodayOnlyChange: (value: boolean) => void;
  categories: string[];
};

const shellInputClass =
  "rounded-2xl border border-white/70 bg-white/50 text-sm text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-white/30 backdrop-blur-xl outline-none focus:border-zinc-400/80 focus:ring-2 focus:ring-zinc-400/30 dark:border-white/15 dark:bg-zinc-900/40 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/25";

export function TasksHeader({
  taskSearch,
  onTaskSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  dueTodayOnly,
  onDueTodayOnlyChange,
  categories,
}: TasksHeaderProps) {
  return (
    <header className="shrink-0 border-b border-white/40 bg-linear-to-b from-zinc-100/90 to-zinc-50/40 px-5 pb-4 pt-6 backdrop-blur-md dark:border-white/10 dark:from-zinc-950/90 dark:to-zinc-900/35 sm:px-8 sm:pb-5 sm:pt-8">
      <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-5 xl:max-w-4xl">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="relative block min-w-0 flex-1 sm:min-w-[200px]">
            <IoSearch
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
              aria-hidden
            />
            <input
              type="search"
              value={taskSearch}
              onChange={(e) => onTaskSearchChange(e.target.value)}
              placeholder="Search tasks, category, or tags…"
              autoComplete="off"
              className={`w-full py-2.5 pl-10 pr-3 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 ${shellInputClass}`}
              aria-label="Search tasks by title, category, or tags"
            />
          </label>

          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
            <label className="flex min-w-0 items-center gap-2">
              <span className="sr-only">Filter By Category</span>
              <select
                value={categoryFilter}
                onChange={(e) =>
                  onCategoryFilterChange(
                    e.target.value === "all" ? "all" : e.target.value,
                  )
                }
                className={`min-w-0 max-w-full h-full py-2.5 pl-3 pr-8 border px-3 rounded-2xl ${shellInputClass}`}
                aria-label="Filter By Category"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => onDueTodayOnlyChange(!dueTodayOnly)}
              aria-pressed={dueTodayOnly}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                dueTodayOnly
                  ? "border-sky-500/50 bg-sky-500/15 text-sky-950 ring-2 ring-sky-400/35 dark:text-sky-100"
                  : "border-white/70 bg-white/50 text-zinc-800 ring-1 ring-white/30 backdrop-blur-xl hover:bg-white/70 dark:border-white/15 dark:bg-zinc-900/40 dark:text-zinc-100 dark:hover:bg-zinc-900/60"
              }`}
            >
              <IoCalendarOutline
                className="h-4 w-4 shrink-0 opacity-90"
                aria-hidden
              />
              Due Today
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

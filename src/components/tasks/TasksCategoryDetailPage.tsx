import { useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";
import { IoSettingsOutline } from "react-icons/io5";
import { TasksWorkspace } from "./TasksWorkspace";
import { TasksBreadcrumb } from "./TasksBreadcrumb";
import {
  getCategoryConfigByName,
  resolveCategoryVisual,
  slugToCategory,
} from "../../lib/taskCategories";
import { renderCategoryIcon } from "../../lib/categoryIcons";

export function TasksCategoryDetailPage() {
  const { categorySlug = "" } = useParams();
  const categoryName = useMemo(
    () => slugToCategory(categorySlug),
    [categorySlug],
  );

  if (!categoryName) {
    return <Navigate to="/tasks/categories" replace />;
  }

  const visual = resolveCategoryVisual(categoryName);
  const hasStyle = Boolean(getCategoryConfigByName(categoryName));

  return (
    <>
      <TasksBreadcrumb
        items={[
          { label: "Your Tasks", to: "/tasks" },
          { label: "Categories", to: "/tasks/categories" },
          { label: categoryName },
        ]}
      />
      <header className="shrink-0 px-5 pb-2 pt-2 sm:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 xl:max-w-4xl">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: visual.bg,
                color: visual.text,
                borderColor: visual.border,
              }}
            >
              {visual.icon ? (
                <span className="inline-flex items-center">
                  {renderCategoryIcon(visual.icon, "h-4 w-4")}
                </span>
              ) : null}
              {categoryName}
            </span>
            {!hasStyle ? (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Using default colors
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new Event("rbd:open-settings"))
            }
            className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/50 px-3 py-1.5 text-xs font-semibold text-zinc-700 ring-1 ring-white/30 backdrop-blur-xl transition-colors hover:bg-white/80 dark:border-white/15 dark:bg-zinc-900/45 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
          >
            <IoSettingsOutline className="h-3.5 w-3.5" aria-hidden />
            Edit style
          </button>
        </div>
      </header>
      <TasksWorkspace
        topPadding="none"
        contentWidth="wide"
        composerLayout="none"
        initialCategoryFilter={categoryName}
        lockCategoryFilter
      />
    </>
  );
}

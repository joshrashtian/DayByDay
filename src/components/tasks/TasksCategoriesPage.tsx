import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoAdd, IoPricetagsOutline, IoTrashOutline } from "react-icons/io5";
import { renderCategoryIcon } from "../../lib/categoryIcons";
import {
  categoryToSlug,
  collectAvailableCategories,
  countTasksInCategory,
  deleteCategoryEntirely,
  getCategoryConfigByName,
  resolveCategoryVisual,
  setOrUpdateCategoryConfig,
  suggestCategoryColor,
} from "../../lib/taskCategories";
import { isIcsTask } from "../../lib/icsTasks";
import { useTasksStore } from "../../stores/tasksStore";
import { TasksBreadcrumb } from "./TasksBreadcrumb";

export function TasksCategoriesPage() {
  const navigate = useNavigate();
  const tasks = useTasksStore((s) => s.tasks);
  const userTasks = useMemo(
    () => tasks.filter((task) => !isIcsTask(task)),
    [tasks],
  );
  const removeCategoryFromAllTasks = useTasksStore(
    (s) => s.removeCategoryFromAllTasks,
  );

  const categories = useMemo(
    () => collectAvailableCategories(userTasks),
    [userTasks],
  );

  const [newCategoryName, setNewCategoryName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const onCreateCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setMessage("Enter a category name.");
      return;
    }
    const existing = getCategoryConfigByName(trimmed);
    if (!existing) {
      setOrUpdateCategoryConfig({
        name: trimmed,
        color: suggestCategoryColor(trimmed),
        tone: "soft",
      });
    }
    setNewCategoryName("");
    setMessage(`Category “${trimmed}” ready. Assign it to tasks with @@${trimmed.replace(/\s+/g, "")} or the task form.`);
    navigate(`/tasks/categories/${categoryToSlug(trimmed)}`);
  };

  const onDeleteCategory = (name: string) => {
    const count = countTasksInCategory(userTasks, name);
    if (pendingDelete !== name) {
      setPendingDelete(name);
      setMessage(
        count > 0
          ? `Delete “${name}”? This removes the category from ${count} task${count === 1 ? "" : "s"} and deletes its style.`
          : `Delete “${name}”? This removes its saved style.`,
      );
      return;
    }
    deleteCategoryEntirely(name, removeCategoryFromAllTasks);
    setPendingDelete(null);
    setMessage(`Deleted “${name}”.`);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <TasksBreadcrumb
        items={[
          { label: "Your Tasks", to: "/tasks" },
          { label: "Categories" },
        ]}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-24 pt-4 sm:px-8">
        <div className="mx-auto w-full max-w-3xl xl:max-w-4xl">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Categories
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Organize tasks by category. Delete a category to remove it from
                every task.
              </p>
            </div>
            <span className="rounded-full bg-zinc-500/10 px-3 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              {categories.length}{" "}
              {categories.length === 1 ? "category" : "categories"}
            </span>
          </header>

          <div className="mb-6 rounded-2xl border border-white/60 bg-white/45 p-4 shadow-sm ring-1 ring-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/35 dark:ring-white/10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              New category
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => {
                  setNewCategoryName(e.target.value);
                  setMessage(null);
                  setPendingDelete(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onCreateCategory();
                }}
                placeholder="Work, School, Fitness…"
                className="min-w-0 flex-1 rounded-xl border border-zinc-200/80 bg-white/80 px-3 py-2.5 text-sm text-zinc-900 outline-none ring-sky-400/40 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={onCreateCategory}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <IoAdd className="h-4 w-4" aria-hidden />
                Add
              </button>
            </div>
          </div>

          {message ? (
            <p
              className="mb-4 text-sm text-zinc-600 dark:text-zinc-300"
              aria-live="polite"
            >
              {message}
            </p>
          ) : null}

          {categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300/80 bg-white/30 px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/20">
              <IoPricetagsOutline className="mx-auto h-10 w-10 text-zinc-400 dark:text-zinc-500" />
              <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                No categories yet
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Create one above, or assign a category when adding a task.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {categories.map((name) => {
                const visual = resolveCategoryVisual(name);
                const count = countTasksInCategory(userTasks, name);
                const hasStyle = Boolean(getCategoryConfigByName(name));
                const isPending = pendingDelete === name;

                return (
                  <li
                    key={name}
                    className="rounded-2xl border border-white/60 bg-white/45 shadow-sm ring-1 ring-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/35 dark:ring-white/10"
                  >
                    <div className="flex flex-wrap items-center gap-3 p-4">
                      <Link
                        to={`/tasks/categories/${categoryToSlug(name)}`}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl transition-colors hover:bg-white/40 dark:hover:bg-white/5"
                      >
                        <span
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide"
                          style={{
                            backgroundColor: visual.bg,
                            color: visual.text,
                            borderColor: visual.border,
                          }}
                        >
                          {visual.icon ? (
                            <span className="inline-flex items-center">
                              {renderCategoryIcon(visual.icon, "h-3.5 w-3.5")}
                            </span>
                          ) : null}
                          {name}
                        </span>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          {count} {count === 1 ? "task" : "tasks"}
                          {!hasStyle ? " · default style" : ""}
                        </span>
                      </Link>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/tasks/categories/${categoryToSlug(name)}`}
                          className="rounded-lg border border-zinc-200/80 bg-white/70 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          View tasks
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDeleteCategory(name)}
                          className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            isPending
                              ? "border-rose-500/50 bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              : "border-zinc-200/80 bg-white/70 text-zinc-700 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          }`}
                        >
                          <IoTrashOutline className="h-3.5 w-3.5" aria-hidden />
                          {isPending ? "Confirm delete" : "Delete"}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useId, useState } from "react";
import { ColorPicker } from "../../components/base/input/color-picker";
import { IconPicker } from "../../components/base/input/icon-picker";
import {
  getCategoryIconOption,
  renderCategoryIcon,
} from "../../lib/categoryIcons";
import { useTasksStore } from "../../stores/tasksStore";
import { useSettingsStore } from "../../stores/settingsStore";
import {
  collectAvailableCategories,
  countTasksInCategory,
  deleteCategoryEntirely,
  getCategoryConfigByName,
  getCategoryConfigs,
  removeCategoryConfigByName,
  setOrUpdateCategoryConfig,
  suggestCategoryColor,
  type CategoryTone,
} from "../../lib/taskCategories";

export function CategoriesSection() {
  const uid = useId();
  const tasks = useTasksStore((s) => s.tasks);
  const removeCategoryFromAllTasks = useTasksStore(
    (s) => s.removeCategoryFromAllTasks,
  );
  const storedCategoryConfigs = useSettingsStore((s) => s.categoryConfigs);
  const [categoryConfigs, setCategoryConfigs] = useState(() =>
    getCategoryConfigs(),
  );
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryNameInput, setCategoryNameInput] = useState("");
  const [categoryColorInput, setCategoryColorInput] = useState("#6366f1");
  const [categoryTextColorInput, setCategoryTextColorInput] =
    useState("#ffffff");
  const [categoryTone, setCategoryTone] = useState<CategoryTone>("soft");
  const [categoryIconInput, setCategoryIconInput] = useState("");
  const [categoryMessage, setCategoryMessage] = useState<string | null>(null);
  const [pendingStyleDelete, setPendingStyleDelete] = useState(false);
  const [pendingFullDelete, setPendingFullDelete] = useState(false);

  useEffect(() => {
    setCategoryConfigs(getCategoryConfigs());
  }, [storedCategoryConfigs]);

  const availableCategories = collectAvailableCategories(tasks);

  useEffect(() => {
    if (!selectedCategory) return;
    if (!availableCategories.some((name) => name === selectedCategory)) {
      setSelectedCategory("");
    }
  }, [availableCategories, selectedCategory]);

  useEffect(() => {
    if (!selectedCategory) return;
    const cfg = getCategoryConfigByName(selectedCategory);
    setCategoryNameInput(selectedCategory);
    setCategoryColorInput(cfg?.color ?? suggestCategoryColor(selectedCategory));
    setCategoryTextColorInput(cfg?.textColor ?? "#ffffff");
    setCategoryTone(cfg?.tone ?? "soft");
    setCategoryIconInput(cfg?.icon ?? "");
    setCategoryMessage(null);
  }, [selectedCategory, categoryConfigs]);

  const onSelectCategory = (name: string) => {
    setSelectedCategory(name);
    setCategoryMessage(null);
    setPendingStyleDelete(false);
    setPendingFullDelete(false);
  };

  const onStartNewCategory = () => {
    setSelectedCategory("");
    setCategoryNameInput("");
    setCategoryColorInput("#6366f1");
    setCategoryTextColorInput("#ffffff");
    setCategoryTone("soft");
    setCategoryIconInput("");
    setCategoryMessage(null);
    setPendingStyleDelete(false);
    setPendingFullDelete(false);
  };

  const onSaveCategoryStyle = () => {
    const trimmed = categoryNameInput.trim();
    if (!trimmed) {
      setCategoryMessage("Enter a category name.");
      return;
    }
    if (!/^#([0-9a-fA-F]{6})$/.test(categoryColorInput.trim())) {
      setCategoryMessage("Primary color must be a 6-digit hex value.");
      return;
    }
    if (
      categoryTextColorInput.trim() &&
      !/^#([0-9a-fA-F]{6})$/.test(categoryTextColorInput.trim())
    ) {
      setCategoryMessage("Text color must be a 6-digit hex value.");
      return;
    }
    setOrUpdateCategoryConfig({
      name: trimmed,
      color: categoryColorInput.trim(),
      textColor: categoryTextColorInput.trim() || undefined,
      tone: categoryTone,
      icon: categoryIconInput.trim() || undefined,
    });
    setSelectedCategory(trimmed);
    setCategoryMessage("Category style saved.");
  };

  const onDeleteCategoryStyle = () => {
    const trimmed = (selectedCategory || categoryNameInput).trim();
    if (!trimmed) {
      setCategoryMessage("Select a category to delete.");
      return;
    }
    if (!pendingStyleDelete) {
      setPendingStyleDelete(true);
      setPendingFullDelete(false);
      setCategoryMessage(
        `Remove saved style for “${trimmed}”? Tasks keep the category label.`,
      );
      return;
    }
    removeCategoryConfigByName(trimmed);
    onStartNewCategory();
    setPendingStyleDelete(false);
    setCategoryMessage("Category style removed.");
  };

  const onDeleteCategoryFully = () => {
    const trimmed = (selectedCategory || categoryNameInput).trim();
    if (!trimmed) {
      setCategoryMessage("Select a category to delete.");
      return;
    }
    const count = countTasksInCategory(tasks, trimmed);
    if (!pendingFullDelete) {
      setPendingFullDelete(true);
      setPendingStyleDelete(false);
      setCategoryMessage(
        count > 0
          ? `Delete “${trimmed}” from all ${count} task${count === 1 ? "" : "s"} and remove its style?`
          : `Delete “${trimmed}” and remove its style?`,
      );
      return;
    }
    deleteCategoryEntirely(trimmed, removeCategoryFromAllTasks);
    onStartNewCategory();
    setPendingFullDelete(false);
    setCategoryMessage(`Deleted “${trimmed}”.`);
  };

  const catSelectId = `${uid}-cat-select`;
  const catNameId = `${uid}-cat-name`;
  const catToneId = `${uid}-cat-tone`;
  const catColorId = `${uid}-cat-color`;
  const catTextColorId = `${uid}-cat-text-color`;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Category Styles
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Customize how task categories appear across calendar and task views.
        </p>
      </div>

      <div
        className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        role="note"
      >
        Workflow tip: pick a consistent color language (for example work = cool
        tones, personal = warm tones) to make scanning your day faster.
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label
            htmlFor={catSelectId}
            className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
          >
            Category
          </label>
          <select
            id={catSelectId}
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="min-w-[200px] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-shadow focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="">Select category…</option>
            {availableCategories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={onStartNewCategory}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          New style
        </button>
      </div>

      <fieldset className="border-none p-0">
        <legend className="sr-only">Category appearance</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label
              htmlFor={catNameId}
              className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            >
              Category name
            </label>
            <input
              id={catNameId}
              type="text"
              value={categoryNameInput}
              onChange={(e) => {
                setCategoryNameInput(e.target.value);
                setCategoryMessage(null);
              }}
              placeholder="Work, School, Fitness…"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-shadow focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor={catToneId}
              className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            >
              Tone
            </label>
            <select
              id={catToneId}
              value={categoryTone}
              onChange={(e) =>
                setCategoryTone(e.target.value as CategoryTone)
              }
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-shadow focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="soft">Soft</option>
              <option value="solid">Solid</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span
              id={catColorId}
              className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            >
              Color
            </span>
            <ColorPicker
              value={categoryColorInput}
              onChange={(next) => {
                setCategoryColorInput(next);
                setCategoryMessage(null);
              }}
              aria-label="Category color"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span
              id={catTextColorId}
              className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            >
              Text color
            </span>
            <ColorPicker
              value={categoryTextColorInput}
              onChange={(next) => {
                setCategoryTextColorInput(next);
                setCategoryMessage(null);
              }}
              presets={["#ffffff", "#f4f4f5", "#18181b", "#000000"]}
              aria-label="Category text color"
            />
          </div>
          <div className="sm:col-span-2">
            <span
              className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
              id={`${uid}-icon-label`}
            >
              Icon (optional)
            </span>
            <div
              className="mt-1"
              role="group"
              aria-labelledby={`${uid}-icon-label`}
            >
              <IconPicker
                value={categoryIconInput}
                onChange={(next) => {
                  setCategoryIconInput(next);
                  setCategoryMessage(null);
                }}
                onClear={() => {
                  setCategoryIconInput("");
                  setCategoryMessage(null);
                }}
              />
            </div>
          </div>
        </div>
      </fieldset>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Preview
        </p>
        <span
          className="mt-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide"
          role="img"
          aria-label={`Preview of ${categoryNameInput.trim() || "Category"} badge`}
          style={{
            backgroundColor:
              categoryTone === "solid"
                ? categoryColorInput
                : `${categoryColorInput}2e`,
            color:
              categoryTone === "solid"
                ? categoryTextColorInput || "#ffffff"
                : categoryTextColorInput || categoryColorInput,
            borderColor:
              categoryTone === "solid"
                ? `${categoryColorInput}aa`
                : `${categoryColorInput}6f`,
          }}
        >
          {categoryIconInput.trim() ? (
            <span className="inline-flex items-center" aria-hidden="true">
              {renderCategoryIcon(categoryIconInput.trim(), "h-3.5 w-3.5")}
            </span>
          ) : null}
          <span>{categoryNameInput.trim() || "Category"}</span>
        </span>
        {categoryIconInput.trim() ? (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Icon key:{" "}
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">
              {getCategoryIconOption(categoryIconInput.trim())?.label ??
                categoryIconInput.trim()}
            </span>
          </p>
        ) : null}
      </div>

      <div aria-live="polite">
        {categoryMessage ? (
          <p
            className="text-sm text-zinc-700 dark:text-zinc-300"
            role={
              categoryMessage.includes("removed") ||
              categoryMessage.includes("saved")
                ? "status"
                : "alert"
            }
          >
            {categoryMessage}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSaveCategoryStyle}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Save Category Styles
        </button>
        <button
          type="button"
          onClick={onDeleteCategoryStyle}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {pendingStyleDelete ? "Confirm remove style" : "Remove style only"}
        </button>
        <button
          type="button"
          onClick={onDeleteCategoryFully}
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
        >
          {pendingFullDelete ? "Confirm delete category" : "Delete category"}
        </button>
      </div>
    </div>
  );
}

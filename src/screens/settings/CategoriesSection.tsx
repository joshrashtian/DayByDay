import { useEffect, useId, useState } from "react";
import { ColorPicker } from "../../components/base/input/color-picker";
import { IconPicker } from "../../components/base/input/icon-picker";
import { renderCategoryIcon } from "../../lib/categoryIcons";
import { useTasksStore } from "../../stores/tasksStore";
import { useSettingsStore } from "../../stores/settingsStore";
import {
  collectAvailableCategories,
  countTasksInCategory,
  deleteCategoryEntirely,
  getCategoryConfigByName,
  getCategoryConfigs,
  resolveCategoryVisual,
  setOrUpdateCategoryConfig,
  suggestCategoryColor,
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
  const [nameInput, setNameInput] = useState("");
  const [colorInput, setColorInput] = useState("#6366f1");
  const [iconInput, setIconInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);

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
    setNameInput(selectedCategory);
    setColorInput(cfg?.color ?? suggestCategoryColor(selectedCategory));
    setIconInput(cfg?.icon ?? "");
    setMessage(null);
  }, [selectedCategory, categoryConfigs]);

  const onSelectCategory = (name: string) => {
    setSelectedCategory(name);
    setMessage(null);
    setPendingDelete(false);
  };

  const onStartNew = () => {
    setSelectedCategory("");
    setNameInput("");
    setColorInput("#6366f1");
    setIconInput("");
    setMessage(null);
    setPendingDelete(false);
  };

  const onSave = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setMessage("Enter a category name.");
      return;
    }
    if (!/^#([0-9a-fA-F]{6})$/.test(colorInput.trim())) {
      setMessage("Color must be a 6-digit hex value.");
      return;
    }
    setOrUpdateCategoryConfig({
      name: trimmed,
      color: colorInput.trim(),
      icon: iconInput.trim() || undefined,
    });
    setSelectedCategory(trimmed);
    setMessage("Category saved.");
  };

  const onDelete = () => {
    const trimmed = (selectedCategory || nameInput).trim();
    if (!trimmed) {
      setMessage("Select a category to delete.");
      return;
    }
    const count = countTasksInCategory(tasks, trimmed);
    if (!pendingDelete) {
      setPendingDelete(true);
      setMessage(
        count > 0
          ? `Delete “${trimmed}” from all ${count} task${count === 1 ? "" : "s"}?`
          : `Delete “${trimmed}”?`,
      );
      return;
    }
    deleteCategoryEntirely(trimmed, removeCategoryFromAllTasks);
    onStartNew();
    setMessage(`Deleted “${trimmed}”.`);
  };

  const previewName = nameInput.trim() || "Category";
  const previewColor = /^#([0-9a-fA-F]{6})$/.test(colorInput.trim())
    ? colorInput.trim()
    : "#6366f1";
  const visual = resolveCategoryVisual(previewName);
  // Live-preview the in-progress color/icon rather than the saved config.
  const cardColor = previewColor;
  const onColor = visual.onColor;
  const iconBg = visual.iconBg;

  const catSelectId = `${uid}-cat-select`;
  const catNameId = `${uid}-cat-name`;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">
          Categories
        </h2>
        <p className="mt-1 text-sm text-muted">
          Give each category a color and an icon. Tasks in that category show as
          a full-color card.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label
            htmlFor={catSelectId}
            className="text-xs font-medium uppercase tracking-wide text-muted"
          >
            Edit category
          </label>
          <select
            id={catSelectId}
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="min-w-[200px] rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-shadow focus:ring-2 focus:ring-accent"
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
          onClick={onStartNew}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          New category
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label
            htmlFor={catNameId}
            className="text-xs font-medium uppercase tracking-wide text-muted"
          >
            Name
          </label>
          <input
            id={catNameId}
            type="text"
            value={nameInput}
            onChange={(e) => {
              setNameInput(e.target.value);
              setMessage(null);
            }}
            placeholder="Work, School, Fitness…"
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-shadow focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Color
          </span>
          <ColorPicker
            value={colorInput}
            onChange={(next) => {
              setColorInput(next);
              setMessage(null);
            }}
            aria-label="Category color"
          />
        </div>
        <div className="sm:col-span-2">
          <span
            className="text-xs font-medium uppercase tracking-wide text-muted"
            id={`${uid}-icon-label`}
          >
            Icon
          </span>
          <div className="mt-1" role="group" aria-labelledby={`${uid}-icon-label`}>
            <IconPicker
              value={iconInput}
              onChange={(next) => {
                setIconInput(next);
                setMessage(null);
              }}
              onClear={() => {
                setIconInput("");
                setMessage(null);
              }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-sunken p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
          Preview
        </p>
        <div
          className="flex items-center gap-4 rounded-[26px] px-5 py-5 shadow-[0_10px_30px_rgba(15,15,15,0.12)]"
          style={{ backgroundColor: cardColor, color: onColor }}
          role="img"
          aria-label={`Preview of ${previewName} card`}
        >
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: iconBg }}
            aria-hidden
          >
            {iconInput.trim() ? (
              renderCategoryIcon(iconInput.trim(), "h-7 w-7")
            ) : (
              <span className="text-xl font-bold">
                {previewName.charAt(0).toUpperCase()}
              </span>
            )}
          </span>
          <div className="min-w-0">
            <p className="text-xl font-bold leading-tight tracking-tight">
              Example task
            </p>
            <p className="mt-0.5 text-sm font-semibold opacity-80">
              {previewName}
            </p>
          </div>
        </div>
      </div>

      <div aria-live="polite">
        {message ? (
          <p
            className="text-sm text-muted"
            role={
              message.includes("Deleted") || message.includes("saved")
                ? "status"
                : "alert"
            }
          >
            {message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Save category
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
        >
          {pendingDelete ? "Confirm delete" : "Delete category"}
        </button>
      </div>
    </div>
  );
}

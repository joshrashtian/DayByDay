import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import {
  IoCloudOutline,
  IoColorPaletteOutline,
  IoBrushOutline,
  IoSettings,
} from "react-icons/io5";
import { IconPicker } from "../components/base/input/icon-picker";
import {
  clearBlocksUserCss,
  getBlocksUserCss,
  setBlocksUserCss,
} from "../lib/blocksUserCss";
import {
  getCategoryIconOption,
  renderCategoryIcon,
} from "../lib/categoryIcons";
import {
  clearManualWeatherCoords,
  getManualWeatherCoords,
  setManualWeatherCoords,
} from "../lib/weatherCoords";
import { useTasksStore } from "../stores/tasksStore";
import {
  CATEGORY_CONFIGS_CHANGED,
  CATEGORY_CONFIG_STORAGE_KEY,
  collectAvailableCategories,
  getCategoryConfigByName,
  getCategoryConfigs,
  removeCategoryConfigByName,
  setOrUpdateCategoryConfig,
  suggestCategoryColor,
  type CategoryTone,
} from "../lib/taskCategories";

type SettingsSection = "weather" | "categories" | "blocks-css";

const SECTIONS: {
  id: SettingsSection;
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: "weather", label: "Weather", icon: <IoCloudOutline /> },
  {
    id: "categories",
    label: "Categories",
    icon: <IoColorPaletteOutline />,
  },
  { id: "blocks-css", label: "Blocks CSS", icon: <IoBrushOutline /> },
];

export const SettingsScreen = ({ modal = false }: { modal?: boolean }) => {
  const uid = useId();
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("weather");

  const [latInput, setLatInput] = useState("");
  const [lonInput, setLonInput] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const [blocksCssInput, setBlocksCssInput] = useState("");
  const [blocksCssSavedFlash, setBlocksCssSavedFlash] = useState(false);
  const [blocksCssUploadError, setBlocksCssUploadError] = useState<
    string | null
  >(null);
  const [blocksEarlyMorningBg, setBlocksEarlyMorningBg] = useState(
    "linear-gradient(135deg, #e0f2fe 0%, #dbeafe 45%, #ede9fe 100%)",
  );
  const [blocksAfternoonBg, setBlocksAfternoonBg] = useState(
    "linear-gradient(135deg, #fef3c7 0%, #fed7aa 52%, #fdba74 100%)",
  );
  const [blocksEarlyMorningBgDark, setBlocksEarlyMorningBgDark] = useState(
    "rgba(12, 74, 110, 0.25)",
  );
  const [blocksAfternoonBgDark, setBlocksAfternoonBgDark] = useState(
    "rgba(180, 83, 9, 0.28)",
  );
  const [uploadMode, setUploadMode] = useState<"append" | "replace">("append");
  const cssFileInputRef = useRef<HTMLInputElement>(null);

  const tasks = useTasksStore((s) => s.tasks);
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

  useEffect(() => {
    const m = getManualWeatherCoords();
    if (m) {
      setLatInput(String(m.lat));
      setLonInput(String(m.lon));
    }
    setBlocksCssInput(getBlocksUserCss());
  }, []);

  useEffect(() => {
    const sync = () => setCategoryConfigs(getCategoryConfigs());
    window.addEventListener(CATEGORY_CONFIGS_CHANGED, sync);
    const onStorage = (e: StorageEvent) => {
      if (e.key === CATEGORY_CONFIG_STORAGE_KEY || e.key === null) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CATEGORY_CONFIGS_CHANGED, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

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

  // ── Weather handlers ──

  const onSaveWeatherLocation = () => {
    setSaveError(null);
    const lat = Number(latInput.trim());
    const lon = Number(lonInput.trim());
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setSaveError("Enter valid numbers for latitude and longitude.");
      return;
    }
    if (lat < -90 || lat > 90) {
      setSaveError("Latitude must be between -90 and 90.");
      return;
    }
    if (lon < -180 || lon > 180) {
      setSaveError("Longitude must be between -180 and 180.");
      return;
    }
    setManualWeatherCoords({ lat, lon });
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  };

  const onUseDeviceLocation = () => {
    setSaveError(null);
    clearManualWeatherCoords();
    setLatInput("");
    setLonInput("");
  };

  // ── Blocks CSS handlers ──

  const onSaveBlocksCss = () => {
    setBlocksUserCss(blocksCssInput);
    setBlocksCssSavedFlash(true);
    window.setTimeout(() => setBlocksCssSavedFlash(false), 2000);
  };

  const onClearBlocksCss = () => {
    clearBlocksUserCss();
    setBlocksCssInput("");
    setBlocksCssSavedFlash(true);
    window.setTimeout(() => setBlocksCssSavedFlash(false), 2000);
  };

  const onInsertBlocksVariableSnippet = () => {
    const snippet = `#block-screen {\n  --blocks-early-morning-bg: ${blocksEarlyMorningBg};\n  --blocks-early-morning-bg-dark: ${blocksEarlyMorningBgDark};\n  --blocks-afternoon-bg: ${blocksAfternoonBg};\n  --blocks-afternoon-bg-dark: ${blocksAfternoonBgDark};\n}`;
    setBlocksCssInput((prev) =>
      prev.trim().length === 0
        ? snippet
        : `${prev.trimEnd()}\n\n/* Variable snippet */\n${snippet}`,
    );
    setBlocksCssSavedFlash(false);
  };

  const openCssUploadPicker = (mode: "append" | "replace") => {
    setBlocksCssUploadError(null);
    setUploadMode(mode);
    cssFileInputRef.current?.click();
  };

  const onUploadBlocksCssFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const content = await file.text();
      setBlocksCssInput((prev) => {
        if (uploadMode === "replace") return content;
        if (prev.trim().length === 0) return content;
        return `${prev.trimEnd()}\n\n/* Imported from ${file.name} */\n${content}`;
      });
      setBlocksCssUploadError(null);
      setBlocksCssSavedFlash(false);
    } catch {
      setBlocksCssUploadError(
        "Couldn't read that file. Try a plain .css file.",
      );
    }
  };

  // ── Category handlers ──

  const onSelectCategory = (name: string) => {
    setSelectedCategory(name);
    setCategoryMessage(null);
  };

  const onStartNewCategory = () => {
    setSelectedCategory("");
    setCategoryNameInput("");
    setCategoryColorInput("#6366f1");
    setCategoryTextColorInput("#ffffff");
    setCategoryTone("soft");
    setCategoryIconInput("");
    setCategoryMessage(null);
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
    removeCategoryConfigByName(trimmed);
    onStartNewCategory();
    setCategoryMessage("Category style removed.");
  };

  // ── Stable IDs for a11y ──

  const latId = `${uid}-lat`;
  const lonId = `${uid}-lon`;
  const weatherHintId = `${uid}-weather-hint`;
  const catSelectId = `${uid}-cat-select`;
  const catNameId = `${uid}-cat-name`;
  const catToneId = `${uid}-cat-tone`;
  const catColorId = `${uid}-cat-color`;
  const catTextColorId = `${uid}-cat-text-color`;
  const cssTextareaId = `${uid}-css-textarea`;
  const earlyMorningBgId = `${uid}-em-bg`;
  const earlyMorningBgDarkId = `${uid}-em-bg-dark`;
  const afternoonBgId = `${uid}-af-bg`;
  const afternoonBgDarkId = `${uid}-af-bg-dark`;

  // ── Section content renderers ──

  const renderWeather = () => (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Weather
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Use a fixed location for consistent forecast data across sessions.
        </p>
      </div>

      <div
        id={weatherHintId}
        className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200"
        role="note"
      >
        Leave these empty to use your device location (if permitted).
        Coordinates are useful when planning for a different city.
      </div>

      <fieldset
        className="flex flex-col gap-3 border-none p-0"
        aria-describedby={weatherHintId}
      >
        <legend className="sr-only">Location coordinates</legend>
        <div className="flex flex-col gap-1">
          <label
            htmlFor={latId}
            className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
          >
            Latitude
          </label>
          <input
            id={latId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={latInput}
            onChange={(e) => setLatInput(e.target.value)}
            placeholder="e.g. 34.0549"
            aria-invalid={
              saveError?.toLowerCase().includes("latitude") || undefined
            }
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-shadow focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor={lonId}
            className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
          >
            Longitude
          </label>
          <input
            id={lonId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={lonInput}
            onChange={(e) => setLonInput(e.target.value)}
            placeholder="e.g. -118.2452"
            aria-invalid={
              saveError?.toLowerCase().includes("longitude") || undefined
            }
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-shadow focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      </fieldset>

      <div aria-live="polite">
        {saveError ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {saveError}
          </p>
        ) : null}
        {savedFlash ? (
          <p
            className="text-sm text-emerald-600 dark:text-emerald-400"
            role="status"
          >
            Weather settings saved. Weather will refresh.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSaveWeatherLocation}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Save Coordinates
        </button>
        <button
          type="button"
          onClick={onUseDeviceLocation}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Use device location
        </button>
      </div>
    </div>
  );

  const renderCategories = () => (
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
            <label
              htmlFor={catColorId}
              className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            >
              Color (hex)
            </label>
            <input
              id={catColorId}
              type="text"
              value={categoryColorInput}
              onChange={(e) => {
                setCategoryColorInput(e.target.value);
                setCategoryMessage(null);
              }}
              placeholder="#6366f1"
              aria-description="6-digit hex color, e.g. #6366f1"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-shadow focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor={catTextColorId}
              className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            >
              Text color (hex)
            </label>
            <input
              id={catTextColorId}
              type="text"
              value={categoryTextColorInput}
              onChange={(e) => {
                setCategoryTextColorInput(e.target.value);
                setCategoryMessage(null);
              }}
              placeholder="#ffffff"
              aria-description="6-digit hex color, e.g. #ffffff"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-shadow focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
          Delete Category Styles
        </button>
      </div>
    </div>
  );

  const renderBlocksCss = () => (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Blocks CSS
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Add optional CSS rules for the Blocks screen. Rules are saved locally
          on this device.
        </p>
      </div>

      <div
        className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        role="note"
      >
        Start small: save a few lines, inspect the Blocks screen, then iterate.
        You can upload snippets to append or fully replace your current custom
        CSS.
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Common selectors:{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
          #block-screen
        </code>
        ,{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
          .block-screen__title
        </code>
        ,{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
          .block-screen__row--early-morning
        </code>
        .
      </p>

      <fieldset className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
        <legend className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Quick variables
        </legend>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label
              htmlFor={earlyMorningBgId}
              className="text-xs text-zinc-600 dark:text-zinc-300"
            >
              Early morning bg
            </label>
            <input
              id={earlyMorningBgId}
              type="text"
              value={blocksEarlyMorningBg}
              onChange={(e) => setBlocksEarlyMorningBg(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none transition-shadow focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor={earlyMorningBgDarkId}
              className="text-xs text-zinc-600 dark:text-zinc-300"
            >
              Early morning bg (dark)
            </label>
            <input
              id={earlyMorningBgDarkId}
              type="text"
              value={blocksEarlyMorningBgDark}
              onChange={(e) => setBlocksEarlyMorningBgDark(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none transition-shadow focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor={afternoonBgId}
              className="text-xs text-zinc-600 dark:text-zinc-300"
            >
              Afternoon bg
            </label>
            <input
              id={afternoonBgId}
              type="text"
              value={blocksAfternoonBg}
              onChange={(e) => setBlocksAfternoonBg(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none transition-shadow focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor={afternoonBgDarkId}
              className="text-xs text-zinc-600 dark:text-zinc-300"
            >
              Afternoon bg (dark)
            </label>
            <input
              id={afternoonBgDarkId}
              type="text"
              value={blocksAfternoonBgDark}
              onChange={(e) => setBlocksAfternoonBgDark(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none transition-shadow focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onInsertBlocksVariableSnippet}
          className="mt-3 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Insert variable snippet
        </button>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label
          htmlFor={cssTextareaId}
          className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
        >
          CSS
        </label>
        <textarea
          id={cssTextareaId}
          value={blocksCssInput}
          onChange={(e) => setBlocksCssInput(e.target.value)}
          spellCheck={false}
          rows={12}
          placeholder={`.block-screen__title {\n  letter-spacing: 0.12em;\n}\n\n#block-screen .block-screen__row p:first-child {\n  font-weight: 700;\n}`}
          className="min-h-[200px] w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition-shadow focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </div>

      <input
        ref={cssFileInputRef}
        type="file"
        accept=".css,text/css,text/plain,.txt"
        onChange={onUploadBlocksCssFile}
        className="sr-only"
        aria-label="Upload CSS file"
        tabIndex={-1}
      />

      <div aria-live="polite">
        {blocksCssSavedFlash ? (
          <p
            className="text-sm text-emerald-600 dark:text-emerald-400"
            role="status"
          >
            Blocks appearance updated.
          </p>
        ) : null}
        {blocksCssUploadError ? (
          <p
            className="text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {blocksCssUploadError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSaveBlocksCss}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Save Blocks CSS
        </button>
        <button
          type="button"
          onClick={onClearBlocksCss}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => openCssUploadPicker("append")}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Upload snippet (append)
        </button>
        <button
          type="button"
          onClick={() => openCssUploadPicker("replace")}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Upload snippet (replace)
        </button>
      </div>
    </div>
  );

  const sectionContent: Record<SettingsSection, () => React.ReactNode> = {
    weather: renderWeather,
    categories: renderCategories,
    "blocks-css": renderBlocksCss,
  };

  return (
    <main
      aria-label="Settings"
      className={`flex h-full flex-col overflow-hidden ${
        modal ? "min-h-0" : "min-h-screen"
      }`}
    >
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-zinc-100 px-6 py-5 dark:border-zinc-800/60">
        <div className="flex items-center gap-3">
          <motion.div
            className="inline-block origin-center"
            initial={{ opacity: 0, x: -100, rotate: -120 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, x: -100, rotate: -120 }}
            transition={{
              duration: 0.85,
              delay: 0.1,
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
            aria-hidden="true"
          >
            <IoSettings className="text-3xl hover:animate-spin text-zinc-900 dark:text-zinc-100" />
          </motion.div>

          <h1 className="flex flex-row text-3xl font-bold font-display text-zinc-900 dark:text-zinc-100">
            {"Settings".split("").map((char, i) => (
              <motion.span
                key={`settings-char-${i}`}
                initial={{ opacity: 0, y: 5 + (i % 3) * 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: 0.3 + (i % 3) * 0.15,
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  delay: 0.15 + i * 0.08,
                }}
              >
                {char}
              </motion.span>
            ))}
          </h1>
        </div>
      </div>

      {/* ── Mobile section pills (below md) ── */}
      <nav
        aria-label="Settings sections"
        className="shrink-0 overflow-x-auto border-b border-zinc-100 px-4 py-2 md:hidden dark:border-zinc-800/60"
      >
        <div className="flex min-w-max gap-1.5">
          {SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                aria-current={isActive ? "true" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <span className="text-base">{section.icon}</span>
                {section.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Body: sidebar + content ── */}
      <div className="flex min-h-0 flex-1">
        {/* Desktop sidebar */}
        <nav
          aria-label="Settings sections"
          className="hidden w-52 shrink-0 flex-col border-r border-zinc-100 bg-zinc-50/50 p-3 md:flex dark:border-zinc-800/60 dark:bg-zinc-900/30"
        >
          <div className="flex flex-col gap-0.5">
            {SECTIONS.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                    isActive
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                      : "text-zinc-500 hover:bg-white/60 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r transition-all ${
                      isActive
                        ? "bg-blue-500 opacity-100"
                        : "opacity-0"
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className={`text-lg transition-colors ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
                    }`}
                  >
                    {section.icon}
                  </span>
                  {section.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content pane */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-6 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {sectionContent[activeSection]()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
};

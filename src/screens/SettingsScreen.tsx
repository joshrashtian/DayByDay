import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { IoSettings } from "react-icons/io5";
import {
  clearBlocksUserCss,
  getBlocksUserCss,
  setBlocksUserCss,
} from "../lib/blocksUserCss";
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

export const SettingsScreen = () => {
  const [latInput, setLatInput] = useState("");
  const [lonInput, setLonInput] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [blocksCssInput, setBlocksCssInput] = useState("");
  const [blocksCssSavedFlash, setBlocksCssSavedFlash] = useState(false);
  const [blocksCssUploadError, setBlocksCssUploadError] = useState<string | null>(
    null,
  );
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
  const [categoryConfigs, setCategoryConfigs] = useState(() => getCategoryConfigs());
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryNameInput, setCategoryNameInput] = useState("");
  const [categoryColorInput, setCategoryColorInput] = useState("#6366f1");
  const [categoryTextColorInput, setCategoryTextColorInput] = useState("#ffffff");
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
      setBlocksCssUploadError("Couldn't read that file. Try a plain .css file.");
    }
  };

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

  return (
    <main className="  min-h-screen   bg-zinc-100 p-6">
      <motion.div
        className="inline-block origin-center"
        key={Math.random()}
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
      >
        <IoSettings className="text-6xl text-zinc-900" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="text-6xl font-bold flex flex-row font-display"
      >
        {"Settings".split("").map((char, i) => (
          <motion.p
            key={i + Math.random()}
            initial={{ opacity: 0, y: 5 + Math.random() * 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: Math.random() * 0.5 + 0.2,
              type: "spring",
              stiffness: 200,
              damping: 20,
              delay: Math.random() * 0.5 + i * 0.1,
            }}
          >
            {char}
          </motion.p>
        ))}
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-2 mt-5 gap-8">
        <section className="max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-zinc-900">
            Weather location
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Optional fixed coordinates for the forecast. If unset, the app uses
            your device location when allowed, otherwise a default.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Latitude
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                placeholder="e.g. 34.0549"
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Longitude
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={lonInput}
                onChange={(e) => setLonInput(e.target.value)}
                placeholder="e.g. -118.2452"
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              />
            </label>
          </div>
          {saveError ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {saveError}
            </p>
          ) : null}
          {savedFlash ? (
            <p className="mt-3 text-sm text-emerald-600">
              Saved. Weather will refresh.
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSaveWeatherLocation}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Save coordinates
            </button>
            <button
              type="button"
              onClick={onUseDeviceLocation}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Use device location
            </button>
          </div>
        </section>

        <section className="max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:col-span-2">
          <h2 className="font-display text-lg font-semibold text-zinc-900">
            Category styles
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Customize how categories look across calendar task items.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="min-w-[220px] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
            >
              <option value="">Select category…</option>
              {availableCategories.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onStartNewCategory}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              New style
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Category name
              </span>
              <input
                type="text"
                value={categoryNameInput}
                onChange={(e) => {
                  setCategoryNameInput(e.target.value);
                  setCategoryMessage(null);
                }}
                placeholder="Work, School, Fitness…"
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Tone
              </span>
              <select
                value={categoryTone}
                onChange={(e) => setCategoryTone(e.target.value as CategoryTone)}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              >
                <option value="soft">Soft</option>
                <option value="solid">Solid</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Color (hex)
              </span>
              <input
                type="text"
                value={categoryColorInput}
                onChange={(e) => {
                  setCategoryColorInput(e.target.value);
                  setCategoryMessage(null);
                }}
                placeholder="#6366f1"
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Text color (hex)
              </span>
              <input
                type="text"
                value={categoryTextColorInput}
                onChange={(e) => {
                  setCategoryTextColorInput(e.target.value);
                  setCategoryMessage(null);
                }}
                placeholder="#ffffff"
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Icon (optional, emoji or short text)
              </span>
              <input
                type="text"
                value={categoryIconInput}
                onChange={(e) => {
                  setCategoryIconInput(e.target.value);
                  setCategoryMessage(null);
                }}
                placeholder="💼"
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              />
            </label>
          </div>
          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Preview
            </p>
            <span
              className="mt-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide"
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
              {categoryIconInput.trim() ? <span>{categoryIconInput.trim()}</span> : null}
              <span>{categoryNameInput.trim() || "Category"}</span>
            </span>
          </div>
          {categoryMessage ? (
            <p className="mt-3 text-sm text-zinc-700">{categoryMessage}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSaveCategoryStyle}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Save category style
            </button>
            <button
              type="button"
              onClick={onDeleteCategoryStyle}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Delete style
            </button>
          </div>
        </section>

        <section className="max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:col-span-2">
          <h2 className="font-display text-lg font-semibold text-zinc-900">
            Blocks custom CSS
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Optional rules for the Blocks screen. Stored on this device. Targets
            include{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs text-zinc-800">
              #block-screen
            </code>
            ,{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs text-zinc-800">
              .block-screen__title
            </code>
            ,{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs text-zinc-800">
              .block-screen__row
            </code>
            , and variant classes such as{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs text-zinc-800">
              .block-screen__row--early-morning
            </code>
            . App theme variables such as{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs text-zinc-800">
              var(--font-quantify)
            </code>{" "}
            work here.
          </p>
          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Quick variables
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-zinc-600">Early morning bg</span>
                <input
                  type="text"
                  value={blocksEarlyMorningBg}
                  onChange={(e) => setBlocksEarlyMorningBg(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-zinc-600">
                  Early morning bg (dark)
                </span>
                <input
                  type="text"
                  value={blocksEarlyMorningBgDark}
                  onChange={(e) => setBlocksEarlyMorningBgDark(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-zinc-600">Afternoon bg</span>
                <input
                  type="text"
                  value={blocksAfternoonBg}
                  onChange={(e) => setBlocksAfternoonBg(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-zinc-600">Afternoon bg (dark)</span>
                <input
                  type="text"
                  value={blocksAfternoonBgDark}
                  onChange={(e) => setBlocksAfternoonBgDark(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={onInsertBlocksVariableSnippet}
              className="mt-3 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100"
            >
              Insert variable snippet
            </button>
          </div>
          <label className="mt-4 flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              CSS
            </span>
            <textarea
              value={blocksCssInput}
              onChange={(e) => setBlocksCssInput(e.target.value)}
              spellCheck={false}
              rows={12}
              placeholder={`.block-screen__title {\n  letter-spacing: 0.12em;\n}\n\n#block-screen .block-screen__row p:first-child {\n  font-weight: 700;\n}`}
              className="min-h-[200px] w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
            />
          </label>
          <input
            ref={cssFileInputRef}
            type="file"
            accept=".css,text/css,text/plain,.txt"
            onChange={onUploadBlocksCssFile}
            className="hidden"
          />
          {blocksCssSavedFlash ? (
            <p className="mt-3 text-sm text-emerald-600">
              Blocks appearance updated.
            </p>
          ) : null}
          {blocksCssUploadError ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {blocksCssUploadError}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSaveBlocksCss}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Save Blocks CSS
            </button>
            <button
              type="button"
              onClick={onClearBlocksCss}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => openCssUploadPicker("append")}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Upload snippet (append)
            </button>
            <button
              type="button"
              onClick={() => openCssUploadPicker("replace")}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Upload snippet (replace)
            </button>
          </div>
        </section>
      </div>
    </main>
  );
};

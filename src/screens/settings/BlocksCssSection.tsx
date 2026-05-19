import { useEffect, useId, useRef, useState } from "react";
import {
  clearBlocksUserCss,
  getBlocksUserCss,
  setBlocksUserCss,
} from "../../lib/blocksUserCss";

export function BlocksCssSection() {
  const uid = useId();
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

  useEffect(() => {
    setBlocksCssInput(getBlocksUserCss());
  }, []);

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

  const cssTextareaId = `${uid}-css-textarea`;
  const earlyMorningBgId = `${uid}-em-bg`;
  const earlyMorningBgDarkId = `${uid}-em-bg-dark`;
  const afternoonBgId = `${uid}-af-bg`;
  const afternoonBgDarkId = `${uid}-af-bg-dark`;

  return (
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
}

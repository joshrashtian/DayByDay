import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { sanitizeCategoryValue } from "./categoryHelpers";

type CategoryOptionRow = {
  label: string;
  value: string;
  isCreate?: boolean;
};

type CategoryPickerProps = {
  categoryDraft: string;
  setCategoryDraft: (value: string) => void;
  categoryOptionRows: CategoryOptionRow[];
  highlightedCategoryIndex: number;
  setHighlightedCategoryIndex: (index: number) => void;
  applyCategoryToken: (value: string) => void;
};

export function CategoryPicker({
  categoryDraft,
  setCategoryDraft,
  categoryOptionRows,
  highlightedCategoryIndex,
  setHighlightedCategoryIndex,
  applyCategoryToken,
}: CategoryPickerProps) {
  const onCategoryDraftKeyDown = (
    event: ReactKeyboardEvent<HTMLInputElement>,
  ) => {
    if (!categoryOptionRows.length) {
      if (event.key === "Enter" || event.key === "Tab") {
        const fallback = sanitizeCategoryValue(categoryDraft);
        if (fallback) {
          event.preventDefault();
          applyCategoryToken(fallback);
        }
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedCategoryIndex(
        Math.min(highlightedCategoryIndex + 1, categoryOptionRows.length - 1),
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedCategoryIndex(Math.max(highlightedCategoryIndex - 1, 0));
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      const option =
        categoryOptionRows[highlightedCategoryIndex] ?? categoryOptionRows[0];
      if (option) setCategoryDraft(option.value);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const option =
        categoryOptionRows[highlightedCategoryIndex] ?? categoryOptionRows[0];
      if (option) applyCategoryToken(option.value);
      return;
    }
  };

  return (
    <div className="absolute left-3 right-3 top-0 -translate-y-full rounded-xl border border-zinc-200/80 bg-white/95 skew-x-12 shadow-lg dark:border-zinc-700 dark:bg-zinc-900/95">
      <div className="mb-2 flex items-center gap-2 p-2">
        <span className="shrink-0 text-[11px] font-semibold font-quantify -skew-x-12 uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Category
        </span>
        <input
          type="text"
          value={categoryDraft}
          onChange={(e) => setCategoryDraft(e.target.value)}
          onKeyDown={onCategoryDraftKeyDown}
          placeholder="Type category..."
          className="min-w-0 flex-1 rounded-md border -skew-x-12 border-zinc-300/70 bg-white px-2 py-1 text-xs text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </div>
      {categoryOptionRows.length ? (
        <ul className="max-h-36 overflow-y-auto rounded-md border border-zinc-200/80 bg-white/80 dark:border-zinc-700 dark:bg-zinc-900/70">
          {categoryOptionRows.map((row, index) => (
            <li key={`${row.value}-${index}`}>
              <button
                type="button"
                onMouseEnter={() => setHighlightedCategoryIndex(index)}
                onClick={() => applyCategoryToken(row.value)}
                className={`flex w-full items-center justify-between px-2 py-1.5 text-left text-xs ${
                  highlightedCategoryIndex === index
                    ? "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                <span className="truncate">{row.label}</span>
                {row.isCreate ? (
                  <span className="ml-2 shrink-0 text-[10px] uppercase font-display tracking-wide text-zinc-500 dark:text-zinc-400">
                    New Category
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Start typing a category value.
        </p>
      )}
      <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
        Arrow keys to navigate, Tab to autocomplete, Enter to apply.
      </p>
    </div>
  );
}

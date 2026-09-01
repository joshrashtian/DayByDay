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
    <div className="absolute left-3 right-3 top-0 -translate-y-full rounded-xl border border-line/80 bg-surface/95 skew-x-12 shadow-lg dark:bg-overlay">
      <div className="mb-2 flex items-center gap-2 p-2">
        <span className="shrink-0 text-[11px] font-semibold font-quantify -skew-x-12 uppercase tracking-wide text-muted">
          Category
        </span>
        <input
          type="text"
          value={categoryDraft}
          onChange={(e) => setCategoryDraft(e.target.value)}
          onKeyDown={onCategoryDraftKeyDown}
          placeholder="Type category..."
          className="min-w-0 flex-1 rounded-md border -skew-x-12 border-line-strong/70 bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-line-strong"
        />
      </div>
      {categoryOptionRows.length ? (
        <ul className="max-h-36 overflow-y-auto rounded-md border border-line/80 bg-surface/80 dark:bg-overlay">
          {categoryOptionRows.map((row, index) => (
            <li key={`${row.value}-${index}`}>
              <button
                type="button"
                onMouseEnter={() => setHighlightedCategoryIndex(index)}
                onClick={() => applyCategoryToken(row.value)}
                className={`flex w-full items-center justify-between px-2 py-1.5 text-left text-xs ${
                  highlightedCategoryIndex === index
                    ? "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200"
                    : "text-muted hover:bg-sunken"
                }`}
              >
                <span className="truncate">{row.label}</span>
                {row.isCreate ? (
                  <span className="ml-2 shrink-0 text-[10px] uppercase font-display tracking-wide text-muted">
                    New Category
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-muted">
          Start typing a category value.
        </p>
      )}
      <p className="mt-1 text-[10px] text-muted">
        Arrow keys to navigate, Tab to autocomplete, Enter to apply.
      </p>
    </div>
  );
}

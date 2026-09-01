import { useMemo, useState } from "react";
import { IoClose, IoSearch } from "react-icons/io5";
import {
  CATEGORY_ICON_OPTIONS,
  getCategoryIconOption,
} from "../../../lib/categoryIcons";

type Props = {
  value: string;
  onChange: (next: string) => void;
  onClear: () => void;
};

export function IconPicker({ value, onChange, onClear }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return CATEGORY_ICON_OPTIONS;
    return CATEGORY_ICON_OPTIONS.filter((option) => {
      const haystack = [option.label, option.id, ...option.keywords]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query]);

  const selected = getCategoryIconOption(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <IoSearch
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
            aria-hidden
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons..."
            className="w-full rounded-lg border border-line bg-sunken py-2 pl-9 pr-3 text-sm text-ink outline-none ring-line-strong focus:ring-2"
          />
        </div>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded-lg border border-line-strong bg-surface px-2.5 py-2 text-xs font-medium text-muted hover:bg-sunken"
        >
          <IoClose className="h-4 w-4" aria-hidden />
          Clear
        </button>
      </div>

      {selected ? (
        <p className="text-xs text-muted">
          Selected:{" "}
          <span className="inline-flex items-center gap-1 font-semibold">
            <selected.Icon className="h-4 w-4" aria-hidden />
            {selected.label}
          </span>
        </p>
      ) : value.trim() ? (
        <p className="text-xs text-muted">
          Selected custom icon:{" "}
          <span className="font-semibold text-ink">
            {value}
          </span>
        </p>
      ) : (
        <p className="text-xs text-muted">
          No icon selected.
        </p>
      )}

      <div className="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto rounded-lg border border-line bg-sunken p-2 sm:grid-cols-6">
        {filtered.map((option) => {
          const isSelected = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`group inline-flex flex-col items-center justify-center gap-1 rounded-lg border px-1.5 py-2 text-[10px] font-medium transition-colors ${
                isSelected
                  ? "border-line bg-ink text-white"
                  : "border-line-strong bg-surface text-muted hover:bg-sunken"
              }`}
              title={option.label}
              aria-label={`Use ${option.label} icon`}
              aria-pressed={isSelected}
            >
              <option.Icon className="h-4 w-4" aria-hidden />
              <span className="line-clamp-1 w-full text-center leading-tight">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

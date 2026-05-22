import { useId } from "react";

const HEX_PATTERN = /^#([0-9a-fA-F]{6})$/;

export const CATEGORY_COLOR_PRESETS = [
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#64748b",
] as const;

function normalizeHex(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!HEX_PATTERN.test(trimmed)) return undefined;
  return trimmed.toLowerCase();
}

function toNativeColorValue(hex: string, fallback: string): string {
  return normalizeHex(hex) ?? normalizeHex(fallback) ?? "#6366f1";
}

type Props = {
  value: string;
  onChange: (next: string) => void;
  presets?: readonly string[];
  "aria-label"?: string;
};

export function ColorPicker({
  value,
  onChange,
  presets = CATEGORY_COLOR_PRESETS,
  "aria-label": ariaLabel = "Color",
}: Props) {
  const uid = useId();
  const swatchId = `${uid}-swatch`;
  const hexId = `${uid}-hex`;
  const nativeValue = toNativeColorValue(value, presets[0]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label
          htmlFor={swatchId}
          className="relative inline-flex h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-zinc-200 ring-2 ring-transparent transition-shadow hover:ring-zinc-300 focus-within:ring-blue-500 dark:border-zinc-700 dark:hover:ring-zinc-600"
          style={{ backgroundColor: nativeValue }}
          title="Pick a color"
        >
          <input
            id={swatchId}
            type="color"
            value={nativeValue}
            onChange={(e) => onChange(e.target.value.toLowerCase())}
            aria-label={ariaLabel}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <input
          id={hexId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#6366f1"
          spellCheck={false}
          aria-label={`${ariaLabel} hex value`}
          className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-shadow focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>
      <div
        className="flex flex-wrap gap-1.5"
        role="listbox"
        aria-label={`${ariaLabel} presets`}
      >
        {presets.map((preset) => {
          const isSelected = normalizeHex(value) === preset;
          return (
            <button
              key={preset}
              type="button"
              role="option"
              aria-selected={isSelected}
              aria-label={preset}
              title={preset}
              onClick={() => onChange(preset)}
              className={`h-7 w-7 rounded-md border transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                isSelected
                  ? "border-zinc-900 ring-2 ring-zinc-900/30 dark:border-zinc-100 dark:ring-zinc-100/30"
                  : "border-zinc-200/80 dark:border-zinc-600"
              }`}
              style={{ backgroundColor: preset }}
            />
          );
        })}
      </div>
    </div>
  );
}

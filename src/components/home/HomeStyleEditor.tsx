import {
  blockStyleRegistry,
  ribbonStyleRegistry,
  tasksStyleRegistry,
  useHomeThemeList,
  useSectionStyleList,
} from "../../themes";
import type {
  BlockVisualStyle,
  HomeVisualPrefs,
  RibbonVisualStyle,
  TasksVisualStyle,
} from "@/types";

type HomeStyleEditorProps = {
  prefs: HomeVisualPrefs;
  onPrefsChange: (
    prefs: HomeVisualPrefs | ((prev: HomeVisualPrefs) => HomeVisualPrefs),
  ) => void;
  layout?: "sheet" | "window";
};

type SizePreset = { id: string; label: string; value: number };

const CLOCK_SIZE_PRESETS: SizePreset[] = [
  { id: "small", label: "Small", value: 0.9 },
  { id: "medium", label: "Medium", value: 1 },
  { id: "large", label: "Large", value: 1.2 },
];

const BLOCK_SIZE_PRESETS: SizePreset[] = [
  { id: "small", label: "Small", value: 0.9 },
  { id: "medium", label: "Medium", value: 1 },
  { id: "large", label: "Large", value: 1.15 },
];

const RIBBON_SIZE_PRESETS: SizePreset[] = [
  { id: "small", label: "Small", value: 0.92 },
  { id: "medium", label: "Medium", value: 1 },
  { id: "large", label: "Large", value: 1.12 },
];

const TASKS_SIZE_PRESETS: SizePreset[] = [
  { id: "small", label: "Small", value: 0.94 },
  { id: "medium", label: "Medium", value: 1 },
  { id: "large", label: "Large", value: 1.1 },
];

const STYLE_CARD_SWATCH: Record<string, string> = {
  minimal: "from-blue-600 to-blue-500",
  p5: "from-zinc-900 via-blue-700 to-black",
  basic: "from-sky-200 to-blue-400",
  terminal: "from-zinc-950 to-emerald-700",
  orbit: "from-amber-200 to-orange-400",
  neon: "from-fuchsia-600 via-zinc-950 to-cyan-500",
  editorial: "from-zinc-100 to-zinc-300",
};

function themeSwatch(themeId: string, swatch: string) {
  return STYLE_CARD_SWATCH[themeId] ?? swatch;
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
      {children}
    </h3>
  );
}

function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <SectionTitle>{label}</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={selected}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                selected
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SizePresetRow({
  label,
  presets,
  value,
  onChange,
}: {
  label: string;
  presets: SizePreset[];
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <SectionTitle>{label}</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const selected = Math.abs(preset.value - value) < 0.01;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.value)}
              aria-pressed={selected}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                selected
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function HomeStyleEditor({
  prefs,
  onPrefsChange,
  layout = "sheet",
}: HomeStyleEditorProps) {
  const themeList = useHomeThemeList();
  const blockStyleOptions = useSectionStyleList(blockStyleRegistry);
  const ribbonStyleOptions = useSectionStyleList(ribbonStyleRegistry);
  const tasksStyleOptions = useSectionStyleList(tasksStyleRegistry);

  const setClockStyle = (clockStyle: string) =>
    onPrefsChange((prev) => ({ ...prev, clockStyle }));

  const themeGridClassName =
    layout === "window"
      ? "grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4"
      : "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7";

  const sectionsClassName =
    layout === "window"
      ? "grid gap-6 lg:grid-cols-2"
      : "flex flex-col gap-5";

  return (
    <div className="flex flex-col gap-6 pb-2">
      <div className="flex flex-col gap-3">
        <div>
          <SectionTitle>Page Theme</SectionTitle>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Applies to the whole home page — background, mood, and clock.
          </p>
        </div>
        <div className={themeGridClassName}>
          {themeList.map((option) => {
            const selected = prefs.clockStyle === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setClockStyle(option.id)}
                aria-pressed={selected}
                className={`style-card flex flex-col overflow-hidden rounded-xl border text-left transition-all ${
                  selected
                    ? "border-zinc-900 ring-2 ring-zinc-900/20 dark:border-white dark:ring-white/20"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                }`}
              >
                <div
                  className={`h-14 bg-gradient-to-br ${themeSwatch(option.id, option.swatch)}`}
                  aria-hidden
                />
                <div className="flex flex-col gap-0.5 px-3 py-2.5">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {option.label}
                  </span>
                  <span className="line-clamp-2 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                    {option.description}
                  </span>
                  {selected ? (
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Active
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <SizePresetRow
        label="Clock Size"
        presets={CLOCK_SIZE_PRESETS}
        value={prefs.clockScale}
        onChange={(clockScale) =>
          onPrefsChange((prev) => ({ ...prev, clockScale }))
        }
      />

      <div className="border-t border-zinc-100 pt-5 dark:border-zinc-800">
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Fine-tune individual sections. Default, Card, and Minimal task
            styles automatically match your page theme.
          </p>
        <div className={sectionsClassName}>
          <div className="flex flex-col gap-5">
            <ChipGroup<BlockVisualStyle>
              label="Block Banner"
              value={prefs.blockStyle}
              onChange={(blockStyle) =>
                onPrefsChange((prev) => ({ ...prev, blockStyle }))
              }
              options={blockStyleOptions}
            />
            <SizePresetRow
              label="Block Size"
              presets={BLOCK_SIZE_PRESETS}
              value={prefs.blockScale}
              onChange={(blockScale) =>
                onPrefsChange((prev) => ({ ...prev, blockScale }))
              }
            />
          </div>

          <div className="flex flex-col gap-5">
            <ChipGroup<RibbonVisualStyle>
              label="Critical Ribbon"
              value={prefs.ribbonStyle}
              onChange={(ribbonStyle) =>
                onPrefsChange((prev) => ({ ...prev, ribbonStyle }))
              }
              options={ribbonStyleOptions}
            />
            <SizePresetRow
              label="Ribbon Size"
              presets={RIBBON_SIZE_PRESETS}
              value={prefs.ribbonScale}
              onChange={(ribbonScale) =>
                onPrefsChange((prev) => ({ ...prev, ribbonScale }))
              }
            />
          </div>

          <div className="flex flex-col gap-5 lg:col-span-2">
            <ChipGroup<TasksVisualStyle>
              label="Task Focus Panel"
              value={prefs.tasksStyle}
              onChange={(tasksStyle) =>
                onPrefsChange((prev) => ({ ...prev, tasksStyle }))
              }
              options={tasksStyleOptions}
            />
            <SizePresetRow
              label="Tasks Size"
              presets={TASKS_SIZE_PRESETS}
              value={prefs.tasksScale}
              onChange={(tasksScale) =>
                onPrefsChange((prev) => ({ ...prev, tasksScale }))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

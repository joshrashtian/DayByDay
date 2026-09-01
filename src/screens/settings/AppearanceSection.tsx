import { IoContrast, IoMoon, IoSunny } from "react-icons/io5";
import { useSettingsStore } from "@/stores/settingsStore";
import type { ThemePreference } from "@/lib/appTheme";

const OPTIONS: {
  id: ThemePreference;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "light",
    label: "Light",
    description: "Always light, whatever the system is set to.",
    icon: <IoSunny />,
  },
  {
    id: "dark",
    label: "Dark",
    description: "Always dark, whatever the system is set to.",
    icon: <IoMoon />,
  },
  {
    id: "system",
    label: "System",
    description: "Follow your macOS appearance setting.",
    icon: <IoContrast />,
  },
];

export function AppearanceSection() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">
          Appearance
        </h2>
        <p className="mt-1 text-sm text-muted">
          Choose how RiseByDay looks.
        </p>
      </div>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Theme
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {OPTIONS.map((option) => {
            const selected = theme === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setTheme(option.id)}
                aria-pressed={selected}
                className={`flex flex-col gap-1.5 rounded-xl border p-4 text-left transition-colors ${
                  selected
                    ? "border-accent bg-accent-soft"
                    : "border-line bg-surface hover:border-line-strong"
                }`}
              >
                <span
                  className={`text-xl ${selected ? "text-accent" : "text-muted"}`}
                  aria-hidden
                >
                  {option.icon}
                </span>
                <span className="text-sm font-semibold text-ink">
                  {option.label}
                </span>
                <span className="text-[11px] leading-snug text-muted">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

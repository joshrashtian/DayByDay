import { useSettings } from "@/providers/SettingsProvider";
import { NON_HOME_SECTIONS } from "./sections";

export default function HomeSection() {
  const { navigate } = useSettings();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Settings
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Choose a section to configure RiseByDay.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {NON_HOME_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => navigate(section.id)}
            className="group flex items-start gap-3 rounded-2xl border border-zinc-200/80 bg-white/70 p-4 text-left transition-all hover:border-blue-300 hover:bg-white hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:border-blue-500/60 dark:hover:bg-zinc-900"
          >
            <span className="mt-0.5 text-2xl text-blue-600 transition-colors group-hover:text-blue-700 dark:text-blue-400">
              {section.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {section.label}
              </span>
              <span className="mt-0.5 block text-sm text-zinc-500 dark:text-zinc-400">
                {section.description}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

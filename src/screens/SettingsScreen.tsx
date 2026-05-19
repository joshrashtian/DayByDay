import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import {
  IoCloudOutline,
  IoColorPaletteOutline,
  IoBrushOutline,
  IoSettings,
} from "react-icons/io5";
import { WeatherSection } from "./settings/WeatherSection";
import { CategoriesSection } from "./settings/CategoriesSection";
import { BlocksCssSection } from "./settings/BlocksCssSection";

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
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("weather");

  const sectionContent: Record<SettingsSection, () => React.ReactNode> = {
    weather: () => <WeatherSection />,
    categories: () => <CategoriesSection />,
    "blocks-css": () => <BlocksCssSection />,
  };

  return (
    <main
      aria-label="Settings"
      className={`flex h-full flex-col overflow-hidden ${
        modal ? "min-h-0" : "min-h-screen"
      }`}
    >
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

      <div className="flex min-h-0 flex-1">
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

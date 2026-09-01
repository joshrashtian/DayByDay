import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { IoSettings, IoChevronBackOutline } from "react-icons/io5";
import { WeatherSection } from "./settings/WeatherSection";
import { CategoriesSection } from "./settings/CategoriesSection";
import { ConnectedCalendarsSection } from "./settings/ConnectedCalendarsSection";
import { ProfileSection } from "./settings/ProfileSection";
import { AudioSection } from "./settings/AudioSection";
import { AppearanceSection } from "./settings/AppearanceSection";
import HomeSection from "./settings/HomeSection";
import { SettingsProvider, useSettings } from "@/providers/SettingsProvider";
import { DEFAULT_SECTION, SECTIONS } from "./settings/sections";
import type { SettingsSection } from "./settings/sections";

export const SettingsScreen = ({ modal = false }: { modal?: boolean }) => {
  return (
    <SettingsProvider initialPage={DEFAULT_SECTION}>
      <SettingsScreenContent modal={modal} />
    </SettingsProvider>
  );
};

const SettingsScreenContent = ({ modal = false }: { modal?: boolean }) => {
  const { currentPage, navigate } = useSettings();
  const activeSection = (currentPage || DEFAULT_SECTION) as SettingsSection;
  const [appVersion, setAppVersion] = useState<string | null>(null);

  useEffect(() => {
    getVersion()
      .then(setAppVersion)
      .catch(() => setAppVersion(null));
  }, []);

  const sectionContent: Record<SettingsSection, () => React.ReactNode> = {
    home: () => <HomeSection />,
    appearance: () => <AppearanceSection />,
    weather: () => <WeatherSection />,
    categories: () => <CategoriesSection />,
    profile: () => <ProfileSection />,
    "connected-calendars": () => <ConnectedCalendarsSection />,
    audio: () => <AudioSection />,
  };

  return (
    <main
      aria-label="Settings"
      className={`flex h-full flex-col overflow-hidden ${
        modal ? "min-h-0" : "min-h-screen"
      }`}
    >
      <div className="shrink-0 border-b border-line px-6 py-5">
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
            <IoSettings className="text-3xl hover:animate-spin text-ink" />
          </motion.div>

          <h1 className="flex flex-row text-3xl font-bold font-display text-ink">
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
          {appVersion && (
            <p className="mt-1 text-xs font-medium text-faint">
              {`v${appVersion}`}
            </p>
          )}
        </div>
      </div>

      <nav
        aria-label="Settings sections"
        className="shrink-0 overflow-x-auto border-b border-line px-4 py-2 md:hidden"
      >
        <div className="flex min-w-max gap-1.5">
          {SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => navigate(section.id)}
                aria-current={isActive ? "true" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                    : "text-muted hover:bg-sunken hover:text-ink"
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
        {/*  <nav
          aria-label="Settings sections"
          className="hidden w-52 shrink-0 flex-col border-r border-line bg-sunken/50 p-3 md:flex dark:bg-overlay"
        >
          <div className="flex flex-col gap-0.5">
            {SECTIONS.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => navigate(section.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                    isActive
                      ? "bg-surface text-ink shadow-sm"
                      : "text-muted hover:bg-surface/60 hover:text-ink"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r transition-all ${
                      isActive ? "bg-blue-500 opacity-100" : "opacity-0"
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className={`text-lg transition-colors ${
                      isActive
                        ? "text-accent"
                        : "text-faint group-hover:text-muted"
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
*/}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-6 py-6">
            {activeSection !== "home" && (
              <button
                type="button"
                onClick={() => navigate("home")}
                className="mb-4 inline-flex items-center gap-1 rounded-lg px-2 py-1 -ml-2 text-sm font-medium text-muted transition-colors hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                <IoChevronBackOutline aria-hidden="true" />
                Back to Settings
              </button>
            )}
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

import { motion } from "motion/react";
import Kbd from "../ui/kbd";
import { IoHelpCircle } from "react-icons/io5";

function ShortcutRow({
  keys,
  description,
}: {
  keys: React.ReactNode;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">{keys}</div>
      <p className="text-zinc-700 dark:text-zinc-300">{description}</p>
    </div>
  );
}

const helpSections = [
  { id: "task-chat-composer", label: "Task Chat Composer" },
  { id: "keys", label: "Keys" },
  { id: "examples", label: "Examples" },
];

const HelpScreen = () => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col items-start justify-start gap-4 overflow-x-hidden p-4">
      <motion.div
        className="relative translate-x-4 -mx-4 w-[calc(100%+2rem)] max-w-none origin-right overflow-hidden rounded-2xl p-4 text-blue-500 before:absolute before:inset-0 before:z-0 before:rounded-2xl before:bg-blue-500 before:content-[''] -rotate-4"
        initial={{ opacity: 0, x: -100, rotate: 24 }}
        animate={{ opacity: 1, x: 0, rotate: 0 }}
        exit={{ opacity: 0, x: -100, rotate: 24 }}
        transition={{
          duration: 0.85,
          type: "spring",
          stiffness: 200,
          damping: 20,
          ease: "easeOut",
        }}
      >
        <IoHelpCircle className="relative z-10 text-8xl text-white" />
        <motion.p
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="relative z-10 flex flex-row font-quantify text-6xl font-bold text-white"
        >
          HELP CENTER
        </motion.p>
      </motion.div>

      <div className="mt-20 flex w-full max-w-6xl flex-col items-start justify-start gap-10 lg:flex-row">
        <div className="w-full max-w-2xl flex-1 space-y-8">
          <section id="task-chat-composer" className="scroll-mt-20 flex flex-col gap-4">
          <h3 className="text-2xl font-quantify">Task Chat Composer</h3>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            In the chat-style task box, type tokens at the{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              start of the line
            </span>{" "}
            before your title. You can chain several tokens; everything after
            them becomes the task name.
          </p>

          <div className="flex flex-col gap-3">
            <ShortcutRow
              keys={<Kbd className="bg-gray-200 font-display">!!</Kbd>}
              description="Mark the task as critical."
            />
            <ShortcutRow
              keys={
                <>
                  <Kbd className="bg-gray-200 font-display">!</Kbd>
                  <span className="text-xs text-zinc-500">or</span>
                  <Kbd className="bg-gray-200 font-display">!high</Kbd>
                  <Kbd className="bg-gray-200 font-display">!h</Kbd>
                  <span className="text-xs text-zinc-500">/</span>
                  <Kbd className="bg-gray-200 font-display">!medium</Kbd>
                  <Kbd className="bg-gray-200 font-display">!m</Kbd>
                  <span className="text-xs text-zinc-500">/</span>
                  <Kbd className="bg-gray-200 font-display">!low</Kbd>
                  <Kbd className="bg-gray-200 font-display">!l</Kbd>
                </>
              }
              description="Set priority. A bare ! means high priority."
            />
            <ShortcutRow
              keys={
                <>
                  <Kbd className="bg-gray-200 font-display">%</Kbd>
                  <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                    block
                  </span>
                </>
              }
              description='Assign a block segment (e.g. %Early Morning, %work, or quoted custom: %"Deep Work").'
            />
            <ShortcutRow
              keys={
                <>
                  <Kbd className="bg-gray-200 font-display">@@</Kbd>
                  <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                    name
                  </span>
                </>
              }
              description="Category (letters, digits, dot, hyphen)."
            />
            <ShortcutRow
              keys={
                <>
                  <Kbd className="bg-gray-200 font-display">#</Kbd>
                  <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                    tag
                  </span>
                </>
              }
              description="Add a tag; repeat with another # for more tags."
            />
            <ShortcutRow
              keys={
                <>
                  <Kbd className="bg-gray-200 font-display">@</Kbd>
                  <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                    when
                  </span>
                </>
              }
              description="Due date or time: ISO datetime, today, tomorrow, tonight, a time like 3pm or 15:00, or a date like 4/16/2026 or 4/16. Or, combined it could be 4/163:00pm"
            />
          </div>
          </section>

          <section id="keys" className="scroll-mt-20 flex flex-col gap-3">
          <h3 className="text-xl font-bold">Keys</h3>
          <div className="flex flex-col gap-3">
            <ShortcutRow
              keys={<Kbd className="bg-gray-200 font-display">Enter</Kbd>}
              description="Create the task (chat composer)."
            />
            <ShortcutRow
              keys={
                <>
                  <Kbd className="bg-gray-200 font-display">Shift</Kbd>
                  <span className="text-xs text-zinc-500">+</span>
                  <Kbd className="bg-gray-200 font-display">Enter</Kbd>
                </>
              }
              description="New line in the chat composer."
            />
          </div>
          </section>

          <section id="examples" className="scroll-mt-20 flex flex-col gap-2">
          <h3 className="text-xl font-bold">Examples</h3>
          <ul className="list-inside list-disc space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
            <li>
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[13px] dark:bg-zinc-800">
                !high @tomorrow Call the dentist
              </code>
            </li>
            <li>
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[13px] dark:bg-zinc-800">
                %work @@engineering #bug Fix login redirect
              </code>
            </li>
            <li>
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[13px] dark:bg-zinc-800">
                !! @tonight Ship hotfix
              </code>
            </li>
          </ul>
          </section>
        </div>

        <aside className="sticky top-5 hidden w-full max-w-[240px] self-start rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm backdrop-blur lg:block dark:border-zinc-800 dark:bg-zinc-900/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            On this page
          </p>
          <nav className="mt-3 flex flex-col gap-2">
            {helpSections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                className="rounded-md px-2 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-zinc-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
              >
                {section.label}
              </button>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
};

export default HelpScreen;

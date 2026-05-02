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

function SectionCard({
  title,
  subtitle,
  children,
  id,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
      {subtitle ? (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

const helpSections = [
  { id: "quick-start", label: "Quick Start" },
  { id: "task-chat-composer", label: "Composer Tokens" },
  { id: "dates-and-times", label: "Dates & Times" },
  { id: "keys", label: "Keyboard" },
  { id: "common-mistakes", label: "Troubleshooting" },
  { id: "examples", label: "Examples" },
];

const HelpScreen = () => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col items-start justify-start gap-5 overflow-x-hidden p-4">
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

      <div className="w-full overflow-x-auto pb-1 lg:hidden">
        <div className="flex min-w-max gap-2">
          {helpSections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-blue-700/60 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-14 flex w-full max-w-6xl flex-col items-start justify-start gap-10 lg:flex-row">
        <div className="w-full max-w-3xl flex-1 space-y-5">
          <SectionCard
            id="quick-start"
            title="Quick Start"
            subtitle="The fastest way to create useful tasks from the composer."
          >
            <ol className="ml-4 list-decimal space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              <li>Type optional tokens first (priority, due date, tags, category).</li>
              <li>Write your task title at the end of the line.</li>
              <li>Press <Kbd className="bg-gray-200 font-display">Enter</Kbd> to create it.</li>
              <li>Use one line per task for cleaner parsing and easier edits.</li>
            </ol>
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
              Tip: tokens can appear in any order, but placing them before the title keeps
              entries readable and reduces mistakes.
            </div>
          </SectionCard>

          <SectionCard
            id="task-chat-composer"
            title="Task Chat Composer Tokens"
            subtitle="Add metadata inline while writing the task."
          >
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
                description="Set priority. A bare ! defaults to high."
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
                description='Assign a block segment (for example %work or %"Deep Work").'
              />
              <ShortcutRow
                keys={
                  <>
                    <Kbd className="bg-gray-200 font-display">@@</Kbd>
                    <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                      category
                    </span>
                  </>
                }
                description="Set a category. Good for areas like @@health or @@engineering."
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
                description="Add tags for filtering. Repeat # to include more."
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
                description="Set due date/time such as @today, @tomorrow, @3pm, @15:00, or @4/16."
              />
            </div>
          </SectionCard>

          <SectionCard
            id="dates-and-times"
            title="Dates & Times Cheat Sheet"
            subtitle="Common formats the parser understands."
          >
            <div className="grid gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <p>
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[13px] dark:bg-zinc-800">
                  @today
                </code>{" "}
                or{" "}
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[13px] dark:bg-zinc-800">
                  @tomorrow
                </code>{" "}
                for quick due dates.
              </p>
              <p>
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[13px] dark:bg-zinc-800">
                  @3pm
                </code>{" "}
                or{" "}
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[13px] dark:bg-zinc-800">
                  @15:00
                </code>{" "}
                for time-only reminders.
              </p>
              <p>
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[13px] dark:bg-zinc-800">
                  @4/16
                </code>{" "}
                or{" "}
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[13px] dark:bg-zinc-800">
                  @4/16/2026
                </code>{" "}
                for specific dates.
              </p>
              <p>
                You can combine date and time in one token, like{" "}
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[13px] dark:bg-zinc-800">
                  @4/16 3:00pm
                </code>
                .
              </p>
            </div>
          </SectionCard>

          <SectionCard
            id="keys"
            title="Keyboard"
            subtitle="Useful keys while typing in the composer."
          >
            <div className="flex flex-col gap-3">
              <ShortcutRow
                keys={<Kbd className="bg-gray-200 font-display">Enter</Kbd>}
                description="Create the task immediately."
              />
              <ShortcutRow
                keys={
                  <>
                    <Kbd className="bg-gray-200 font-display">Shift</Kbd>
                    <span className="text-xs text-zinc-500">+</span>
                    <Kbd className="bg-gray-200 font-display">Enter</Kbd>
                  </>
                }
                description="Insert a newline without creating the task."
              />
            </div>
          </SectionCard>

          <SectionCard
            id="common-mistakes"
            title="Troubleshooting"
            subtitle="If a token is not being recognized, check these first."
          >
            <ul className="list-inside list-disc space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              <li>Keep tokens attached to their prefixes (for example, use #bug not # bug).</li>
              <li>For multi-word blocks, wrap in quotes: <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[13px] dark:bg-zinc-800">%"Deep Work"</code>.</li>
              <li>If date parsing fails, try a simpler format like @today or @4/16 first.</li>
              <li>When in doubt, keep the title plain text after all tokens.</li>
            </ul>
          </SectionCard>

          <SectionCard
            id="examples"
            title="Examples"
            subtitle="Real composer lines you can copy and tweak."
          >
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
                  !! @tonight #"release-blocker" Ship hotfix
                </code>
              </li>
              <li>
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[13px] dark:bg-zinc-800">
                  %&quot;Deep Work&quot; @4/16 3:00pm #focus Plan Q3 architecture notes
                </code>
              </li>
            </ul>
          </SectionCard>
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

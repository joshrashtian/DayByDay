import { motion } from "motion/react";
import { TasksWorkspace } from "./TasksWorkspace";
import { TasksBreadcrumb } from "./TasksBreadcrumb";
import { Link } from "react-router-dom";
import { IoPricetagsOutline } from "react-icons/io5";

export function TasksMainPage() {
  return (
    <>
      <TasksBreadcrumb items={[{ label: "Your Tasks" }]} />
      <header className="shrink-0 px-5 pb-2 pt-2 sm:px-8">
        <div className="mx-auto flex w-full max-w-3xl items-end justify-between gap-3 xl:max-w-4xl">
          <motion.h1 className="font-display flex flex-row text-4xl font-bold tracking-tight text-ink">
            {"Your  Tasks".split("").map((char, i) => (
              <motion.span
                key={`${char}-${i}`}
                initial={{ opacity: 0, y: 10, rotate: -30 + Math.random() * 60 }}
                animate={{ opacity: 1, y: 0, rotate: Math.random() }}
                exit={{ opacity: 0, y: 10, rotate: -30 + Math.random() * -60 }}
                transition={{ duration: 0.5, ease: "easeInOut", delay: i * 0.1 }}
              >
                {char}
              </motion.span>
            ))}
          </motion.h1>
          <Link
            to="/tasks/categories"
            className="inline-flex items-center gap-1.5 rounded-full border border-line/70 bg-surface/50 px-3 py-1.5 text-xs font-semibold text-muted ring-1 ring-line/30 backdrop-blur-xl transition-colors hover:bg-surface/80"
          >
            <IoPricetagsOutline className="h-3.5 w-3.5" aria-hidden />
            Categories
          </Link>
        </div>
      </header>
      <TasksWorkspace
        topPadding="none"
        contentWidth="wide"
        composerLayout="none"
      />
    </>
  );
}

import { TasksWorkspace } from "../components/tasks/TasksWorkspace";
import { motion } from "motion/react";
const TasksScreen = () => (
  <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
    <header className="shrink-0 px-5 pt-6 sm:px-8 sm:pt-8">
      <div className="mx-auto w-full max-w-3xl text-left xl:max-w-4xl">
        <motion.h1 className="font-display flex flex-row  text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {"Your  Tasks".split("").map((char, i) => (
            <motion.p
              initial={{ opacity: 0, y: 10, rotate: -30 + Math.random() * 60 }}
              animate={{ opacity: 1, y: 0, rotate: Math.random() }}
              exit={{ opacity: 0, y: 10, rotate: -30 + Math.random() * -60 }}
              transition={{ duration: 0.5, ease: "easeInOut", delay: i * 0.1 }}
            >
              {char}
            </motion.p>
          ))}
        </motion.h1>
      </div>
    </header>

    <TasksWorkspace
      topPadding="none"
      contentWidth="wide"
      composerLayout="bottomChat"
    />
  </div>
);

export default TasksScreen;

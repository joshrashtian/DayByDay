import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BLOCKS_USER_CSS_CHANGED,
  BLOCKS_USER_CSS_STORAGE_KEY,
  getBlocksUserCss,
} from "../lib/blocksUserCss";
import {
  collectTaskBlocks,
  CONTEXT_BLOCK_SUGGESTIONS,
  TIME_BLOCK_SUGGESTIONS,
} from "../lib/taskBlocks";
import { useTasksStore } from "../stores/tasksStore";
import "./BlockScreen.css";
import BottomSheet from "../ui/BottomSheet";
import { IoAdd } from "react-icons/io5";

type BlockRowVariant =
  | "early-morning"
  | "morning"
  | "afternoon"
  | "evening"
  | "night";

type Block = {
  name: string;
  description: string | null;
  taskCount: number;
  rowVariant?: BlockRowVariant;
};

const rowClassName = (variant?: BlockRowVariant) => {
  const base = "block-screen__row";
  if (variant === "early-morning")
    return `${base} block-screen__row--early-morning`;
  return base;
};

const BlockScreen = () => {
  const [userCss, setUserCss] = useState(() => getBlocksUserCss());
  const userStyleRef = useRef<HTMLStyleElement>(null);
  const tasks = useTasksStore((s) => s.tasks);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  useLayoutEffect(() => {
    const el = userStyleRef.current;
    if (el) el.textContent = userCss;
  }, [userCss]);

  useEffect(() => {
    const sync = () => setUserCss(getBlocksUserCss());
    window.addEventListener(BLOCKS_USER_CSS_CHANGED, sync);
    const onStorage = (e: StorageEvent) => {
      if (e.key === BLOCKS_USER_CSS_STORAGE_KEY || e.key === null) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(BLOCKS_USER_CSS_CHANGED, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const blockNames = collectTaskBlocks(tasks);
  const blocks: Block[] = blockNames.map((name) => {
    const inBlock = tasks.filter(
      (task) => task.block?.trim().toLowerCase() === name.toLowerCase(),
    );
    const openTitles = inBlock
      .filter((task) => !task.done)
      .map((task) => task.title)
      .slice(0, 3);
    const desc =
      openTitles.length > 0
        ? openTitles.join(" • ")
        : inBlock.length > 0
          ? "All tasks in this block are complete."
          : null;
    return {
      name,
      description: desc,
      taskCount: inBlock.length,
      rowVariant:
        name.toLowerCase() === "early morning" ? "early-morning" : undefined,
    };
  });
  return (
    <>
      {/* User rules from Settings; textContent assigned in useLayoutEffect */}
      <style ref={userStyleRef} id="daybyday-blocks-user-css" />
      <div id="block-screen" className="block-screen">
        <button
          onClick={() => {
            setBottomSheetOpen(true);
          }}
          className="rounded-full bg-zinc-500/15 w-16 h-16 flex text-center items-center justify-center text-5xl font-semibold text-zinc-700 dark:text-zinc-300"
        >
          +
        </button>
        <h1 className="block-screen__title">Blocks</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Segment tasks by time blocks (like Morning) or life blocks (like Work,
          School, Home). Set a block while creating a task.
        </p>
        <div className="block-screen__list">
          {blocks.length === 0 ? (
            <div className="block-screen__row flex flex-col items-start justify-start gap-2">
              <h2 className="block-screen__row--title text-xl font-quantify font-black">
                No blocks yet
              </h2>
              <p className="block-screen__row--description text-zinc-500">
                Add a task block from the task creator to start segmenting your
                day.
              </p>
              <p className="block-screen__row--description text-zinc-500">
                Time suggestions: {TIME_BLOCK_SUGGESTIONS.join(", ")}.
              </p>
              <p className="block-screen__row--description text-zinc-500">
                Context suggestions: {CONTEXT_BLOCK_SUGGESTIONS.join(", ")}.
              </p>
            </div>
          ) : null}
          {blocks.map((block) => (
            <div
              key={block.name}
              className={
                rowClassName(block.rowVariant) +
                " flex flex-col items-start justify-start gap-2"
              }
            >
              <div className="flex flex-row items-center gap-2">
                <h2 className="block-screen__row--title">{block.name}</h2>
                <span className="rounded-full bg-zinc-500/15 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {block.taskCount} {block.taskCount === 1 ? "task" : "tasks"}
                </span>
              </div>
              {block.description ? (
                <p className="block-screen__row--description text-zinc-500">
                  {block.description}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <BottomSheet
        snapPoints={["peek", "half", "full"]}
        open={bottomSheetOpen}
        onClose={() => setBottomSheetOpen(false)}
        title="Add Block"
        titleClassName="font-display"
        titleIcon={<IoAdd />}
      >
        <div className="flex flex-col gap-1">
          <div className="flex min-h-11 items-center gap-3 rounded-xl border border-zinc-200/90 bg-zinc-50/90 px-3 py-2 dark:border-zinc-700/90 dark:bg-zinc-800/40">
            <label
              htmlFor="add-block-name"
              className="shrink-0 text-sm font-medium text-zinc-500 dark:text-zinc-400"
            >
              Block name
            </label>
            <input
              id="add-block-name"
              type="text"
              name="blockName"
              autoComplete="off"
              placeholder="Morning, Work…"
              className="min-w-0 flex-1 border-0 bg-transparent py-0.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            <button
              type="button"
              className="shrink-0 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Add
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
};

export default BlockScreen;

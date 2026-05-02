import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BLOCKS_USER_CSS_CHANGED,
  BLOCKS_USER_CSS_STORAGE_KEY,
  getBlocksUserCss,
} from "../lib/blocksUserCss";
import {
  BLOCK_CONFIGS_CHANGED,
  BLOCK_CONFIG_STORAGE_KEY,
  collectAvailableBlocks,
  CONTEXT_BLOCK_SUGGESTIONS,
  formatMinutesAsTimeInput,
  getBlockConfigs,
  parseTimeInputToMinutes,
  removeBlockConfigByName,
  setOrUpdateBlockConfig,
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
  startTime: string;
  endTime: string;
  blockKey: string;
  customCss?: string;
  rowVariant?: BlockRowVariant;
};

const blockKeyFromName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildPerBlockCss = (configs: ReturnType<typeof getBlockConfigs>) =>
  configs
    .map((cfg) => {
      const key = blockKeyFromName(cfg.name);
      const customCss = cfg.customCss?.trim();
      if (!key || !customCss) return "";
      const baseSelector = `#block-screen .block-screen__row[data-block-key="${key}"]`;
      return `${baseSelector} {
  background: var(--blocks-${key}-bg);
  ${customCss}
}
@media (prefers-color-scheme: dark) {
  ${baseSelector} {
    background: var(--blocks-${key}-bg-dark, var(--blocks-${key}-bg));
  }
}`;
    })
    .filter(Boolean)
    .join("\n");

const rowClassName = (variant?: BlockRowVariant) => {
  const base = "block-screen__row";
  if (variant === "early-morning") {
    return `${base} block-screen__row--early-morning`;
  }
  if (variant === "afternoon") {
    return `${base} block-screen__row--afternoon`;
  }
  return base;
};

const BlockScreen = () => {
  const [userCss, setUserCss] = useState(() => getBlocksUserCss());
  const userStyleRef = useRef<HTMLStyleElement>(null);
  const perBlockStyleRef = useRef<HTMLStyleElement>(null);
  const tasks = useTasksStore((s) => s.tasks);
  const setTaskBlock = useTasksStore((s) => s.setTaskBlock);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingBlockName, setEditingBlockName] = useState<string | null>(null);
  const [blockConfigs, setBlockConfigs] = useState(() => getBlockConfigs());
  const [editorBlockName, setEditorBlockName] = useState("");
  const [editorStartTime, setEditorStartTime] = useState("08:00");
  const [editorEndTime, setEditorEndTime] = useState("12:00");
  const [editorCustomCss, setEditorCustomCss] = useState("");
  const editorBlockKey = blockKeyFromName(
    editorMode === "edit"
      ? (editingBlockName ?? editorBlockName)
      : editorBlockName,
  );

  useLayoutEffect(() => {
    const el = userStyleRef.current;
    if (el) el.textContent = userCss;
  }, [userCss]);

  useLayoutEffect(() => {
    const el = perBlockStyleRef.current;
    if (el) el.textContent = buildPerBlockCss(blockConfigs);
  }, [blockConfigs]);

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

  useEffect(() => {
    const sync = () => setBlockConfigs(getBlockConfigs());
    window.addEventListener(BLOCK_CONFIGS_CHANGED, sync);
    const onStorage = (e: StorageEvent) => {
      if (e.key === BLOCK_CONFIG_STORAGE_KEY || e.key === null) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(BLOCK_CONFIGS_CHANGED, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const blockNames = collectAvailableBlocks(tasks);
  const blocks: Block[] = blockNames.map((name) => {
    const normalizedName = name.trim().toLowerCase();
    const inBlock = tasks.filter(
      (task) => task.block?.trim().toLowerCase() === normalizedName,
    );
    const config = blockConfigs.find(
      (cfg) => cfg.name.toLowerCase() === normalizedName,
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
      startTime: formatMinutesAsTimeInput(config?.startMinutes ?? 8 * 60),
      endTime: formatMinutesAsTimeInput(config?.endMinutes ?? 12 * 60),
      blockKey: blockKeyFromName(name),
      customCss: config?.customCss,
      rowVariant:
        normalizedName === "early morning"
          ? "early-morning"
          : normalizedName === "afternoon"
            ? "afternoon"
            : undefined,
    };
  });

  const openCreateEditor = () => {
    setEditorMode("create");
    setEditingBlockName(null);
    setEditorBlockName("");
    setEditorStartTime("08:00");
    setEditorEndTime("12:00");
    setEditorCustomCss("");
    setEditorOpen(true);
  };

  const openEditEditor = (block: Block) => {
    setEditorMode("edit");
    setEditingBlockName(block.name);
    setEditorBlockName(block.name);
    setEditorStartTime(block.startTime);
    setEditorEndTime(block.endTime);
    setEditorCustomCss(block.customCss ?? "");
    setEditorOpen(true);
  };

  const saveEditor = () => {
    const rawName =
      editorMode === "edit"
        ? (editingBlockName ?? editorBlockName)
        : editorBlockName;
    const trimmed = rawName.trim();
    if (!trimmed) return;
    const startMinutes = parseTimeInputToMinutes(editorStartTime);
    const endMinutes = parseTimeInputToMinutes(editorEndTime);
    if (startMinutes == null || endMinutes == null) return;
    setOrUpdateBlockConfig({
      name: trimmed,
      startMinutes,
      endMinutes,
      customCss: editorCustomCss.trim() || undefined,
    });
    setEditorOpen(false);
  };

  const deleteBlock = () => {
    const name = editingBlockName?.trim();
    if (!name) return;
    removeBlockConfigByName(name);
    for (const task of tasks) {
      if (task.block?.trim().toLowerCase() === name.toLowerCase()) {
        setTaskBlock(task.id, undefined);
      }
    }
    setEditorOpen(false);
  };

  return (
    <>
      {/* User rules from Settings; textContent assigned in useLayoutEffect */}
      <style ref={userStyleRef} id="daybyday-blocks-user-css" />
      {/* Per-block CSS rules generated from block configs */}
      <style ref={perBlockStyleRef} id="daybyday-blocks-per-block-css" />
      <div id="block-screen" className="block-screen">
        <button
          onClick={() => {
            openCreateEditor();
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
        <div className="block-screen__list w-full">
          {blocks.length === 0 ? (
            <div className="block-screen__row flex flex-col items-start justify-start gap-2">
              <h2 className="block-screen__row--title text-xl font-quantify font-black">
                No blocks yet
              </h2>
              <p className="block-screen__row--description text-zinc-500">
                Create your own block with custom timing to start segmenting
                your day.
              </p>
              <p className="block-screen__row--description text-zinc-500">
                Suggested names: {TIME_BLOCK_SUGGESTIONS.join(", ")},{" "}
                {CONTEXT_BLOCK_SUGGESTIONS.join(", ")}.
              </p>
            </div>
          ) : null}
          {blocks.map((block) => (
            <div
              key={block.name}
              data-block-key={block.blockKey}
              className={
                rowClassName(block.rowVariant) +
                " flex flex-col h-32 w-full items-start justify-start gap-2"
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
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {block.startTime} - {block.endTime}
                </p>
                <button
                  type="button"
                  onClick={() => openEditEditor(block)}
                  className="rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Edit timing
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomSheet
        snapPoints={["peek", "half", "full"]}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editorMode === "create" ? "Create Block" : "Edit Block Timing"}
        titleClassName="font-display"
        titleIcon={<IoAdd />}
      >
        <div className="flex flex-col gap-3">
          <div className="flex min-h-11 items-center gap-3 rounded-xl border border-zinc-200/90 bg-zinc-50/90 px-3 py-2 dark:border-zinc-700/90 dark:bg-zinc-800/40">
            <label
              htmlFor="block-editor-name"
              className="shrink-0 text-sm font-medium text-zinc-500 dark:text-zinc-400"
            >
              Block name
            </label>
            <input
              id="block-editor-name"
              type="text"
              name="blockName"
              autoComplete="off"
              value={editorBlockName}
              onChange={(e) => setEditorBlockName(e.target.value)}
              placeholder="Morning, Work…"
              disabled={editorMode === "edit"}
              className="min-w-0 flex-1 border-0 bg-transparent py-0.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="block-editor-start"
              className="text-sm font-medium text-zinc-500 dark:text-zinc-400"
            >
              Start
            </label>
            <input
              id="block-editor-start"
              type="time"
              value={editorStartTime}
              onChange={(e) => setEditorStartTime(e.target.value)}
              className="rounded-lg border border-zinc-300/80 bg-white/80 px-2 py-1 text-xs text-zinc-900 outline-none dark:border-zinc-600 dark:bg-zinc-900/70 dark:text-zinc-100"
            />
            <label
              htmlFor="block-editor-end"
              className="text-sm font-medium text-zinc-500 dark:text-zinc-400"
            >
              End
            </label>
            <input
              id="block-editor-end"
              type="time"
              value={editorEndTime}
              onChange={(e) => setEditorEndTime(e.target.value)}
              className="rounded-lg border border-zinc-300/80 bg-white/80 px-2 py-1 text-xs text-zinc-900 outline-none dark:border-zinc-600 dark:bg-zinc-900/70 dark:text-zinc-100"
            />
          </div>
          <button
            type="button"
            onClick={saveEditor}
            className="self-start rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {editorMode === "create" ? "Create block" : "Save timing"}
          </button>
          {editorMode === "edit" ? (
            <button
              type="button"
              onClick={deleteBlock}
              className="self-start rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-500"
            >
              Delete block
            </button>
          ) : null}
          <div className="mt-2 border-t border-zinc-200/80 pt-3 dark:border-zinc-700/70">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              This block CSS (declarations only)
            </p>
            {editorBlockKey ? (
              <p className="mb-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                Variable hooks: <code>{`--blocks-${editorBlockKey}-bg`}</code>{" "}
                and <code>{`--blocks-${editorBlockKey}-bg-dark`}</code>
              </p>
            ) : null}
            <textarea
              value={editorCustomCss}
              onChange={(e) => setEditorCustomCss(e.target.value)}
              spellCheck={false}
              rows={6}
              placeholder={`background: linear-gradient(135deg, #f5f3ff, #dbeafe);\nborder-radius: 16px;\nbox-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);`}
              className="min-h-[140px] w-full resize-y rounded-lg border border-zinc-300/80 bg-white/80 px-3 py-2 font-mono text-xs text-zinc-900 outline-none ring-zinc-400/60 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900/70 dark:text-zinc-100"
            />
            <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              Saved with this block. Applies only to this block row.
            </p>
          </div>
        </div>
      </BottomSheet>
    </>
  );
};

export default BlockScreen;

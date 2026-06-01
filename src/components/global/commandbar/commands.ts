import { DateTime } from "luxon";
import type { Task } from "@/types";
import { includesNormalized } from "./calendarCommands";
import { parseCalendarDayArg } from "./calendarCommands";
import {
  getCategoryConfigByName,
  getCategoryConfigs,
  setOrUpdateCategoryConfig,
} from "../../../lib/taskCategories";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Feedback = { tone: "neutral" | "success" | "error"; text: string };

export type CommandContext = {
  tasks: Task[];
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  setFocusedTaskId: (id: string | null) => void;
  setLinkedTaskTitle: (title: string | undefined) => void;
  calendarDay: DateTime;
  setCalendarDay: (day: DateTime) => void;
  setFeedback: (fb: Feedback | null) => void;
  setRaw: (raw: string) => void;
  navigate: (path: string) => void;
};

type CommandDef = {
  /** Primary command name (lowercase, no slash) */
  name: string;
  /** Additional aliases that also trigger this command */
  aliases?: string[];
  /** Short usage string shown in /help */
  usage?: string;
  handler: (arg: string, ctx: CommandContext) => void;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function findTaskByQuery(
  tasks: Task[],
  query: string,
  onlyDone: boolean | null,
): Task | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return tasks.find((task) => {
    if (onlyDone === true && !task.done) return false;
    if (onlyDone === false && task.done) return false;
    return includesNormalized(task.title, q);
  });
}

const CATEGORY_PALETTE = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#f97316", "#14b8a6",
  "#ef4444", "#84cc16",
];

// ── Command registry ──────────────────────────────────────────────────────────
// To add a new command: push a new entry here. That's it.

export const commandRegistry: CommandDef[] = [
  {
    name: "create",
    usage: "<name>",
    handler(arg, ctx) {
      const nameRaw = arg.replace(/^category\s+/i, "").trim();
      if (!nameRaw) {
        ctx.setFeedback({ tone: "error", text: "Provide a name: /create <name>" });
        return;
      }
      if (getCategoryConfigByName(nameRaw)) {
        ctx.setFeedback({ tone: "neutral", text: `Category "${nameRaw}" already exists.` });
        ctx.setRaw("");
        return;
      }
      const color = CATEGORY_PALETTE[getCategoryConfigs().length % CATEGORY_PALETTE.length];
      setOrUpdateCategoryConfig({ name: nameRaw, color });
      ctx.setFeedback({ tone: "success", text: `Created category "${nameRaw}".` });
      ctx.setRaw("");
    },
  },

  {
    name: "focus",
    usage: "<task> | clear",
    handler(arg, ctx) {
      if (!arg) {
        ctx.setFeedback({ tone: "error", text: "Specify a task title fragment, or use /focus clear." });
        return;
      }
      if (arg.toLowerCase() === "clear") {
        ctx.setFocusedTaskId(null);
        ctx.setLinkedTaskTitle(undefined);
        ctx.setFeedback({ tone: "success", text: "Cleared Pomodoro focus." });
        ctx.setRaw("");
        return;
      }
      const task = findTaskByQuery(ctx.tasks, arg, false);
      if (!task) {
        ctx.setFeedback({ tone: "error", text: "No unfinished task matched. Try a title fragment." });
        return;
      }
      ctx.setFocusedTaskId(task.id);
      ctx.setLinkedTaskTitle(task.title);
      ctx.setFeedback({ tone: "success", text: `Focusing on "${task.title}". Open Pomodoro or Home to see the timer.` });
      ctx.setRaw("");
      ctx.navigate("/pomodoro");
    },
  },

  {
    name: "done",
    usage: "<task>",
    handler(arg, ctx) {
      const task = findTaskByQuery(ctx.tasks, arg, false);
      if (!task) {
        ctx.setFeedback({ tone: "error", text: "No unfinished task matched." });
        return;
      }
      ctx.toggleTask(task.id);
      ctx.setFeedback({ tone: "success", text: "Marked task done." });
      ctx.setRaw("");
    },
  },

  {
    name: "undo",
    usage: "<task>",
    handler(arg, ctx) {
      const task = findTaskByQuery(ctx.tasks, arg, true);
      if (!task) {
        ctx.setFeedback({ tone: "error", text: "No completed task matched." });
        return;
      }
      ctx.toggleTask(task.id);
      ctx.setFeedback({ tone: "success", text: "Marked task as not done." });
      ctx.setRaw("");
    },
  },

  {
    name: "delete",
    aliases: ["remove"],
    usage: "<task>",
    handler(arg, ctx) {
      const task = findTaskByQuery(ctx.tasks, arg, null);
      if (!task) {
        ctx.setFeedback({ tone: "error", text: "No task matched for deletion." });
        return;
      }
      ctx.removeTask(task.id);
      ctx.setFeedback({ tone: "success", text: "Task deleted." });
      ctx.setRaw("");
    },
  },

  {
    name: "day",
    usage: "<today|tomorrow|YYYY-MM-DD>",
    handler(arg, ctx) {
      const nextDay = parseCalendarDayArg(arg, ctx.calendarDay);
      if (!nextDay) {
        ctx.setFeedback({ tone: "error", text: "Could not parse day. Use today, tomorrow, or YYYY-MM-DD." });
        return;
      }
      ctx.setCalendarDay(nextDay);
      ctx.setFeedback({ tone: "success", text: `Moved to ${nextDay.toFormat("cccc, d MMM yyyy")}.` });
      ctx.setRaw("");
    },
  },

  {
    name: "today",
    handler(_arg, ctx) {
      ctx.setCalendarDay(DateTime.local().startOf("day"));
      ctx.setFeedback({ tone: "success", text: "Moved to today." });
      ctx.setRaw("");
    },
  },

  {
    name: "next",
    handler(_arg, ctx) {
      ctx.setCalendarDay(ctx.calendarDay.plus({ days: 1 }).startOf("day"));
      ctx.setFeedback({ tone: "success", text: "Moved to next day." });
      ctx.setRaw("");
    },
  },

  {
    name: "prev",
    handler(_arg, ctx) {
      ctx.setCalendarDay(ctx.calendarDay.minus({ days: 1 }).startOf("day"));
      ctx.setFeedback({ tone: "success", text: "Moved to previous day." });
      ctx.setRaw("");
    },
  },
];

// ── Runner ────────────────────────────────────────────────────────────────────

export function runCommand(input: string, ctx: CommandContext): void {
  const body = input.slice(1).trim();
  if (!body) {
    ctx.setFeedback({ tone: "error", text: "Command is empty. Try /help." });
    return;
  }

  const [head] = body.split(/\s+/, 1);
  const command = head.toLowerCase();
  const arg = body.slice(head.length).trim();

  if (command === "help") {
    const lines = commandRegistry
      .filter((c) => !c.aliases?.length || c.name === c.name) // primaries only
      .map((c) => `/${c.name}${c.usage ? ` ${c.usage}` : ""}`)
      .join(", ");
    ctx.setFeedback({ tone: "neutral", text: `Commands: ${lines}.` });
    return;
  }

  const def = commandRegistry.find(
    (c) => c.name === command || c.aliases?.includes(command),
  );

  if (!def) {
    ctx.setFeedback({ tone: "error", text: `Unknown command: /${command}` });
    return;
  }

  def.handler(arg, ctx);
}

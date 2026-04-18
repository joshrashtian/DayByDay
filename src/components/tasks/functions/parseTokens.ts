import { DateTime } from "luxon";
import { parseDueLocalInput } from "../../../lib/taskDates";
import { normalizeTaskTags, type TaskPriority } from "../../../types/task";

export type TaskChatHint = {
  key: string;
  label: string;
  partial?: boolean;
};

export type TaskChatParse = {
  title: string;
  priority?: TaskPriority;
  critical?: boolean;
  category?: string;
  tags?: string[];
  dueDate?: Date;
  hints: TaskChatHint[];
};

function splitFirstLine(s: string): [string, string] {
  const i = s.indexOf("\n");
  if (i === -1) return [s, ""];
  return [s.slice(0, i), s.slice(i)];
}

function mapPriorityToken(t: string): TaskPriority | undefined {
  const x = t.toLowerCase();
  if (x === "high" || x === "h") return "high";
  if (x === "medium" || x === "m") return "medium";
  if (x === "low" || x === "l") return "low";
  return undefined;
}

function dueHintLabel(d: Date): string {
  return `Due: ${DateTime.fromJSDate(d).toLocaleString(DateTime.DATETIME_MED)}`;
}


export function parseChatDueArg(arg: string): Date | undefined {
  const trimmed = arg.trim();
  if (!trimmed) return undefined;

  const iso = parseDueLocalInput(trimmed);
  if (iso) return iso;

  const now = DateTime.now().setZone("local");
  const lower = trimmed.toLowerCase();

  if (lower === "today") {
    return now.set({ hour: 23, minute: 59, second: 0, millisecond: 0 }).toJSDate();
  }
  if (lower === "tomorrow") {
    return now
      .plus({ days: 1 })
      .set({ hour: 9, minute: 0, second: 0, millisecond: 0 })
      .toJSDate();
  }
  if (lower === "tonight") {
    return now.set({ hour: 18, minute: 0, second: 0, millisecond: 0 }).toJSDate();
  }

  const tryTimeFormats = (s: string) => {
    const formats = ["h:mma", "h:mm a", "ha", "h a", "HH:mm", "H:mm"];
    for (const fmt of formats) {
      const dt = DateTime.fromFormat(s, fmt, { zone: "local" });
      if (dt.isValid) {
        return now
          .set({ hour: dt.hour, minute: dt.minute, second: 0, millisecond: 0 })
          .toJSDate();
      }
    }
    return undefined;
  };

  const asTime = tryTimeFormats(trimmed) ?? tryTimeFormats(lower);
  if (asTime) return asTime;

  const mdY = DateTime.fromFormat(trimmed, "M/d/yyyy", { zone: "local" });
  if (mdY.isValid) return mdY.toJSDate();

  const md = DateTime.fromFormat(trimmed, "M/d", { zone: "local" });
  if (md.isValid) {
    let y = md.set({ year: now.year });
    if (y < now.startOf("day")) y = y.plus({ years: 1 });
    return y.toJSDate();
  }

  return undefined;
}

export function parseTaskChatInput(raw: string): TaskChatParse {
  const hints: TaskChatHint[] = [];
  let priority: TaskPriority | undefined;
  let critical: boolean | undefined;
  let category: string | undefined;
  const tagAcc: string[] = [];
  let dueDate: Date | undefined;

  const trimmed = raw.replace(/^\s+/, "");
  const [line1, restMultiline] = splitFirstLine(trimmed);
  let work = line1;

  const consumeLeading = (): boolean => {
    work = work.replace(/^\s+/, "");
    if (!work) return false;

    if (work.startsWith("!!")) {
      if (work.length === 2 || work[2] === " ") {
        critical = true;
        work = work.slice(2);
        hints.push({ key: "critical", label: "Critical" });
        return true;
      }
      return false;
    }

    if (work.startsWith("!")) {
      const after = work.slice(1);
      const named = after.match(/^(high|h|medium|m|low|l)(\s|$)/i);
      if (named) {
        const p = mapPriorityToken(named[1]);
        if (p) {
          priority = p;
          work = after.slice(named[0].length);
          hints.push({
            key: "priority",
            label: `Priority: ${p}`,
          });
          return true;
        }
      }

      if (after[0] === " ") {
        priority = "high";
        work = after.trimStart();
        hints.push({ key: "priority", label: "High priority" });
        return true;
      }
      return false;
    }

    // Category: @@label (must run before single @)
    if (work.startsWith("@@")) {
      const m = work.match(/^@@([\w.-]+)(\s|$)/);
      if (m) {
        category = m[1];
        work = work.slice(m[0].length);
        hints.push({ key: "category", label: `Category: ${category}` });
        return true;
      }
      return false;
    }

    // Tags: #label (repeatable; letters, digits, _ . -)
    if (work.startsWith("#")) {
      const m = work.match(/^#([\w.-]+)(\s|$)/);
      if (m) {
        tagAcc.push(m[1]);
        work = work.slice(m[0].length);
        hints.push({ key: "tag", label: `Tag: ${m[1]}` });
        return true;
      }
      return false;
    }

    // Due / time: @token (non-space chunk)
    if (work.startsWith("@")) {
      const m = work.match(/^@(\S+)/);
      if (m) {
        const arg = m[1];
        const parsed = parseChatDueArg(arg);
        if (parsed) {
          dueDate = parsed;
          work = work.slice(m[0].length);
          hints.push({ key: "due", label: dueHintLabel(parsed) });
          return true;
        }
      }
      return false;
    }

    return false;
  };

  let guard = 0;
  while (guard++ < 24 && consumeLeading()) {
    /* consume */
  }

  work = work.replace(/^\s+/, "");
  const titleCore = (work + restMultiline).trim();

  if (work) {
    if (work.startsWith("!!") && work.length > 2 && work[2] !== " ") {
      hints.push({ key: "critical", label: "Critical…", partial: true });
    } else if (work.startsWith("!") && !work.startsWith("!!")) {
      hints.push({ key: "priority", label: "Priority…", partial: true });
    } else if (work.startsWith("@@")) {
      const rest = work.slice(2);
      hints.push({
        key: "category",
        label: rest ? `Category: ${rest}…` : "Category…",
        partial: true,
      });
    } else if (work.startsWith("#")) {
      const rest = work.slice(1);
      hints.push({
        key: "tag",
        label: rest ? `Tag: ${rest}…` : "Tag…",
        partial: true,
      });
    } else if (work.startsWith("@")) {
      const arg = work.slice(1);
      hints.push({
        key: "due",
        label: arg ? `Due: ${arg}…` : "Time…",
        partial: true,
      });
    }
  }

  const tags = normalizeTaskTags(tagAcc);

  return {
    title: titleCore,
    ...(priority ? { priority } : {}),
    ...(critical ? { critical } : {}),
    ...(category ? { category } : {}),
    ...(tags ? { tags } : {}),
    ...(dueDate ? { dueDate } : {}),
    hints,
  };
}

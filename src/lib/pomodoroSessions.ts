import { isAxiosError } from "axios";
import { api } from "@/api";
import { supabase } from "@/utils/supabase";

// ---------------------------------------------------------------------------
// Pomodoro session reporting.
//
// Focus sessions are sent to the API (`/pomodoroapi/pomodoro/session/start`
// and `/session/end`). Calls go through a small localStorage outbox so a
// session started offline or signed out is delivered later, in order. Both
// endpoints are idempotent (client-generated id; end only fills a null
// end_time), so re-sending after a lost response is safe.
// ---------------------------------------------------------------------------

const OUTBOX_KEY = "risebyday-pomodoro-outbox";
const MAX_OUTBOX = 200;
const START_PATH = "/pomodoroapi/pomodoro/session/start";
const END_PATH = "/pomodoroapi/pomodoro/session/end";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type OutboxItem =
  | {
      op: "start";
      id: string;
      start_time: string;
      focused_task_id?: string;
    }
  | { op: "end"; id: string; end_time: string };

function readOutbox(): OutboxItem[] {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    return raw ? (JSON.parse(raw) as OutboxItem[]) : [];
  } catch {
    return [];
  }
}

function writeOutbox(items: OutboxItem[]) {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(items.slice(-MAX_OUTBOX)));
  } catch {
    // Storage full or unavailable — the session just won't be reported.
  }
}

function enqueue(item: OutboxItem) {
  writeOutbox([...readOutbox(), item]);
  void flushPomodoroOutbox();
}

/** Starts a focus session and returns its id (pass it to `endFocusSession`). */
export function startFocusSession(focusedTaskId?: string | null): string {
  const id = crypto.randomUUID();
  enqueue({
    op: "start",
    id,
    start_time: new Date().toISOString(),
    // The column is a uuid; anything else would be rejected forever.
    ...(focusedTaskId && UUID_RE.test(focusedTaskId)
      ? { focused_task_id: focusedTaskId }
      : {}),
  });
  return id;
}

export function endFocusSession(id: string) {
  enqueue({ op: "end", id, end_time: new Date().toISOString() });
}

let flushing: Promise<void> | null = null;

/** Sends queued calls in order; stops at the first one that should be retried. */
export function flushPomodoroOutbox(): Promise<void> {
  flushing ??= (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      for (;;) {
        const [item] = readOutbox();
        if (!item) return;
        try {
          if (item.op === "start") {
            const { op: _op, ...body } = item;
            await api.post(START_PATH, body);
          } else {
            await api.post(END_PATH, { id: item.id, end_time: item.end_time });
          }
        } catch (err) {
          const status = isAxiosError(err) ? err.response?.status : undefined;
          // No response, auth, or server trouble: keep it and retry later.
          if (status === undefined || status === 401 || status >= 500) return;
          // Any other 4xx will never succeed — drop it so it can't block the queue.
          console.warn("[pomodoro] dropping session call", item, err);
        }
        // Remove the item we just handled (new ones may have been appended).
        const current = readOutbox();
        if (current[0]?.op === item.op && current[0]?.id === item.id) {
          writeOutbox(current.slice(1));
        }
      }
    } finally {
      flushing = null;
    }
  })();
  return flushing;
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => void flushPomodoroOutbox());
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
      void flushPomodoroOutbox();
    }
  });
}

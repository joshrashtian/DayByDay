import { useMemo, useState } from "react";
import ReactCodeMirror, { EditorView } from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { resolveTheme } from "@/lib/appTheme";
import { useSettingsStore } from "@/stores/settingsStore";
import type { Task } from "@/types";

/**
 * Overrides CodeMirror's stock chrome so the editor sits flush inside the
 * popup card and picks up the app's mono font instead of its own.
 */
const editorChrome = EditorView.theme({
  "&": { fontSize: "13px", backgroundColor: "transparent" },
  ".cm-scroller": {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  ".cm-gutters": { backgroundColor: "transparent", border: "none" },
  ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "transparent" },
  "&.cm-focused": { outline: "none" },
});

export const TaskJSONPopup = ({ task }: { task: Task }) => {
  // Keep the raw text as state: mid-edit it is often not valid JSON yet, so
  // it can't round-trip through a Task object on every keystroke.
  const [text, setText] = useState(() => JSON.stringify(task, null, 2));

  const parseError = useMemo(() => {
    try {
      JSON.parse(text);
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Invalid JSON";
    }
  }, [text]);

  return (
    <div className="p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        Task JSON
      </p>
      <div
        className={`mt-2 overflow-hidden rounded-xl border bg-surface ring-1 ring-line/5 transition-colors ${
          parseError ? "border-red-400/60" : "border-line"
        }`}
      >
        <ReactCodeMirror
          value={text}
          onChange={setText}
          height="18rem"
          theme={"dark"}
          extensions={[json(), editorChrome]}
          basicSetup={{ foldGutter: false, highlightActiveLine: false }}
        />
      </div>
      <p
        className={`mt-2 text-xs ${
          parseError ? "text-red-600 dark:text-red-300" : "text-muted"
        }`}
      >
        {parseError ? `Invalid JSON: ${parseError}` : "Valid JSON"}
      </p>
    </div>
  );
};

import { useEffect, useMemo, useState } from "react";
import {
  formatMinutesAsTimeInput,
  getBlockConfigs,
  isMinuteInBlockWindow,
} from "@/lib/taskBlocks";
import { isIcsTask } from "@/lib/icsTasks";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTasksStore } from "@/stores/tasksStore";
import { sidebarTokens } from "../../sidebar/sidebarTokens";
import { EmptyNote, PanelSection } from "./primitives";

const MINUTES_IN_DAY = 24 * 60;

function nowMinuteOfDay(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function blockLength(start: number, end: number): number {
  if (start === end) return MINUTES_IN_DAY;
  return start < end ? end - start : MINUTES_IN_DAY - start + end;
}

function minutesUntil(fromMinute: number, toMinute: number): number {
  return (toMinute - fromMinute + MINUTES_IN_DAY) % MINUTES_IN_DAY;
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Blocks: the day's timeline, with the live block and its remaining time. */
export function BlocksContextPanel() {
  const blockConfigs = useSettingsStore((s) => s.blockConfigs);
  const tasks = useTasksStore((s) => s.tasks);
  const [minute, setMinute] = useState(nowMinuteOfDay);

  useEffect(() => {
    const timer = window.setInterval(() => setMinute(nowMinuteOfDay()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const rows = useMemo(() => {
    const openCounts = new Map<string, number>();
    for (const t of tasks) {
      if (t.done || isIcsTask(t) || !t.block) continue;
      const key = t.block.trim().toLowerCase();
      openCounts.set(key, (openCounts.get(key) ?? 0) + 1);
    }
    return getBlockConfigs()
      .map((cfg) => {
        const active = isMinuteInBlockWindow(minute, cfg);
        const length = blockLength(cfg.startMinutes, cfg.endMinutes);
        const elapsed = active ? minutesUntil(cfg.startMinutes, minute) : 0;
        return {
          cfg,
          active,
          progress: active ? Math.min(1, elapsed / length) : 0,
          remaining: active ? length - elapsed : 0,
          startsIn: active ? 0 : minutesUntil(minute, cfg.startMinutes),
          openTasks: openCounts.get(cfg.name.toLowerCase()) ?? 0,
        };
      })
      .sort((a, b) => a.cfg.startMinutes - b.cfg.startMinutes);
    // blockConfigs is the store field getBlockConfigs() reads from.
  }, [blockConfigs, tasks, minute]);

  const current = rows.find((r) => r.active);
  const next = rows
    .filter((r) => !r.active)
    .sort((a, b) => a.startsIn - b.startsIn)[0];

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-2 px-1.5">
        <div
          className={`rounded-xl border px-3 py-2 ${sidebarTokens.divider} bg-accent-soft`}
        >
          <p className="truncate font-eudoxus text-base font-black leading-tight text-accent">
            {current ? current.cfg.name : "No block"}
          </p>
          <p className={`text-[11px] ${sidebarTokens.mutedText}`}>
            {current ? `${formatDuration(current.remaining)} left` : "right now"}
          </p>
        </div>
        <div
          className={`rounded-xl border px-3 py-2 ${sidebarTokens.divider} ${sidebarTokens.surface}`}
        >
          <p
            className={`truncate font-eudoxus text-base font-black leading-tight ${sidebarTokens.primaryText}`}
          >
            {next ? next.cfg.name : "—"}
          </p>
          <p className={`text-[11px] ${sidebarTokens.mutedText}`}>
            {next ? `in ${formatDuration(next.startsIn)}` : "nothing next"}
          </p>
        </div>
      </div>

      <PanelSection title="Timeline" aside={`${rows.length} blocks`}>
        {rows.length === 0 ? (
          <EmptyNote>No blocks configured yet.</EmptyNote>
        ) : (
          <ul className="space-y-0.5">
            {rows.map(({ cfg, active, progress, openTasks }) => {
              const color = cfg.color ?? "var(--accent)";
              return (
                <li
                  key={cfg.name}
                  className={`rounded-lg px-1.5 py-1.5 ${
                    active ? sidebarTokens.focusedItem : sidebarTokens.rowHover
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: color }}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-xs font-semibold ${sidebarTokens.primaryText}`}
                      >
                        {cfg.name}
                      </span>
                      <span
                        className={`block font-mono text-[10px] tabular-nums ${sidebarTokens.mutedText}`}
                      >
                        {formatMinutesAsTimeInput(cfg.startMinutes)} –{" "}
                        {formatMinutesAsTimeInput(cfg.endMinutes)}
                      </span>
                    </span>
                    {openTasks > 0 ? (
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[10px] tabular-nums ${sidebarTokens.softChip}`}
                      >
                        {openTasks}
                      </span>
                    ) : null}
                  </div>
                  {active ? (
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-sunken">
                      <div
                        className="h-full rounded-full transition-[width] duration-1000 ease-linear"
                        style={{ width: `${progress * 100}%`, background: color }}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </PanelSection>
    </div>
  );
}

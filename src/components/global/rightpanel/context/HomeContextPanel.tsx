import { useMemo } from "react";
import { useDisplayedBlockName } from "@/hooks/useDisplayedBlockName";
import { getBlockConfigByName, formatMinutesAsTimeInput } from "@/lib/taskBlocks";
import {
  getBlockScopedSidebarTasks,
  getTodaySidebarTasks,
} from "@/lib/sidebarTasks";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTasksStore } from "@/stores/tasksStore";
import { sidebarTokens } from "../../sidebar/sidebarTokens";
import { PanelSection, StatTile, TaskList } from "./primitives";

/** Home: what's in the active block right now, and how far through it you are. */
export function HomeContextPanel() {
  const tasks = useTasksStore((s) => s.tasks);
  const blockName = useDisplayedBlockName();
  // Subscribed so the panel re-renders when blocks are edited in settings.
  useSettingsStore((s) => s.blockConfigs);
  const blockConfig = blockName ? getBlockConfigByName(blockName) : undefined;

  const scoped = useMemo(
    () =>
      blockName
        ? getBlockScopedSidebarTasks(tasks, blockName)
        : getTodaySidebarTasks(tasks),
    [tasks, blockName],
  );
  const open = scoped.filter((t) => !t.done);
  const done = scoped.filter((t) => t.done);

  return (
    <div>
      <PanelSection title={blockName ? "Current block" : "All day"}>
        <div
          className={`mx-1.5 rounded-xl border px-3 py-2.5 ${sidebarTokens.divider} ${sidebarTokens.surface}`}
          style={
            blockConfig?.color
              ? {
                  background: `linear-gradient(135deg, color-mix(in oklab, ${blockConfig.color} 18%, var(--surface)), var(--surface) 70%)`,
                  borderColor: `color-mix(in oklab, ${blockConfig.color} 35%, var(--line))`,
                }
              : undefined
          }
        >
          <p
            className={`font-eudoxus text-lg font-black leading-tight ${sidebarTokens.primaryText}`}
          >
            {blockName ?? "Everything today"}
          </p>
          {blockConfig ? (
            <p className={`text-[11px] ${sidebarTokens.mutedText}`}>
              {formatMinutesAsTimeInput(blockConfig.startMinutes)} –{" "}
              {formatMinutesAsTimeInput(blockConfig.endMinutes)}
            </p>
          ) : null}
        </div>
      </PanelSection>

      <div className="mb-4 grid grid-cols-2 gap-2 px-1.5">
        <StatTile label="Remaining" value={open.length} accent={open.length > 0} />
        <StatTile label="Done" value={done.length} />
      </div>

      <PanelSection title="Up next" aside={`${open.length}`}>
        <TaskList tasks={open} empty="Nothing left in this block. Nice." />
      </PanelSection>

      {done.length > 0 ? (
        <PanelSection title="Completed" aside={`${done.length}`}>
          <TaskList tasks={done} empty="" />
        </PanelSection>
      ) : null}
    </div>
  );
}

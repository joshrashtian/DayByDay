import { HomeTaskListDrawer } from "../../home/HomeTaskListDrawer";
import { TodayTasksPanel, useTodayTasksScope } from "../TodayTasksPanel";

type Props = {
  showLabel: boolean;
};

/** Swipe-up today tasks panel anchored to the bottom of the sidebar. */
export function SidebarTasksDrawer({ showLabel }: Props) {
  const { activeCount, panelTasks, scopeLabel } = useTodayTasksScope();
  const maxHeightPx =
    typeof window !== "undefined"
      ? Math.max(280, Math.floor(window.innerHeight * 0.78) - 120)
      : 480;

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-10 px-1 pb-1 font-eudoxus"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <HomeTaskListDrawer
        fullWidth
        maxHeightPx={maxHeightPx}
        title={scopeLabel}
        subtitle={
          showLabel
            ? `${activeCount} active · ${panelTasks.length} total`
            : `${activeCount} active`
        }
      >
        <TodayTasksPanel compact={!showLabel} />
      </HomeTaskListDrawer>
    </div>
  );
}

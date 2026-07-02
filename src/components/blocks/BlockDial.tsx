import { useMemo } from "react";
import type { BlockConfig } from "@/types";
import { renderCategoryIcon } from "../../lib/categoryIcons";

const MINUTES_IN_DAY = 24 * 60;
const TAU = Math.PI * 2;

/* Thematic colors for the common time-of-day blocks, plus a fallback palette
 * cycled by index for any other block names. */
const NAMED_BLOCK_COLORS: Record<string, string> = {
  "early morning": "#fbbf24",
  morning: "#f4bf63",
  afternoon: "#ee6c2b",
  evening: "#7c3aed",
  night: "#6366f1",
  nighttime: "#818cf8",
  "late night": "#8b5cf6",
};

const FALLBACK_PALETTE = [
  "#ee6c2b",
  "#7c3aed",
  "#0ea5e9",
  "#10b981",
  "#f43f5e",
  "#f59e0b",
  "#6366f1",
  "#14b8a6",
];

/** Suggested color for a block name (used as the editor default). */
export function getBlockColor(name: string, index: number): string {
  const named = NAMED_BLOCK_COLORS[name.trim().toLowerCase()];
  if (named) return named;
  return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

/** Stored color wins; otherwise fall back to a name/index-based suggestion. */
export function resolveBlockColor(block: BlockConfig, index: number): string {
  return block.color ?? getBlockColor(block.name, index);
}

function minuteToAngle(minute: number): number {
  // Midnight (minute 0) at top, clockwise.
  return (minute / MINUTES_IN_DAY) * TAU - Math.PI / 2;
}

function polar(cx: number, cy: number, r: number, angle: number) {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startMin: number,
  endMin: number,
): string {
  let end = endMin;
  if (end <= startMin) end += MINUTES_IN_DAY;
  const span = end - startMin;
  const a0 = minuteToAngle(startMin);
  const a1 = minuteToAngle(end);
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = span > MINUTES_IN_DAY / 2 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

function formatClock(minute: number): string {
  const safe =
    ((Math.floor(minute) % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const h24 = Math.floor(safe / 60);
  const m = safe % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatHourLabel(hour24: number): string {
  const period = hour24 >= 12 ? "p" : "a";
  const h12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${h12}${period}`;
}

type BlockDialProps = {
  blocks: BlockConfig[];
  /** Current minute of day (0–1439). */
  nowMinute: number;
  /** Name of the active block, if any. */
  activeBlockName?: string;
  /** Task counts keyed by lowercased block name. */
  taskCountByBlock?: Record<string, number>;
};

const SIZE = 260;
const CENTER = SIZE / 2;
const RING_RADIUS = 120;
const TRACK_WIDTH = 16;
const ACTIVE_WIDTH = 24;
const TICK_HOURS = [0, 6, 12, 18];

const BlockDial = ({
  blocks,
  nowMinute,
  activeBlockName,
  taskCountByBlock,
}: BlockDialProps) => {
  const activeKey = activeBlockName?.trim().toLowerCase();
  const handAngle = minuteToAngle(nowMinute);
  const [handX, handY] = polar(CENTER, CENTER, RING_RADIUS - 2, handAngle);

  const arcs = useMemo(
    () =>
      blocks.map((block, index) => {
        const key = block.name.trim().toLowerCase();
        const isActive = key === activeKey;
        return {
          key,
          name: block.name,
          color: resolveBlockColor(block, index),
          isActive,
          path: arcPath(
            CENTER,
            CENTER,
            RING_RADIUS,
            block.startMinutes,
            block.endMinutes,
          ),
        };
      }),
    [blocks, activeKey],
  );

  const activeBlock = blocks.find(
    (b) => b.name.trim().toLowerCase() === activeKey,
  );
  const activeColor = activeBlock
    ? resolveBlockColor(
        activeBlock,
        blocks.findIndex((b) => b === activeBlock),
      )
    : "#71717a";

  return (
    <div className="block-dial">
      <div className="block-dial__chart">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="block-dial__svg"
          role="img"
          aria-label="24-hour day dial"
        >
          {/* Background track */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RING_RADIUS}
            fill="none"
            stroke="var(--block-dial-track)"
            strokeWidth={TRACK_WIDTH}
          />
          {/* Block arcs */}
          {arcs.map((arc) => (
            <path
              key={arc.key}
              d={arc.path}
              fill="none"
              stroke={arc.color}
              strokeWidth={arc.isActive ? ACTIVE_WIDTH : TRACK_WIDTH}
              strokeLinecap="round"
              opacity={!activeKey || arc.isActive ? 1 : 0.4}
            />
          ))}
          {/* Hour ticks */}
          {TICK_HOURS.map((hour) => {
            const angle = minuteToAngle(hour * 60);
            const [lx, ly] = polar(CENTER, CENTER, RING_RADIUS - 28, angle);
            return (
              <text
                key={hour}
                x={lx}
                y={ly}
                className="block-dial__tick"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {hour === 0 ? "12a" : formatHourLabel(hour)}
              </text>
            );
          })}
          {/* Clock hand */}
          <line
            x1={CENTER}
            y1={CENTER}
            x2={handX}
            y2={handY}
            stroke="var(--block-dial-hand)"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <circle
            cx={handX}
            cy={handY}
            r={5}
            fill="#fff"
            stroke={activeColor}
            strokeWidth={3}
          />
        </svg>
        <div className="block-dial__center">
          {activeBlockName ? (
            <>
              <span
                className="block-dial__center-label"
                style={{ color: activeColor }}
              >
                NOW
              </span>
              <span className="block-dial__center-name">{activeBlockName}</span>
              {activeBlock ? (
                <span className="block-dial__center-range">
                  {formatClock(activeBlock.startMinutes)} –{" "}
                  {formatClock(activeBlock.endMinutes)}
                </span>
              ) : null}
            </>
          ) : (
            <>
              <span className="block-dial__center-label">NOW</span>
              <span className="block-dial__center-name">
                {formatClock(nowMinute)}
              </span>
              <span className="block-dial__center-range">No active block</span>
            </>
          )}
        </div>
      </div>
      {blocks.length > 0 ? (
        <ul className="block-dial__legend">
          {blocks.map((block, index) => {
            const key = block.name.trim().toLowerCase();
            const count = taskCountByBlock?.[key];
            return (
              <li
                key={key}
                className={
                  key === activeKey
                    ? "block-dial__legend-item block-dial__legend-item--active"
                    : "block-dial__legend-item"
                }
              >
                <span
                  className="block-dial__legend-dot"
                  style={{ background: resolveBlockColor(block, index) }}
                >
                  {renderCategoryIcon(block.icon, "h-2.5 w-2.5 text-white")}
                </span>
                <span className="block-dial__legend-name">{block.name}</span>
                {count ? (
                  <span className="block-dial__legend-count">{count}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};

export default BlockDial;

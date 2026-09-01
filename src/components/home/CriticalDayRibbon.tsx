import { useMemo } from "react";
import { motion } from "motion/react";
import { DateTime } from "luxon";
import { twMerge } from "tailwind-merge";
import { useShallow } from "zustand/react/shallow";
import type { Task } from "@/types";
import { useTasksStore } from "../../stores/tasksStore";
import { IoHourglass, IoTimeOutline, IoWarning } from "react-icons/io5";

/**
 * The critical reminder has one look: a danger-tinted card that reads as a
 * single object. Colors come from the semantic `danger` tokens, so the card
 * follows light/dark without a second definition.
 */
const RIBBON_WRAPPER =
  "rounded-2xl border border-danger/30 bg-danger-soft px-3.5 py-3 shadow-[0_14px_34px_-26px_rgb(0_0_0/0.5)] backdrop-blur-sm";

const tone = {
  eyebrow:
    "text-[10px] font-black uppercase italic leading-none tracking-[0.28em] text-danger",
  badge: "bg-danger text-white shadow-sm",
  badgeIcon: "text-white",
  badgeStatus: "text-white/90",
  title: "text-ink",
  tag: "border-danger/30 bg-danger-soft text-danger",
  more: "text-danger/80",
};

function sortCriticalTasks(a: Task, b: Task): number {
  const da = a.dueDate ? DateTime.fromJSDate(a.dueDate).toMillis() : Infinity;
  const db = b.dueDate ? DateTime.fromJSDate(b.dueDate).toMillis() : Infinity;
  return da - db;
}

export function useCriticalForDay() {
  const tasks = useTasksStore(useShallow((s) => s.tasks));
  return useMemo(() => {
    const today = DateTime.local().startOf("day");
    const list = tasks.filter((t) => {
      if (!t.critical || t.done) return false;
      if (!t.dueDate) return true;
      const d = DateTime.fromJSDate(t.dueDate).startOf("day");
      return d <= today;
    });
    list.sort(sortCriticalTasks);
    return list;
  }, [tasks]);
}

export function criticalBannerLabel(tasks: Task[]): string {
  const today = DateTime.local().startOf("day");
  let overdue = 0;
  let dueToday = 0;
  for (const t of tasks) {
    if (!t.dueDate) continue;
    const d = DateTime.fromJSDate(t.dueDate).startOf("day");
    if (d < today) overdue++;
    else if (d.equals(today)) dueToday++;
  }
  if (overdue > 0) return "OVERDUE";
  if (dueToday > 0) return "DUE TODAY";
  return "CRITICAL";
}

function getPrimary(critical: Task[]) {
  const primaryTask = critical[0]!;
  const primaryTags = (primaryTask.tags ?? []).filter(
    (t): t is string => typeof t === "string" && t.trim().length > 0,
  );
  return { title: primaryTask.title, tags: primaryTags };
}

const letterEasings = ["easeInOut", "circIn", "circOut", "backInOut"] as const;

type LetterMotion = {
  midY: number;
  midRotate: number;
  opacityDelay: number;
  rotate: {
    duration: number;
    repeat: number;
    repeatType: "reverse";
    ease: (typeof letterEasings)[number];
    repeatDelay: number;
  };
  y: {
    duration: number;
    repeat: number;
    repeatType: "reverse";
    ease: (typeof letterEasings)[number];
    repeatDelay: number;
  };
};

function makeLetterMotion(n: number): LetterMotion[] {
  return Array.from({ length: n }, () => {
    const pickEase = () =>
      letterEasings[Math.floor(Math.random() * letterEasings.length)]!;
    return {
      midY: -(2 + Math.random() * 2),
      midRotate: -(3 + Math.random() * 14),
      opacityDelay: Math.random() * 0.45,
      rotate: {
        duration: 0.1 + Math.random() * 0.3,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: pickEase(),
        repeatDelay: Math.random(),
      },
      y: {
        duration: 0.1 + Math.random() * 0.3,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: pickEase(),
        repeatDelay: Math.random(),
      },
    };
  });
}

/** Text whose letters continuously jitter — the signature critical motion. */
function JitterText({ text, className }: { text: string; className: string }) {
  const letters = useMemo(() => makeLetterMotion(text.length), [text]);
  return (
    <span className={className}>
      {text.split("").map((char, i) => {
        const lm = letters[i]!;
        return (
          <motion.span
            key={`${text}-${i}`}
            className="inline-block"
            initial={{ opacity: 0, y: 6, rotate: 0 }}
            animate={{
              opacity: 1,
              rotate: [0, lm.midRotate, 0],
              y: [0, lm.midY, 0],
            }}
            transition={{
              opacity: { duration: 0.22, delay: lm.opacityDelay },
              rotate: lm.rotate,
              y: lm.y,
            }}
          >
            {char === " " ? " " : char}
          </motion.span>
        );
      })}
    </span>
  );
}

export function CriticalHeaderRibbon() {
  const critical = useCriticalForDay();

  const label = useMemo(() => {
    if (critical.length === 0) return "";
    return criticalBannerLabel(critical);
  }, [critical]);

  if (critical.length === 0) return null;

  return <CardRibbon critical={critical} label={label} />;
}

/* ── Cohesive card renderer ────────────────────────────────────────────── */

function StatusIcon({ label, className }: { label: string; className: string }) {
  if (label === "OVERDUE") return <IoWarning className={className} />;
  if (label === "DUE TODAY") return <IoTimeOutline className={className} />;
  return <IoHourglass className={className} />;
}

function CardRibbon({ critical, label }: { critical: Task[]; label: string }) {
  const { title, tags } = getPrimary(critical);

  return (
    <div className="flex w-full max-w-full flex-col items-end gap-1.5">
      <motion.p
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.06 }}
        className={twMerge("pr-0.5 text-right", tone.eyebrow)}
      >
        CRITICAL REMINDER
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
        style={{ maxWidth: "min(24rem, 100%)" }}
        className={twMerge(
          "flex items-center gap-3 transition-colors",
          RIBBON_WRAPPER,
        )}
      >
        <motion.div
          animate={{ scale: [1, 1.07, 0.98, 1.04, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className={twMerge(
            "relative flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-3 py-2",
            tone.badge,
          )}
        >
          {/* Sonar ping — inherits the badge's text color via border-current. */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-xl border-2 border-current"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
          <motion.span
            animate={{ rotate: [-7, 7, -7], scale: [1, 1.12, 1] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <StatusIcon
              label={label}
              className={twMerge("text-lg leading-none", tone.badgeIcon)}
            />
          </motion.span>
          <JitterText
            text={label}
            className={twMerge(
              "relative text-[8px] font-black uppercase leading-none tracking-[0.16em]",
              tone.badgeStatus,
            )}
          />
        </motion.div>

        <div className="min-w-0 flex-1">
          <p
            className={twMerge(
              "truncate text-[13px] font-bold leading-tight",
              tone.title,
            )}
          >
            {title}
          </p>
          {tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {tags.map((tag, i) => (
                <span
                  key={`${i}-${tag}`}
                  className={twMerge(
                    "inline-flex max-w-full shrink-0 rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase leading-none tracking-wider",
                    tone.tag,
                  )}
                >
                  <span className="truncate">{tag}</span>
                </span>
              ))}
            </div>
          )}
          {critical.length > 1 && (
            <p
              className={twMerge(
                "mt-1 text-[9px] font-bold uppercase tracking-[0.2em]",
                tone.more,
              )}
            >
              +{critical.length - 1} more
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Classic animated ribbon (preserved original look) ─────────────────── */

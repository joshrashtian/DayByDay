import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent } from "motion/react";
import { DateTime } from "luxon";
import { useShallow } from "zustand/react/shallow";
import type { Task } from "../../types/task";
import { useTasksStore } from "../../stores/tasksStore";
import { IoHourglass } from "react-icons/io5";

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

const ribbonSkewTransition = {
  duration: 1,
  repeat: Infinity,
  repeatType: "reverse" as const,
  ease: "easeInOut" as const,
};

const letterEasings = ["easeInOut", "circIn", "circOut", "backInOut"] as const;

function randomNegativeSkewRange(): [number, number] {
  const shallow = -(3 + Math.random() * 12);
  const deep = -(9 + Math.random() * 24);
  return deep < shallow ? [deep, shallow] : [shallow, deep];
}

export function CriticalHeaderRibbon() {
  const critical = useCriticalForDay();
  const [skewRange, setSkewRange] = useState<[number, number]>(() =>
    randomNegativeSkewRange(),
  );
  const ribbonSkewDeg = useMotionValue(skewRange[0]);
  const ribbonLeftBgRef = useRef<HTMLDivElement>(null);
  const ribbonRightBgRef = useRef<HTMLDivElement>(null);

  const applyRibbonSkewToDom = useCallback((deg: number) => {
    const transform = `skewX(${deg}deg)`;
    ribbonLeftBgRef.current?.style.setProperty("transform", transform);
    ribbonRightBgRef.current?.style.setProperty("transform", transform);
  }, []);

  useMotionValueEvent(ribbonSkewDeg, "change", applyRibbonSkewToDom);

  useLayoutEffect(() => {
    applyRibbonSkewToDom(ribbonSkewDeg.get());
  }, [applyRibbonSkewToDom, ribbonSkewDeg]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      timeoutId = setTimeout(
        () => {
          setSkewRange(randomNegativeSkewRange());
          scheduleNext();
        },
        1800 + Math.random() * 2200,
      );
    };
    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const [a, b] = skewRange;
    ribbonSkewDeg.set(a);
    const controls = animate(ribbonSkewDeg, [a, b], {
      ...ribbonSkewTransition,
    });
    return () => controls.stop();
  }, [skewRange, ribbonSkewDeg]);

  const label = useMemo(() => {
    if (critical.length === 0) return "";
    return criticalBannerLabel(critical);
  }, [critical]);

  const labelLetterMotion = useMemo(() => {
    const n = label.length;
    return Array.from({ length: n }, () => {
      const midY = -(2 + Math.random() * 2);
      const midRotate = -(3 + Math.random() * 14);
      const pickEase = () =>
        letterEasings[Math.floor(Math.random() * letterEasings.length)]!;
      return {
        midY,
        midRotate,
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
  }, [label]);

  if (critical.length === 0) return null;

  const primaryTask = critical[0]!;
  const primary = primaryTask.title;
  const primaryTags = (primaryTask.tags ?? []).filter(
    (t): t is string => typeof t === "string" && t.trim().length > 0,
  );

  return (
    <div className="flex w-full max-w-full flex-col items-end">
      <motion.p
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
          delay: 0.06,
        }}
        className="-mb-2.5 pr-0.5 text-right text-[20px] font-black italic tracking-[0.28em] font-baron text-red-500"
      >
        CRITICAL REMINDER
      </motion.p>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          type: "spring",
          stiffness: 420,
          damping: 26,
        }}
        style={{ maxWidth: "min(22rem, 100%)" }}
        className="flex items-stretch overflow-hidden"
      >
        <div className="relative flex shrink-0 flex-col justify-center overflow-hidden px-4 py-2.5">
          <div
            ref={ribbonLeftBgRef}
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-[-40px] right-[-40px] origin-center bg-red-800 will-change-transform"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 z-0 h-full w-5 bg-red-600"
            style={{ clipPath: "polygon(100% 0%, 100% 100%, 0% 100%)" }}
          />
          <div className="relative z-10 flex flex-col justify-center">
            <span className="text-[8px] font-black font-display italic tracking-[0.22em] text-red-300">
              {label.split("").map((char, i) => {
                const lm = labelLetterMotion[i]!;
                return (
                  <motion.span
                    key={`${label}-${i}`}
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
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                );
              })}
            </span>
            <span className="font-display text-[22px] font-black italic leading-tight tracking-tight text-white">
              {label === "OVERDUE" ? "⚠" : <IoHourglass />}
            </span>
          </div>
        </div>

        <div className="relative flex min-w-0 flex-1 items-center overflow-hidden py-2.5 pl-6 pr-8">
          <div
            ref={ribbonRightBgRef}
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-[-48px] right-[-48px] origin-center bg-red-600 will-change-transform"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 z-0 h-full w-8 bg-red-800/50"
            style={{ clipPath: "polygon(60% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
          />
          <div className="relative z-10 min-w-0">
            <p className="truncate text-[13px] font-black italic uppercase leading-tight tracking-widest text-white">
              {primary}
            </p>
            {primaryTags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {primaryTags.map((tag, i) => (
                  <span
                    key={`${i}-${tag}`}
                    className="inline-flex max-w-full shrink-0 rounded border border-red-200/35 bg-red-950/40 px-1.5 py-0.5 text-[8px] font-bold uppercase leading-none tracking-wider text-red-100"
                  >
                    <span className="truncate">{tag}</span>
                  </span>
                ))}
              </div>
            )}
            {critical.length > 1 && (
              <p className="mt-0.5 text-[9px] font-bold italic tracking-[0.2em] text-red-200">
                +{critical.length - 1} MORE
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

import { createHevyClient, HevyError, type Workout } from "hevy-javascript";
import { useEffect, useMemo, useState } from "react";
import { FaWeightScale } from "react-icons/fa6";
import { motion } from "framer-motion";

const HEVY_API_KEY = import.meta.env.VITE_HEVY_API as string | undefined;

const isSameDay = (iso: string | undefined, date: Date) => {
  if (!iso) return false;
  const d = new Date(iso);
  return (
    d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate()
  );
};

const HevyWidget = ({ date }: { date: Date }) => {
  const hevy = useMemo(
    () => (HEVY_API_KEY ? createHevyClient({ apiKey: HEVY_API_KEY }) : null),
    [],
  );
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [error, setError] = useState<string | null>(null);
  const dayKey = date.toDateString();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hevy) return;
    let cancelled = false;

    async function getWorkouts() {
      if (!hevy) return;
      setIsLoading(true);
      try {
        const res = await hevy.getWorkouts(1, 10);
        if (cancelled) return;
        setWorkouts(
          (res.workouts ?? []).filter((w) => isSameDay(w.start_time, date)),
        );
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof HevyError ? `Hevy error ${err.status}` : String(err),
        );
        setIsLoading(false);
      }
    }

    getWorkouts();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hevy, dayKey]);

  if (isLoading) return;
  if (!hevy) return <p>Set VITE_HEVY_API in .env to show workouts.</p>;

  if (error) return;
  if (workouts.length === 0) return;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-1 h-48 bg-zinc-200/50 flex flex-col justify-between p-5 rounded-2xl"
    >
      <FaWeightScale className="text-6xl" />
      {workouts.map((w) => (
        <div>
          <p>{w.exercises?.length} workouts</p>
          <p className="font-bold text-xl" key={w.id}>
            {w.title}
          </p>
        </div>
      ))}
    </motion.div>
  );
};

export default HevyWidget;

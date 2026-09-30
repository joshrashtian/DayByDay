import { createHevyClient, HevyError, type Workout } from "hevy-javascript";
import { useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    if (!hevy) return;
    let cancelled = false;

    async function getWorkouts() {
      if (!hevy) return;
      try {
        const res = await hevy.getWorkouts(1, 10);
        if (cancelled) return;
        setWorkouts(
          (res.workouts ?? []).filter((w) => isSameDay(w.start_time, date)),
        );
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof HevyError ? `Hevy error ${err.status}` : String(err),
        );
      }
    }

    getWorkouts();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hevy, dayKey]);

  if (!hevy) return <p>Set VITE_HEVY_API in .env to show workouts.</p>;
  if (error) return <p>{error}</p>;
  if (workouts.length === 0) return <p>No workouts this day.</p>;

  return (
    <ul>
      {workouts.map((w) => (
        <li key={w.id}>{w.title}</li>
      ))}
    </ul>
  );
};

export default HevyWidget;

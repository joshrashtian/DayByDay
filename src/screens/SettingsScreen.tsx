import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { IoSettings } from "react-icons/io5";
import {
  clearManualWeatherCoords,
  getManualWeatherCoords,
  setManualWeatherCoords,
} from "../lib/weatherCoords";

export const SettingsScreen = () => {
  const [latInput, setLatInput] = useState("");
  const [lonInput, setLonInput] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const m = getManualWeatherCoords();
    if (m) {
      setLatInput(String(m.lat));
      setLonInput(String(m.lon));
    }
  }, []);

  const onSaveWeatherLocation = () => {
    setSaveError(null);
    const lat = Number(latInput.trim());
    const lon = Number(lonInput.trim());
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setSaveError("Enter valid numbers for latitude and longitude.");
      return;
    }
    if (lat < -90 || lat > 90) {
      setSaveError("Latitude must be between -90 and 90.");
      return;
    }
    if (lon < -180 || lon > 180) {
      setSaveError("Longitude must be between -180 and 180.");
      return;
    }
    setManualWeatherCoords({ lat, lon });
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  };

  const onUseDeviceLocation = () => {
    setSaveError(null);
    clearManualWeatherCoords();
    setLatInput("");
    setLonInput("");
  };

  return (
    <main className="  min-h-screen   bg-zinc-100 p-6">
      <motion.div
        className="inline-block origin-center"
        key={Math.random()}
        initial={{ opacity: 0, x: -100, rotate: -120 }}
        animate={{ opacity: 1, x: 0, rotate: 0 }}
        exit={{ opacity: 0, x: -100, rotate: -120 }}
        transition={{
          duration: 0.85,
          delay: 0.1,
          type: "spring",
          stiffness: 200,
          damping: 20,
        }}
      >
        <IoSettings className="text-6xl text-zinc-900" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="text-6xl font-bold flex flex-row font-display"
      >
        {"Settings".split("").map((char, i) => (
          <motion.p
            key={i + Math.random()}
            initial={{ opacity: 0, y: 5 + Math.random() * 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: Math.random() * 0.5 + 0.2,
              type: "spring",
              stiffness: 200,
              damping: 20,
              delay: Math.random() * 0.5 + i * 0.1,
            }}
          >
            {char}
          </motion.p>
        ))}
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-2 mt-5 gap-8">
        <section className="max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-zinc-900">
            Weather location
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Optional fixed coordinates for the forecast. If unset, the app uses
            your device location when allowed, otherwise a default.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Latitude
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                placeholder="e.g. 34.0549"
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Longitude
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={lonInput}
                onChange={(e) => setLonInput(e.target.value)}
                placeholder="e.g. -118.2452"
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
              />
            </label>
          </div>
          {saveError ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {saveError}
            </p>
          ) : null}
          {savedFlash ? (
            <p className="mt-3 text-sm text-emerald-600">
              Saved. Weather will refresh.
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSaveWeatherLocation}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Save coordinates
            </button>
            <button
              type="button"
              onClick={onUseDeviceLocation}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Use device location
            </button>
          </div>
        </section>
      </div>
    </main>
  );
};

import { useId, useRef, useState } from "react";
import {
  IoMusicalNoteOutline,
  IoTrashOutline,
  IoVolumeHighOutline,
  IoVolumeMuteOutline,
} from "react-icons/io5";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import {
  BUILTIN_TASK_CLICK_SOUNDS,
  builtinSoundId,
  createCustomSoundFromFile,
  customSoundId,
  getTaskClickSoundLabel,
  previewTaskClickSound,
} from "@/lib/taskClickSounds";
import { useSettingsStore } from "@/stores/settingsStore";

export function AudioSection() {
  const uid = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPrefs = useSettingsStore((s) => s.audioPrefs);
  const customSounds = useSettingsStore((s) => s.customSounds);
  const setAudioPrefs = useSettingsStore((s) => s.setAudioPrefs);
  const addCustomSound = useSettingsStore((s) => s.addCustomSound);
  const removeCustomSound = useSettingsStore((s) => s.removeCustomSound);

  const [importError, setImportError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const volumeId = `${uid}-volume`;
  const soundId = `${uid}-sound`;
  const fileInputId = `${uid}-sound-file`;
  const soundsDisabled = !audioPrefs.soundEnabled;
  const selectedLabel = getTaskClickSoundLabel(
    audioPrefs.taskClickSoundId,
    customSounds,
  );

  const onChooseSoundFile = () => {
    setImportError(null);
    setImportMessage(null);
    fileInputRef.current?.click();
  };

  const onSoundFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setImportMessage(null);
    try {
      const sound = await createCustomSoundFromFile(file);
      addCustomSound(sound);
      setImportMessage(`Imported "${sound.name}" and selected it for task clicks.`);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Could not import that file.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Audio
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Pick a click sound for tasks, or import your own.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/70 dark:border-zinc-700 dark:bg-zinc-900/60">
        <div className="flex items-start gap-3 border-b border-zinc-100 px-4 py-4 dark:border-zinc-800">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
            {audioPrefs.soundEnabled ? (
              <IoVolumeHighOutline className="size-5" aria-hidden />
            ) : (
              <IoVolumeMuteOutline className="size-5" aria-hidden />
            )}
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Task click sound
            </h3>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {audioPrefs.soundEnabled
                ? `${selectedLabel} · ${audioPrefs.volume}% volume`
                : "Muted"}
            </p>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Enable sound
              </p>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                Turn off to silence task clicks.
              </p>
            </div>
            <Checkbox
              size="sm"
              isSelected={audioPrefs.soundEnabled}
              onChange={(enabled) =>
                setAudioPrefs((prev) => ({ ...prev, soundEnabled: enabled }))
              }
              aria-label="Enable task click sound"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor={soundId}
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Sound
            </label>
            <div className="flex flex-wrap gap-2">
              <select
                id={soundId}
                value={audioPrefs.taskClickSoundId}
                disabled={soundsDisabled}
                onChange={(event) =>
                  setAudioPrefs((prev) => ({
                    ...prev,
                    taskClickSoundId: event.target.value,
                  }))
                }
                className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-shadow focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <optgroup label="Built-in">
                  {BUILTIN_TASK_CLICK_SOUNDS.map((sound) => (
                    <option
                      key={sound.id}
                      value={builtinSoundId(sound.id)}
                    >
                      {sound.label}
                    </option>
                  ))}
                </optgroup>
                {customSounds.length > 0 ? (
                  <optgroup label="Imported">
                    {customSounds.map((sound) => (
                      <option
                        key={sound.id}
                        value={customSoundId(sound.id)}
                      >
                        {sound.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
              </select>
              <button
                type="button"
                onClick={() => previewTaskClickSound()}
                disabled={soundsDisabled}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Preview
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor={volumeId}
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Volume
              </label>
              <span className="text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
                {audioPrefs.volume}%
              </span>
            </div>
            <input
              id={volumeId}
              type="range"
              min={0}
              max={100}
              step={1}
              value={audioPrefs.volume}
              disabled={soundsDisabled}
              onChange={(event) =>
                setAudioPrefs((prev) => ({
                  ...prev,
                  volume: Number(event.target.value),
                }))
              }
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-violet-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-700 dark:accent-violet-400"
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/70 dark:border-zinc-700 dark:bg-zinc-900/60">
        <div className="flex items-start gap-3 border-b border-zinc-100 px-4 py-4 dark:border-zinc-800">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
            <IoMusicalNoteOutline className="size-5" aria-hidden />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Import your own
            </h3>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Upload a short audio clip from your device. Saved locally.
            </p>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div
            className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200"
            role="note"
          >
            Supports `.mp3`, `.wav`, `.ogg`, `.m4a`, and `.aac` up to 512 KB.
          </div>

          <input
            ref={fileInputRef}
            id={fileInputId}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.webm"
            className="sr-only"
            onChange={onSoundFileSelected}
          />

          <button
            type="button"
            onClick={onChooseSoundFile}
            disabled={isImporting}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isImporting ? "Importing…" : "Choose audio file"}
          </button>

          {customSounds.length > 0 ? (
            <ul className="space-y-2">
              {customSounds.map((sound) => {
                const id = customSoundId(sound.id);
                const isSelected = audioPrefs.taskClickSoundId === id;
                return (
                  <li
                    key={sound.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {sound.name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {isSelected ? "Selected for task clicks" : "Imported sound"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => previewTaskClickSound(id)}
                        disabled={soundsDisabled}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        Preview
                      </button>
                      {!isSelected ? (
                        <button
                          type="button"
                          onClick={() =>
                            setAudioPrefs((prev) => ({
                              ...prev,
                              taskClickSoundId: id,
                            }))
                          }
                          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          Use
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeCustomSound(sound.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-900/40 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-red-950/30"
                      >
                        <IoTrashOutline className="size-3.5" aria-hidden />
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No imported sounds yet.
            </p>
          )}

          <div aria-live="polite">
            {importError ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {importError}
              </p>
            ) : null}
            {importMessage ? (
              <p
                className="text-sm text-emerald-600 dark:text-emerald-400"
                role="status"
              >
                {importMessage}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

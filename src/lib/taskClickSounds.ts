import type { AudioPrefs, CustomSound } from "@/types";
import { useSettingsStore } from "@/stores/settingsStore";

export const BUILTIN_TASK_CLICK_SOUNDS = [
  {
    id: "happy",
    label: "Happy",
    src: new URL("../assets/defaultaudio/happy.mp3", import.meta.url).href,
  },
  {
    id: "chew",
    label: "Chew",
    src: new URL("../assets/defaultaudio/chew.mp3", import.meta.url).href,
  },
  {
    id: "piano",
    label: "Piano",
    src: new URL("../assets/defaultaudio/piano.mp3", import.meta.url).href,
  },
] as const;

export type BuiltinTaskClickSoundId =
  (typeof BUILTIN_TASK_CLICK_SOUNDS)[number]["id"];

export const DEFAULT_TASK_CLICK_SOUND_ID = "builtin:happy";

export const MAX_CUSTOM_SOUND_BYTES = 512 * 1024;

const ACCEPTED_AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".wav",
  ".ogg",
  ".m4a",
  ".aac",
  ".webm",
]);

const audioCache = new Map<string, HTMLAudioElement>();

export function builtinSoundId(id: BuiltinTaskClickSoundId): string {
  return `builtin:${id}`;
}

export function customSoundId(id: string): string {
  return `custom:${id}`;
}

export function isValidTaskClickSoundId(
  soundId: string,
  customSounds: CustomSound[],
): boolean {
  if (soundId.startsWith("builtin:")) {
    const builtinId = soundId.slice("builtin:".length);
    return BUILTIN_TASK_CLICK_SOUNDS.some((sound) => sound.id === builtinId);
  }
  if (soundId.startsWith("custom:")) {
    const customId = soundId.slice("custom:".length);
    return customSounds.some((sound) => sound.id === customId);
  }
  return false;
}

export function normalizeAudioPrefs(
  prefs: Partial<AudioPrefs>,
  customSounds: CustomSound[],
): AudioPrefs {
  const volume =
    typeof prefs.volume === "number" && Number.isFinite(prefs.volume)
      ? Math.min(100, Math.max(0, Math.round(prefs.volume)))
      : 80;
  const taskClickSoundId =
    prefs.taskClickSoundId &&
    isValidTaskClickSoundId(prefs.taskClickSoundId, customSounds)
      ? prefs.taskClickSoundId
      : DEFAULT_TASK_CLICK_SOUND_ID;

  return {
    soundEnabled: prefs.soundEnabled ?? true,
    volume,
    taskClickSoundId,
  };
}

export function resolveTaskClickSoundSrc(
  soundId: string,
  customSounds: CustomSound[],
): string | null {
  if (soundId.startsWith("builtin:")) {
    const builtinId = soundId.slice("builtin:".length);
    return (
      BUILTIN_TASK_CLICK_SOUNDS.find((sound) => sound.id === builtinId)?.src ??
      null
    );
  }

  if (soundId.startsWith("custom:")) {
    const customId = soundId.slice("custom:".length);
    return (
      customSounds.find((sound) => sound.id === customId)?.dataUrl ?? null
    );
  }

  return null;
}

export function getTaskClickSoundLabel(
  soundId: string,
  customSounds: CustomSound[],
): string {
  if (soundId.startsWith("builtin:")) {
    const builtinId = soundId.slice("builtin:".length);
    return (
      BUILTIN_TASK_CLICK_SOUNDS.find((sound) => sound.id === builtinId)
        ?.label ?? "Built-in"
    );
  }

  if (soundId.startsWith("custom:")) {
    const customId = soundId.slice("custom:".length);
    return customSounds.find((sound) => sound.id === customId)?.name ?? "Custom";
  }

  return "Sound";
}

function getAudioForSound(soundId: string, src: string): HTMLAudioElement {
  let audio = audioCache.get(soundId);
  if (!audio) {
    audio = new Audio(src);
    audio.preload = "auto";
    audioCache.set(soundId, audio);
  } else if (audio.src !== src) {
    audio.src = src;
  }
  return audio;
}

export function evictTaskClickSoundFromCache(soundId: string): void {
  audioCache.delete(soundId);
}

function playSoundAtVolume(soundId: string, src: string, volume: number): void {
  if (typeof window === "undefined") return;

  const audio = getAudioForSound(soundId, src);
  audio.volume = Math.min(1, Math.max(0, volume / 100));
  audio.currentTime = 0;
  void audio.play().catch(() => {
    // Ignore autoplay / missing-output errors.
  });
}

export function playTaskClickSound(
  soundId = useSettingsStore.getState().audioPrefs.taskClickSoundId,
): void {
  const { soundEnabled, volume, customSounds } = {
    ...useSettingsStore.getState().audioPrefs,
    customSounds: useSettingsStore.getState().customSounds,
  };

  if (!soundEnabled) return;

  const src = resolveTaskClickSoundSrc(soundId, customSounds);
  if (!src) return;

  playSoundAtVolume(soundId, src, volume);
}

export function previewTaskClickSound(
  soundId = useSettingsStore.getState().audioPrefs.taskClickSoundId,
): void {
  const { soundEnabled, volume, customSounds } = {
    ...useSettingsStore.getState().audioPrefs,
    customSounds: useSettingsStore.getState().customSounds,
  };

  if (!soundEnabled) return;

  const src = resolveTaskClickSoundSrc(soundId, customSounds);
  if (!src) return;

  playSoundAtVolume(soundId, src, volume);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Could not read that audio file."));
    };
    reader.onerror = () => reject(new Error("Could not read that audio file."));
    reader.readAsDataURL(file);
  });
}

function getFileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

export function isAcceptedAudioFile(file: File): boolean {
  if (file.type.startsWith("audio/")) return true;
  return ACCEPTED_AUDIO_EXTENSIONS.has(getFileExtension(file.name));
}

export async function createCustomSoundFromFile(file: File): Promise<CustomSound> {
  if (!isAcceptedAudioFile(file)) {
    throw new Error("Choose an audio file (.mp3, .wav, .ogg, .m4a, or .aac).");
  }
  if (file.size > MAX_CUSTOM_SOUND_BYTES) {
    throw new Error("That file is too large. Keep custom sounds under 512 KB.");
  }

  const dataUrl = await readFileAsDataUrl(file);
  const baseName = file.name.replace(/\.[^.]+$/, "").trim();

  return {
    id: crypto.randomUUID(),
    name: baseName || "Custom sound",
    dataUrl,
    mimeType: file.type || "audio/mpeg",
  };
}

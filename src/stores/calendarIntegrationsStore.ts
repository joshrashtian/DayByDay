import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ConnectedCalendar, CalendarProvider } from "@/types";

import { migrateLocalStorageKey } from "@/lib/storageMigration";

const STORAGE_KEY = "risebyday-calendar-integrations";
migrateLocalStorageKey("daybyday-calendar-integrations", STORAGE_KEY);

const MOCK_GOOGLE_CALENDARS: ConnectedCalendar[] = [
  {
    id: "primary",
    provider: "google",
    name: "Personal",
    color: "#4285F4",
    enabled: true,
  },
  {
    id: "work",
    provider: "google",
    name: "Work",
    color: "#0B8043",
    enabled: true,
  },
  {
    id: "holidays",
    provider: "google",
    name: "US Holidays",
    color: "#F6BF26",
    enabled: false,
  },
];

type GoogleConnection = {
  connected: boolean;
  accountEmail?: string;
  calendars: ConnectedCalendar[];
  lastImportAt?: string;
};

type CalendarIntegrationsState = {
  google: GoogleConnection;
  importPastMonths: number;
  importFutureMonths: number;
  connectGoogle: () => void;
  disconnectGoogle: () => void;
  setCalendarEnabled: (
    provider: CalendarProvider,
    calendarId: string,
    enabled: boolean,
  ) => void;
  setImportRange: (pastMonths: number, futureMonths: number) => void;
  markImportComplete: () => void;
  lastIcsImportAt?: string;
  lastIcsImportCount?: number;
  markIcsImportComplete: (count: number) => void;
};

const DEFAULT_GOOGLE: GoogleConnection = {
  connected: false,
  calendars: [],
};

export const useCalendarIntegrationsStore = create<CalendarIntegrationsState>()(
  persist(
    (set) => ({
      google: DEFAULT_GOOGLE,
      importPastMonths: 3,
      importFutureMonths: 12,

      connectGoogle: () =>
        set({
          google: {
            connected: true,
            accountEmail: "you@gmail.com",
            calendars: MOCK_GOOGLE_CALENDARS.map((calendar) => ({ ...calendar })),
          },
        }),

      disconnectGoogle: () => set({ google: DEFAULT_GOOGLE }),

      setCalendarEnabled: (provider, calendarId, enabled) =>
        set((state) => {
          if (provider !== "google" || !state.google.connected) return state;
          return {
            google: {
              ...state.google,
              calendars: state.google.calendars.map((calendar) =>
                calendar.id === calendarId ? { ...calendar, enabled } : calendar,
              ),
            },
          };
        }),

      setImportRange: (pastMonths, futureMonths) =>
        set({
          importPastMonths: Math.max(0, Math.min(pastMonths, 24)),
          importFutureMonths: Math.max(1, Math.min(futureMonths, 36)),
        }),

      markImportComplete: () =>
        set((state) => ({
          google: {
            ...state.google,
            lastImportAt: new Date().toISOString(),
          },
        })),

      lastIcsImportAt: undefined,
      lastIcsImportCount: undefined,

      markIcsImportComplete: (count) =>
        set({
          lastIcsImportAt: new Date().toISOString(),
          lastIcsImportCount: count,
        }),
    }),
    { name: STORAGE_KEY },
  ),
);

export function formatLastImport(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

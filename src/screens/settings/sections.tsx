import {
  IoCloudOutline,
  IoColorPaletteOutline,
  IoHomeOutline,
  IoPersonOutline,
  IoCalendarOutline,
  IoVolumeHighOutline,
  IoLayersOutline,
  IoMusicalNotesOutline,
} from "react-icons/io5";
import { SPOTIFY_ENABLED } from "@/lib/featureFlags";

export type SettingsSection =
  | "home"
  | "appearance"
  | "weather"
  | "categories"
  | "profile"
  | "connected-calendars"
  | "spotify"
  | "audio";

export const DEFAULT_SECTION: SettingsSection = "home";

export type SettingsGroup = "overview" | "personalize" | "account" | "integrations";

/** Display order and labels for nav groups. `null` renders without a heading. */
export const GROUPS: { id: SettingsGroup; label: string | null }[] = [
  { id: "overview", label: null },
  { id: "personalize", label: "Personalize" },
  { id: "account", label: "Account" },
  { id: "integrations", label: "Integrations" },
];

export interface SectionMeta {
  id: SettingsSection;
  label: string;
  description: string;
  icon: React.ReactNode;
  group: SettingsGroup;
}

const ALL_SECTIONS: SectionMeta[] = [
  {
    id: "home",
    label: "Home",
    description: "Settings overview",
    icon: <IoHomeOutline />,
    group: "overview",
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Light, dark, or system",
    icon: <IoLayersOutline />,
    group: "personalize",
  },
  {
    id: "weather",
    label: "Weather",
    description: "Set your location for weather",
    icon: <IoCloudOutline />,
    group: "personalize",
  },
  {
    id: "categories",
    label: "Categories",
    description: "Create and manage task categories",
    icon: <IoColorPaletteOutline />,
    group: "personalize",
  },
  {
    id: "profile",
    label: "Profile",
    description: "Your profile and Supabase sync",
    icon: <IoPersonOutline />,
    group: "account",
  },
  {
    id: "connected-calendars",
    label: "Connected Calendars",
    description: "Manage connected calendar feeds",
    icon: <IoCalendarOutline />,
    group: "integrations",
  },
  {
    id: "spotify",
    label: "Spotify",
    description: "Log listening history onto your calendar",
    icon: <IoMusicalNotesOutline />,
    group: "integrations",
  },
  {
    id: "audio",
    label: "Audio",
    description: "Sounds and volume",
    icon: <IoVolumeHighOutline />,
    group: "personalize",
  },
];

export const SECTIONS = ALL_SECTIONS.filter(
  (s) => SPOTIFY_ENABLED || s.id !== "spotify",
);

/** Visible sections bucketed by group, in `GROUPS` order; empty groups dropped. */
export const GROUPED_SECTIONS = GROUPS.map((group) => ({
  ...group,
  sections: SECTIONS.filter((s) => s.group === group.id),
})).filter((g) => g.sections.length > 0);

/** All sections except the home hub itself. */
export const NON_HOME_SECTIONS = SECTIONS.filter((s) => s.id !== "home");

export const getSectionMeta = (id: SettingsSection): SectionMeta | undefined =>
  SECTIONS.find((s) => s.id === id);

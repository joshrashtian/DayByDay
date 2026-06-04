import {
  IoCloudOutline,
  IoColorPaletteOutline,
  IoBrushOutline,
  IoHomeOutline,
  IoPersonOutline,
  IoCalendarOutline,
  IoVolumeHighOutline,
} from "react-icons/io5";

export type SettingsSection =
  | "home"
  | "weather"
  | "categories"
  | "blocks-css"
  | "profile"
  | "connected-calendars"
  | "audio";

export const DEFAULT_SECTION: SettingsSection = "home";

export interface SectionMeta {
  id: SettingsSection;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export const SECTIONS: SectionMeta[] = [
  {
    id: "home",
    label: "Home",
    description: "Settings overview",
    icon: <IoHomeOutline />,
  },
  {
    id: "weather",
    label: "Weather",
    description: "Set your location for weather",
    icon: <IoCloudOutline />,
  },
  {
    id: "categories",
    label: "Categories",
    description: "Create and manage task categories",
    icon: <IoColorPaletteOutline />,
  },
  {
    id: "blocks-css",
    label: "Blocks CSS",
    description: "Customize time-of-day blocks",
    icon: <IoBrushOutline />,
  },
  {
    id: "profile",
    label: "Profile",
    description: "Your local RiseByDay profile",
    icon: <IoPersonOutline />,
  },
  {
    id: "connected-calendars",
    label: "Connected Calendars",
    description: "Manage connected calendar feeds",
    icon: <IoCalendarOutline />,
  },
  {
    id: "audio",
    label: "Audio",
    description: "Sounds and volume",
    icon: <IoVolumeHighOutline />,
  },
];

/** All sections except the home hub itself. */
export const NON_HOME_SECTIONS = SECTIONS.filter((s) => s.id !== "home");

export const getSectionMeta = (id: SettingsSection): SectionMeta | undefined =>
  SECTIONS.find((s) => s.id === id);

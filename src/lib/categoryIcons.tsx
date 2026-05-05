import type { IconType } from "react-icons";
import {
  IoBarbellOutline,
  IoBookOutline,
  IoBriefcaseOutline,
  IoBuildOutline,
  IoCalendarClearOutline,
  IoCarSportOutline,
  IoCashOutline,
  IoCodeSlashOutline,
  IoColorPaletteOutline,
  IoFitnessOutline,
  IoFlowerOutline,
  IoGameControllerOutline,
  IoHeartOutline,
  IoHomeOutline,
  IoLaptopOutline,
  IoLibraryOutline,
  IoMedicalOutline,
  IoMusicalNotesOutline,
  IoPeopleOutline,
  IoSchoolOutline,
} from "react-icons/io5";

export type CategoryIconOption = {
  id: string;
  label: string;
  keywords: string[];
  Icon: IconType;
};

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  {
    id: "briefcase",
    label: "Work",
    keywords: ["job", "office", "career"],
    Icon: IoBriefcaseOutline,
  },
  {
    id: "home",
    label: "Home",
    keywords: ["house", "chores", "family"],
    Icon: IoHomeOutline,
  },
  {
    id: "school",
    label: "School",
    keywords: ["class", "study", "college"],
    Icon: IoSchoolOutline,
  },
  {
    id: "book",
    label: "Reading",
    keywords: ["learn", "read", "books"],
    Icon: IoBookOutline,
  },
  {
    id: "library",
    label: "Research",
    keywords: ["notes", "writing", "reference"],
    Icon: IoLibraryOutline,
  },
  {
    id: "code",
    label: "Coding",
    keywords: ["dev", "software", "programming"],
    Icon: IoCodeSlashOutline,
  },
  {
    id: "laptop",
    label: "Computer",
    keywords: ["digital", "screen", "online"],
    Icon: IoLaptopOutline,
  },
  {
    id: "calendar",
    label: "Planning",
    keywords: ["schedule", "routine", "events"],
    Icon: IoCalendarClearOutline,
  },
  {
    id: "cash",
    label: "Finance",
    keywords: ["money", "budget", "bills"],
    Icon: IoCashOutline,
  },
  {
    id: "heart",
    label: "Health",
    keywords: ["wellness", "self care", "care"],
    Icon: IoHeartOutline,
  },
  {
    id: "medical",
    label: "Medical",
    keywords: ["doctor", "appointment", "meds"],
    Icon: IoMedicalOutline,
  },
  {
    id: "barbell",
    label: "Workout",
    keywords: ["gym", "exercise", "training"],
    Icon: IoBarbellOutline,
  },
  {
    id: "fitness",
    label: "Fitness",
    keywords: ["run", "cardio", "movement"],
    Icon: IoFitnessOutline,
  },
  {
    id: "flower",
    label: "Personal",
    keywords: ["life", "self", "growth"],
    Icon: IoFlowerOutline,
  },
  {
    id: "people",
    label: "Social",
    keywords: ["friends", "family", "community"],
    Icon: IoPeopleOutline,
  },
  {
    id: "music",
    label: "Music",
    keywords: ["creative", "practice", "audio"],
    Icon: IoMusicalNotesOutline,
  },
  {
    id: "palette",
    label: "Creative",
    keywords: ["design", "art", "maker"],
    Icon: IoColorPaletteOutline,
  },
  {
    id: "build",
    label: "Errands",
    keywords: ["repair", "maintenance", "admin"],
    Icon: IoBuildOutline,
  },
  {
    id: "car",
    label: "Travel",
    keywords: ["commute", "drive", "trip"],
    Icon: IoCarSportOutline,
  },
  {
    id: "gamepad",
    label: "Fun",
    keywords: ["hobby", "play", "games"],
    Icon: IoGameControllerOutline,
  },
];

const ICONS_BY_ID = new Map(
  CATEGORY_ICON_OPTIONS.map((option) => [option.id, option]),
);

export function getCategoryIconOption(
  iconId: string | undefined,
): CategoryIconOption | undefined {
  if (!iconId) return undefined;
  return ICONS_BY_ID.get(iconId);
}

export function renderCategoryIcon(
  iconId: string | undefined,
  className = "h-3.5 w-3.5",
) {
  if (!iconId) return null;
  const option = getCategoryIconOption(iconId);
  if (option) return <option.Icon className={className} aria-hidden />;
  return <span aria-hidden>{iconId}</span>;
}

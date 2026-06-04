import { useTasksStore } from "@/stores/tasksStore";
import { createContext, useContext, useMemo, useState } from "react";

export type Profile = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

export type ProfileStats = {
  totalTasks: number;
  completedTasks: number;
  openTasks: number;
  completionRateLabel: string;
  categoriesCount: number;
};

type ProfileContextType = {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  stats: ProfileStats;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return context;
};

export const ProfileProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [profile, setProfile] = useState<Profile | null>({
    id: "local-profile",
    name: "RiseByDay User",
    email: "you@example.com",
    avatarUrl: null,
  });
  const tasks = useTasksStore((s) => s.tasks);

  const stats = useMemo<ProfileStats>(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.done).length;
    const open = total - completed;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    const categories = new Set(
      tasks
        .map((t) => t.category?.trim())
        .filter((c): c is string => Boolean(c)),
    ).size;
    return {
      totalTasks: total,
      completedTasks: completed,
      openTasks: open,
      completionRateLabel: `${rate}%`,
      categoriesCount: categories,
    };
  }, [tasks]);

  const value = useMemo(
    () => ({ profile, setProfile, stats }),
    [profile, stats],
  );

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

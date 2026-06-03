import { AvatarProfilePhoto } from "@/components/base/avatar/avatar-profile-photo";
import { useTasksStore } from "@/stores/tasksStore";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { IoClose } from "react-icons/io5";

type Profile = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

type ProfileContextType = {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  isProfileOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const tasks = useTasksStore((s) => s.tasks);

  const openProfile = () => setIsProfileOpen(true);
  const closeProfile = () => setIsProfileOpen(false);

  useEffect(() => {
    const onOpenProfile = () => setIsProfileOpen(true);
    window.addEventListener("rbd:open-profile", onOpenProfile);
    return () => window.removeEventListener("rbd:open-profile", onOpenProfile);
  }, []);

  useEffect(() => {
    if (!isProfileOpen) return;

    const onEscClose = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    };

    window.addEventListener("keydown", onEscClose);
    return () => window.removeEventListener("keydown", onEscClose);
  }, [isProfileOpen]);

  const value = useMemo(
    () => ({
      profile,
      setProfile,
      isProfileOpen,
      openProfile,
      closeProfile,
    }),
    [profile, isProfileOpen],
  );

  const profileInitials =
    profile?.name
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "DB";

  const {
    totalTasks,
    openTasks,
    completionRateLabel,
    categoriesCount,
  } = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.done).length;
    const open = total - completed;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    const categories = new Set(
      tasks
        .map((task) => task.category?.trim())
        .filter((category): category is string => Boolean(category)),
    ).size;
    return {
      totalTasks: total,
      completedTasks: completed,
      openTasks: open,
      completionRateLabel: `${rate}%`,
      categoriesCount: categories,
    };
  }, [tasks]);

  return (
    <ProfileContext.Provider value={value}>
      {children}
      <aside
        role="complementary"
        aria-label="Profile panel"
        className={`fixed right-0 top-0 z-60 h-screen w-[360px] border-l border-zinc-200 bg-white shadow-2xl transition-transform duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-950 ${
          isProfileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="sticky top-0 border-b border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="pr-10">
            <p className="text-xs font-display font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Profile
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Your{" "}
              <span className="italic underline underline-offset-4 font-black">
                Persona
              </span>
              .
            </h2>
          </div>
          <button
            type="button"
            onClick={closeProfile}
            className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label="Close profile"
          >
            <IoClose className="h-5 w-5" />
          </button>
        </header>

        <div className="flex h-[calc(100vh-77px)] flex-col gap-4 overflow-y-auto p-5">
          <div className="flex items-center -skew-3 gap-4  border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <AvatarProfilePhoto
              size="sm"
              className="skew-3"
              src={profile?.avatarUrl ?? undefined}
              initials={profileInitials}
              alt={profile?.name ?? "Profile avatar"}
            />
            <div className="min-w-0 skew-3">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {profile?.name ?? "Not signed in"}
              </p>
              <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
                {profile?.email ?? "Local profile"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border col-span-2 border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
              <h2 className="text-lg font-eudoxus font-black text-zinc-900 dark:text-zinc-100">
                Your Taskcard
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {totalTasks} Tasks -{" "}
                <span className="text-zinc-900 font-display dark:text-zinc-100">
                  {openTasks} to Finish
                </span>
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Completion
              </p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                {completionRateLabel}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Active categories
            </p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {categoriesCount}
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Stats are local for now and ready to be replaced with
              Supabase-backed values.
            </p>
          </div>
        </div>
      </aside>
    </ProfileContext.Provider>
  );
};

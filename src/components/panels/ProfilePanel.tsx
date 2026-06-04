import { AvatarProfilePhoto } from "@/components/base/avatar/avatar-profile-photo";
import { useProfile } from "@/providers/ProfileProvider";

export function ProfilePanel() {
  const { profile, stats } = useProfile();

  const profileInitials =
    profile?.name
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "DB";

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
      <div className="flex items-center -skew-3 gap-4 border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
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
        <div className="col-span-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="font-eudoxus text-lg font-black text-zinc-900 dark:text-zinc-100">
            Your Taskcard
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {stats.totalTasks} Tasks —{" "}
            <span className="font-display text-zinc-900 dark:text-zinc-100">
              {stats.openTasks} to Finish
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Completion
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {stats.completionRateLabel}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Categories
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {stats.categoriesCount}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Active categories
        </p>
        <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {stats.categoriesCount}
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Stats are local for now and ready to be replaced with Supabase-backed
          values.
        </p>
      </div>
    </div>
  );
}

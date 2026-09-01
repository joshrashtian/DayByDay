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
      <div className="flex items-center -skew-3 gap-4 border border-line bg-sunken p-4">
        <AvatarProfilePhoto
          size="sm"
          className="skew-3"
          src={profile?.avatarUrl ?? undefined}
          initials={profileInitials}
          alt={profile?.name ?? "Profile avatar"}
        />
        <div className="min-w-0 skew-3">
          <p className="truncate text-sm font-semibold text-ink">
            {profile?.name ?? "Not signed in"}
          </p>
          <p className="truncate text-sm text-muted">
            {profile?.email ?? "Local profile"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 rounded-xl border border-line bg-surface p-3">
          <h2 className="font-eudoxus text-lg font-black text-ink">
            Your Taskcard
          </h2>
          <p className="text-sm text-muted">
            {stats.totalTasks} Tasks —{" "}
            <span className="font-display text-ink">
              {stats.openTasks} to Finish
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-xs uppercase tracking-wide text-muted">
            Completion
          </p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {stats.completionRateLabel}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-xs uppercase tracking-wide text-muted">
            Categories
          </p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {stats.categoriesCount}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="text-xs uppercase tracking-wide text-muted">
          Active categories
        </p>
        <p className="mt-1 text-2xl font-semibold text-ink">
          {stats.categoriesCount}
        </p>
        <p className="mt-2 text-sm text-muted">
          Stats are local for now and ready to be replaced with Supabase-backed
          values.
        </p>
      </div>
    </div>
  );
}

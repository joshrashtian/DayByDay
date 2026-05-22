import { useProfile } from "@/providers/ProfileProvider";

export function ProfileSection() {
  const { profile } = useProfile();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Profile
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Your local DayByDay profile.
        </p>
      </div>

      <dl className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4 dark:border-zinc-700 dark:bg-zinc-900/60">
        <div className="grid gap-1">
          <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Name
          </dt>
          <dd className="text-base text-zinc-900 dark:text-zinc-100">
            {profile?.name ?? "DayByDay User"}
          </dd>
        </div>
        <div className="mt-4 grid gap-1">
          <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Email
          </dt>
          <dd className="text-base text-zinc-900 dark:text-zinc-100">
            {profile?.email ?? "you@example.com"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

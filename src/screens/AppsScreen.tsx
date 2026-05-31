export default function AppsScreen() {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-6xl flex-col items-start px-3 pb-24 pt-20 sm:px-6 sm:pt-24 lg:px-8">
      <h1 className="font-quantify text-4xl text-zinc-900 dark:text-zinc-100 sm:text-5xl">
        Apps
      </h1>
      <p className="mt-3 max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
        Integrations you add will appear here. Connect your tools to bring tasks,
        timelines, and updates into RiseByDay.
      </p>
      <div className="mt-6 w-full max-w-xl rounded-2xl border border-zinc-200/80 bg-white/70 p-4 dark:border-zinc-700 dark:bg-zinc-900/60">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          First Integration
        </p>
        <p className="mt-1 font-quantify text-2xl text-zinc-900 dark:text-zinc-100">
          Spotify
        </p>
      </div>
    </main>
  );
}

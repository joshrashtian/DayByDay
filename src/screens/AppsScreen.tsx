export default function AppsScreen() {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-6xl flex-col items-start px-3 pb-24 pt-20 sm:px-6 sm:pt-24 lg:px-8">
      <h1 className="font-quantify text-4xl text-ink sm:text-5xl">
        Apps
      </h1>
      <p className="mt-3 max-w-2xl text-base text-muted">
        Integrations you add will appear here. Connect your tools to bring tasks,
        timelines, and updates into RiseByDay.
      </p>
      <div className="mt-6 w-full max-w-xl rounded-2xl border border-line/80 bg-surface/70 p-4 dark:bg-overlay">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          First Integration
        </p>
        <p className="mt-1 font-quantify text-2xl text-ink">
          Spotify
        </p>
      </div>
    </main>
  );
}

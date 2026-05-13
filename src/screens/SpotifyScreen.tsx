export default function SpotifyScreen() {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-6xl flex-col items-start px-3 pb-24 pt-20 sm:px-6 sm:pt-24 lg:px-8">
      <h1 className="font-quantify text-4xl text-zinc-900 dark:text-zinc-100 sm:text-5xl">
        Spotify
      </h1>
      <p className="mt-3 max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
        Connect Spotify to surface listening context, focus sessions, and music
        shortcuts inside DayByDay.
      </p>
    </main>
  );
}

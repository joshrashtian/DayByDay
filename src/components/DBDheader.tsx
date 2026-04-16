import { CriticalHeaderRibbon } from "./home/CriticalDayRibbon";

export const Header = () => {
  const items = [
    { label: "Day By Day", active: true },
    { label: "Today", active: false },
    { label: "Settings", active: false },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-4 pl-18 pr-4 sm:gap-3 sm:pr-6">
        <div className="flex min-w-0 justify-start overflow-x-clip overflow-y-visible">
          <CriticalHeaderRibbon />
        </div>

        <div className="relative flex justify-center justify-self-center">
          <div className="pointer-events-none absolute inset-x-6 -bottom-3 h-6 rounded-full bg-slate-400/40 blur-xl" />
          <nav className="relative flex w-fit shrink-0 items-center gap-2 rounded-full border border-slate-300/70 bg-slate-700/95 px-3 py-1 shadow-[0_14px_40px_rgba(15,23,42,0.55)] backdrop-blur-xl">
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`rounded-full px-4 py-1 text-xs font-medium tracking-wide transition ${
                  item.active
                    ? "bg-white text-slate-900 shadow-[0_0_0_1px_rgba(255,255,255,0.6)]"
                    : "text-slate-100/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="min-w-0" aria-hidden />
      </div>
    </header>
  );
};

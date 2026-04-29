import { DateCorner } from "../components/dateCorner";
import { Header } from "../components/DBDheader";
import { CriticalHeaderRibbon } from "../components/home/CriticalDayRibbon";
import { TasksFrontPage } from "../components/tasks/TasksFrontPage";

export const HomeScreen = () => (
  <div className="min-h-dvh">
    <Header />

    <main className="mx-auto max-w-6xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-10">
        <div className="flex min-w-0 flex-col items-stretch gap-5">
          <div className="  p-4 px-8 -rotate-3 font-bold text-left flex flex-row justify-start w-fit bg-white -skew-x-12 items-start gap-2">
            <h1 className="skew-x-12 text-2xl font-quantify  rotate-3">
              Early Morning
            </h1>
          </div>
          <CriticalHeaderRibbon />
          <TasksFrontPage />
        </div>
        <aside className="flex justify-end lg:shrink-0 lg:justify-end">
          <DateCorner />
        </aside>
      </div>
    </main>
  </div>
);

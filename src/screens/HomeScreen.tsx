import { DateCorner } from "../components/dateCorner";
import { Header } from "../components/DBDheader";
import { TasksFrontPage } from "../components/tasks/TasksFrontPage";

export const HomeScreen = () => (
  <div>
    <Header />
    <div className="fixed right-4 top-20 z-30 flex max-w-[calc(100vw-4.5rem)] flex-col items-end gap-3 sm:right-8 sm:max-w-none sm:flex-row-reverse sm:items-start sm:gap-5">
      <DateCorner rootClassName="relative shrink-0 select-none" />
    </div>
    <div className="grid mt-20 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <TasksFrontPage />
    </div>
  </div>
);

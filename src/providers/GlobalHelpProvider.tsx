import { createContext, ReactNode, useState } from "react";
import { IoClose } from "react-icons/io5";

type GuideContextType = {
  guide: boolean;
  setGuide: (guide: boolean) => void;
};
const GuideContext = createContext<GuideContextType | undefined>(undefined);

const GuideProvider = ({ children }: { children: ReactNode }) => {
  const [guide, setGuide] = useState(false);
  return (
    <GuideContext.Provider value={{ guide, setGuide }}>
      {guide && ( 
        <div className="fixed h-full w-full bg-overlay backdrop-blur-sm p-20 flex flex-col items-start justify-start gap-10 z-76">
          <h1 className="text-6xl text-white font-bold"> Guide </h1>
          <button onClick={() => setGuide(false)}>
            <IoClose className="text-2xl" />
          </button>
        </div>
      )}
      {children}
    </GuideContext.Provider>
  );
};

export default GuideProvider;

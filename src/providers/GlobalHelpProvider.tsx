import React, { createContext, ReactNode, useState } from "react";
import { IoClose } from "react-icons/io5";

type GuideContextType = {
  guide: boolean;
  setGuide: (guide: boolean) => void;
};
const GuideContext = createContext<GuideContextType | undefined>(undefined);

const GuideProvider = ({ children }: { children: ReactNode }) => {
  const [guide, setGuide] = useState(true);
  return (
    <GuideContext.Provider value={{ guide, setGuide }}>
      {guide && (
        <div className="fixed h-full w-full bg-zinc-950/50 backdrop-blur-sm z-76">
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

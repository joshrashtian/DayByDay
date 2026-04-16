import { createContext, useContext } from "react";
type StyleContextType = {
  style?: "minimal" | "p5";
  customStyle?: {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    shadowColor: string;
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    fontStyle: string;
    fontVariant: string;
  };
};

export const StyleContext = createContext<StyleContextType>({
  style: "minimal",
});

export const StyleProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <StyleContext.Provider value={{ style: "minimal" }}>
      {children}
    </StyleContext.Provider>
  );
};

export const useStyle = () => {
  return useContext(StyleContext);
};

export const styles = {
  minimal: {
    backgroundColor: "bg-zinc-100",
    textColor: "text-zinc-900",
    borderColor: "border-zinc-200",
    shadowColor: "shadow-zinc-200",
    fontFamily: "font-sans",
    fontSize: "text-sm",
    fontWeight: "font-normal",
    fontStyle: "normal",
    fontVariant: "normal",
  },
};

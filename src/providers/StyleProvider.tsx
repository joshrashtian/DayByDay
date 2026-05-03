import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  buildClockStylePrototype,
  defaultClockStyles,
  type ClockStylePack,
  type ClockStylePrototype,
  type ClockStylePrototypeInput,
} from "./clockStyleDefaults";
export type {
  ClockStylePack,
  ClockStylePrototype,
  ClockStylePrototypeInput,
  ClockStyleSource,
  ClockTemplate,
} from "./clockStyleDefaults";

type StyleContextType = {
  style?: string;
  setStyle: (styleId: string) => void;
  clockStyles: Record<string, ClockStylePrototype>;
  getClockStyle: (styleId?: string) => ClockStylePrototype;
  registerClockStyle: (
    styleId: string,
    style: ClockStylePrototypeInput,
  ) => void;
  registerClockStyles: (styles: ClockStylePack) => void;
  replaceClockStyles: (styles: ClockStylePack) => void;
};

export const StyleContext = createContext<StyleContextType>({
  style: "minimal",
  setStyle: () => {},
  clockStyles: defaultClockStyles,
  getClockStyle: () => defaultClockStyles.minimal,
  registerClockStyle: () => {},
  registerClockStyles: () => {},
  replaceClockStyles: () => {},
});

export const StyleProvider = ({ children }: { children: React.ReactNode }) => {
  const [style, setStyle] = useState<string>("minimal");
  const [clockStyles, setClockStyles] =
    useState<Record<string, ClockStylePrototype>>(defaultClockStyles);

  const getClockStyle = useCallback(
    (styleId?: string) => {
      const key = styleId ?? style ?? "minimal";
      return clockStyles[key] ?? clockStyles.minimal;
    },
    [clockStyles, style],
  );

  const registerClockStyle = useCallback(
    (styleId: string, input: ClockStylePrototypeInput) => {
      setClockStyles((current) => {
        return {
          ...current,
          [styleId]: buildClockStylePrototype(styleId, input, current[styleId]),
        };
      });
    },
    [],
  );

  const registerClockStyles = useCallback((styles: ClockStylePack) => {
    setClockStyles((current) => {
      const merged = { ...current };
      Object.entries(styles).forEach(([styleId, input]) => {
        merged[styleId] = buildClockStylePrototype(
          styleId,
          input,
          merged[styleId],
        );
      });
      return merged;
    });
  }, []);

  const replaceClockStyles = useCallback((styles: ClockStylePack) => {
    const nextStyles: Record<string, ClockStylePrototype> = {
      ...defaultClockStyles,
    };

    Object.entries(styles).forEach(([styleId, input]) => {
      nextStyles[styleId] = buildClockStylePrototype(styleId, input);
    });

    setClockStyles(nextStyles);
  }, []);

  const value = useMemo(
    () => ({
      style,
      setStyle,
      clockStyles,
      getClockStyle,
      registerClockStyle,
      registerClockStyles,
      replaceClockStyles,
    }),
    [
      clockStyles,
      getClockStyle,
      registerClockStyle,
      registerClockStyles,
      replaceClockStyles,
      style,
    ],
  );

  return (
    <StyleContext.Provider value={value}>{children}</StyleContext.Provider>
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
  db: {
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

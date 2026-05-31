import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useStyle } from "../providers/StyleProvider";
import {
  homeThemeRegistry,
  registerHomeTheme as registerHomeThemeInRegistry,
} from "./registry";
import type { HomeThemeDefinition, HomeThemeDefinitionInput, HomeThemeListItem } from "./types";

type ThemeRegistryContextValue = {
  registerHomeTheme: (input: HomeThemeDefinitionInput) => HomeThemeDefinition;
};

const ThemeRegistryContext = createContext<ThemeRegistryContextValue | null>(
  null,
);

function syncRegistryClockStyles(
  registerClockStyle: ReturnType<typeof useStyle>["registerClockStyle"],
) {
  homeThemeRegistry.list().forEach(({ id }) => {
    const theme = homeThemeRegistry.get(id);
    registerClockStyle(id, {
      template: theme.template,
      source: theme.source,
      pageClassName: theme.page.className,
      pageContentClassName: theme.page.contentClassName,
      ...theme.clockOverrides,
    });
  });
}

export function ThemeRegistryProvider({ children }: { children: ReactNode }) {
  const { registerClockStyle } = useStyle();

  useEffect(() => {
    syncRegistryClockStyles(registerClockStyle);
    return homeThemeRegistry.subscribe(() => {
      syncRegistryClockStyles(registerClockStyle);
    });
  }, [registerClockStyle]);

  const registerHomeTheme = useCallback((input: HomeThemeDefinitionInput) => {
    return registerHomeThemeInRegistry(input);
  }, []);

  const value = useMemo(
    () => ({ registerHomeTheme }),
    [registerHomeTheme],
  );

  return (
    <ThemeRegistryContext.Provider value={value}>
      {children}
    </ThemeRegistryContext.Provider>
  );
}

export function useThemeRegistry(): ThemeRegistryContextValue {
  const ctx = useContext(ThemeRegistryContext);
  if (!ctx) {
    throw new Error("useThemeRegistry must be used within ThemeRegistryProvider");
  }
  return ctx;
}

export function useHomeThemeList(): HomeThemeListItem[] {
  return useSyncExternalStore(
    (onStoreChange) => homeThemeRegistry.subscribe(onStoreChange),
    () => homeThemeRegistry.list(),
    () => homeThemeRegistry.list(),
  );
}

export function useSectionStyleList<T extends string>(
  registry: { subscribe: (cb: () => void) => () => void; list: () => { id: T; label: string; description?: string }[] },
) {
  return useSyncExternalStore(
    (onStoreChange) => registry.subscribe(onStoreChange),
    () => registry.list(),
    () => registry.list(),
  );
}

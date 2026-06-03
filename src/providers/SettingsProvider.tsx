import { createContext, useContext, useMemo, useState } from "react";

interface SettingsContextType {
  currentPage: string;
  navigate: (page: string) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider = ({
  children,
  initialPage = "",
}: {
  children: React.ReactNode;
  initialPage?: string;
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const value = useMemo<SettingsContextType>(
    () => ({
      currentPage,
      navigate: (page: string) => setCurrentPage(page),
    }),
    [currentPage],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
};

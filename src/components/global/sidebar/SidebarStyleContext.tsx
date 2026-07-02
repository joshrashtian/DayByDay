import { createContext, useContext } from "react";
import type { SidebarStyleTokens } from "@/types";
import { getSidebarStyle } from "@/themes/sidebarStyles";

const SidebarStyleContext = createContext<SidebarStyleTokens>(
  getSidebarStyle().tokens,
);

export const SidebarStyleProvider = SidebarStyleContext.Provider;

export function useSidebarStyle(): SidebarStyleTokens {
  return useContext(SidebarStyleContext);
}

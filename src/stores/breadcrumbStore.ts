import { create } from "zustand";
import type { To } from "react-router-dom";

export type BreadcrumbItem = {
  label: string;
  to?: To;
};

type BreadcrumbState = {
  items: BreadcrumbItem[];
  /** Identifies the page that registered `items`, so a stale unmount can't clear a newer page's trail. */
  owner: symbol | null;
  setItems: (owner: symbol, items: BreadcrumbItem[]) => void;
  clear: (owner: symbol) => void;
};

/** The active page's breadcrumb trail, shown by `TopBreadcrumbBar`. Not persisted. */
export const useBreadcrumbStore = create<BreadcrumbState>((set, get) => ({
  items: [],
  owner: null,
  setItems: (owner, items) => set({ owner, items }),
  clear: (owner) => {
    if (get().owner === owner) set({ owner: null, items: [] });
  },
}));

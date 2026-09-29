import { useEffect, useRef } from "react";
import {
  useBreadcrumbStore,
  type BreadcrumbItem,
} from "@/stores/breadcrumbStore";

/**
 * Registers the calling page's breadcrumb trail with the global top bar for as
 * long as the page is mounted. Items are compared by value, so passing a fresh
 * array literal every render is fine.
 */
export function useBreadcrumbs(items: BreadcrumbItem[]) {
  const ownerRef = useRef<symbol>(Symbol("breadcrumbs"));
  const setItems = useBreadcrumbStore((s) => s.setItems);
  const clear = useBreadcrumbStore((s) => s.clear);
  const key = JSON.stringify(items);

  useEffect(() => {
    setItems(ownerRef.current, JSON.parse(key) as BreadcrumbItem[]);
  }, [key, setItems]);

  useEffect(() => {
    const owner = ownerRef.current;
    return () => clear(owner);
  }, [clear]);
}

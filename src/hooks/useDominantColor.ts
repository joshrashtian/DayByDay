import { useEffect, useState } from "react";
import { extractDominantColor } from "@/lib/dominantColor";

/** Representative colour of an image URL, or `null` until known / on failure. */
export function useDominantColor(url: string | undefined): string | null {
  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setColor(null);
      return;
    }
    let cancelled = false;
    void extractDominantColor(url).then((next) => {
      if (!cancelled) setColor(next);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return color;
}

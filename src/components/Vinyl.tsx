import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import VinylImage from "@/assets/images/VinylImage.png";

// Measured from the artwork: the label is ~30% of the disc and the disc fills
// ~98% of the square, so the art is sized against the square itself and nudged
// up a touch to hide the label's edge.
const LABEL_SIZE = "32%";
const SPINDLE_SIZE = "3%";

type VinylProps = Omit<ComponentProps<"div">, "children"> & {
  /** Drawn as the record's label; the printed red label shows when absent. */
  albumArtUrl?: string;
  /** Rotates the whole record, label included. */
  spinning?: boolean;
};

/**
 * A vinyl record with the album art printed on its label. Square; size it
 * with `className` (defaults to `size-24`).
 */
export default function Vinyl({
  albumArtUrl,
  spinning = false,
  className,
  ...props
}: VinylProps) {
  return (
    <div
      {...props}
      className={twMerge(
        "relative aspect-square size-24 select-none",
        className,
      )}
    >
      <div
        className={twMerge(
          "absolute inset-0",
          spinning && "animate-spin-slow motion-reduce:animate-none",
        )}
      >
        <img
          src={VinylImage}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 h-full w-full"
        />
        {albumArtUrl ? (
          <img
            src={albumArtUrl}
            alt=""
            aria-hidden
            draggable={false}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full object-cover"
            style={{ width: LABEL_SIZE, height: LABEL_SIZE }}
          />
        ) : null}
        {/* Spindle hole, punched through the label. */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-canvas"
          style={{ width: SPINDLE_SIZE, height: SPINDLE_SIZE }}
        />
      </div>
    </div>
  );
}

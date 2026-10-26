import type { KindStyle } from "@queenstown/shared";

/**
 * What stands in for a missing photo: the kind's colour, lightly, with its picture in the middle
 * (shared/src/categoryStyle.ts). Decorative: the name next to it says what the place is.
 */
export function KindPlaceholder({ look, className }: { look: KindStyle; className: string }) {
  return (
    <div
      data-slot="image-placeholder"
      aria-hidden="true"
      className={`${className} flex items-center justify-center text-3xl md:text-5xl`}
      // A tenth of the colour over white, so the picture stands out and the card stays light.
      style={{ backgroundColor: `${look.color}1a` }}
    >
      {look.emoji}
    </div>
  );
}

/** The small round mark of a kind's colour in a chip, matching its markers on the map. */
export function KindDot({ color }: { color: string }) {
  return (
    <span
      data-slot="kind-dot"
      aria-hidden="true"
      className="inline-block size-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}

import Link from "next/link";

const linkClass =
  "flex h-11 shrink-0 items-center whitespace-nowrap rounded-full border border-neutral-400 px-4 text-sm font-medium aria-[current=page]:border-neutral-950 aria-[current=page]:bg-neutral-950 aria-[current=page]:text-white";

type Item = { key: string; label: string; href: string; active: boolean };

/**
 * A row of filters of which one is chosen, each a link to its own list (m-notices, m-events). The
 * row stays on one line and scrolls sideways where it does not fit.
 */
export function FilterLinks({ label, items }: { label: string; items: Item[] }) {
  return (
    <nav aria-label={label} className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3">
      {items.map((item) => (
        <Link key={item.key} href={item.href} aria-current={item.active ? "page" : undefined} className={linkClass}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

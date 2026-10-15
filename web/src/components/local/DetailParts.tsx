import type { ReactNode } from "react";

/** A labelled part of a detail page (m-notice, m-event): a small heading over its content. */
export function DetailRow({
  title,
  className = "",
  action,
  children,
}: {
  title: string;
  className?: string;
  /** Sits to the right of the content, such as "View on map". */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`${className} flex items-center gap-3 border-t border-neutral-200 pt-4 md:order-none`}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">{title}</h2>
        {children}
      </div>
      {action}
    </section>
  );
}

/** A bordered button-like link beside a row's content, 44px tall. */
export const sideActionClass =
  "flex min-h-11 shrink-0 items-center rounded-lg border border-neutral-950 px-3 text-sm font-semibold";

/** Says that the event or notice is over; its page stays for the links that lead here. */
export function EndedNotice({ text }: { text: string }) {
  return <p className="rounded-lg bg-neutral-100 px-4 py-3 font-semibold">{text}</p>;
}

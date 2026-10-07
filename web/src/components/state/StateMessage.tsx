import type { ReactNode } from "react";

/** A full-page message for loading, error and not-found states. Actions go in as children. */
export function StateMessage({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-xl font-bold">{title}</h1>
      {body ? <p className="text-neutral-600">{body}</p> : null}
      {children ? <div className="mt-2 flex flex-wrap justify-center gap-3">{children}</div> : null}
    </section>
  );
}

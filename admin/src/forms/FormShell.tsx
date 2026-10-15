import type { ReactNode } from "react";
import { Link } from "react-router";
import type { AdminForm } from "./useAdminForm";

type Props = {
  form: AdminForm;
  /** "Places", for the breadcrumb. */
  section: string;
  path: string;
  /** "Edit place" or "New place". */
  title: string;
  /** The fields on the left. */
  main: ReactNode;
  /** The location and status on the right. */
  side: ReactNode;
};

/** The frame of a form (wireframe ad-place-form): breadcrumb, title, Cancel and Save, two columns. */
export function FormShell({ form, section, path, title, main, side }: Props) {
  if (form.status === "loading") {
    return <p className="text-neutral-600">Loading…</p>;
  }
  if (form.status === "missing" || form.status === "failed") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert">{form.status === "missing" ? "There is no such item." : "We couldn't load this item."}</p>
        <Link to={`/${path}`} className="font-semibold underline">
          Back to {section}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={form.submit} noValidate className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">
            <Link to={`/${path}`}>{section}</Link> /
          </p>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={form.cancel} className="rounded-lg border border-neutral-900 px-4 py-2 font-semibold">
            Cancel
          </button>
          <button
            type="submit"
            disabled={form.saving}
            className="rounded-lg bg-neutral-900 px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            {form.saving ? "Saving…" : "Save"}
          </button>
        </div>
      </header>
      <p role="alert" className="text-sm text-red-700 empty:hidden">
        {form.problem}
      </p>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="flex flex-col gap-4">{main}</div>
        <div className="flex flex-col gap-4">{side}</div>
      </div>
    </form>
  );
}

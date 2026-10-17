import type { Page, Status } from "@queenstown/shared";
import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { adminRequest } from "@/auth/session";
import { STATUS_LABELS } from "@/lib/labels";

export type Column<T> = { header: string; cell: (item: T) => ReactNode };

/** A select above the table; its value goes to the API as the parameter of the same name. */
export type Filter = { name: string; allLabel: string; options: { value: string; label: string }[] };

type Props<T> = {
  title: string;
  /** "places": the API path under /admin and the screen's own path. */
  path: string;
  newLabel: string;
  searchLabel: string;
  filters: Filter[];
  columns: Column<T>[];
};

const PAGE_SIZE = 20;

/** "Public" filled, "Private" outlined (wireframe ad-places, 4). */
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold ${
        status === "public" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-500 text-neutral-700"
      }`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

/**
 * A list of the admin (wireframe ad-places, ADMIN-02 ~ ADMIN-04): search, filters, the table and
 * the New button. Every status is listed, most recently changed first. The search and filters are
 * in the address, so the list comes back the same after a form.
 */
export function ListPage<T extends { id: number }>({ title, path, newLabel, searchLabel, filters, columns }: Props<T>) {
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  // The form comes back to the list as it is now (useAdminForm).
  const back = { list: location.pathname + location.search };
  const [state, setState] = useState<{ query: string; page: Page<T> | null; failed: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);

  const query = params.toString();
  const pageNumber = Number(params.get("page") ?? "1") || 1;

  useEffect(() => {
    let gone = false;
    const search = new URLSearchParams(query);
    search.set("size", String(PAGE_SIZE));
    adminRequest<Page<T>>("GET", `/${path}?${search}`).then(
      (page) => !gone && setState({ query, page, failed: false }),
      () => !gone && setState({ query, page: null, failed: true }),
    );
    return () => {
      gone = true;
    };
  }, [path, query, attempt]);

  const change = useCallback(
    (name: string, value: string) => {
      const next = new URLSearchParams(params);
      if (value) {
        next.set(name, value);
      } else {
        next.delete(name);
      }
      if (name !== "page") {
        next.delete("page");
      }
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    change("q", String(new FormData(event.currentTarget).get("q") ?? "").trim());
  }

  const current = state?.query === query ? state : null;
  const page = current?.page ?? null;
  const pages = page ? Math.max(1, Math.ceil(page.total / page.size)) : 1;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Link to={`/${path}/new`} state={back} className="rounded-lg bg-neutral-900 px-4 py-2 font-semibold text-white">
          {newLabel}
        </Link>
      </header>

      <div className="flex flex-wrap gap-3">
        <form role="search" onSubmit={search} className="flex min-w-64 flex-1">
          <input
            key={params.get("q") ?? ""}
            name="q"
            type="search"
            defaultValue={params.get("q") ?? ""}
            placeholder={searchLabel}
            aria-label={searchLabel}
            className="w-full rounded-lg border border-neutral-400 px-3 py-2"
          />
        </form>
        {filters.map((filter) => (
          <select
            key={filter.name}
            aria-label={filter.allLabel}
            value={params.get(filter.name) ?? ""}
            onChange={(event) => change(filter.name, event.target.value)}
            className="rounded-lg border border-neutral-400 px-3 py-2"
          >
            <option value="">{filter.allLabel}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}
      </div>

      {current === null ? <p className="text-neutral-600">Loading…</p> : null}
      {current?.failed ? (
        <p role="alert" className="flex items-center gap-3">
          We couldn&apos;t load the list.
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className="font-semibold underline">
            Try again
          </button>
        </p>
      ) : null}
      {page && page.items.length === 0 ? <p className="text-neutral-600">Nothing matches.</p> : null}
      {page && page.items.length > 0 ? (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-neutral-300 text-sm text-neutral-600">
              {columns.map((column) => (
                <th key={column.header} scope="col" className="px-3 py-2 font-semibold">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {page.items.map((item) => (
              <tr
                key={item.id}
                onClick={() => navigate(`/${path}/${item.id}`, { state: back })}
                className="cursor-pointer border-b border-neutral-200 hover:bg-neutral-50"
              >
                {columns.map((column, index) => (
                  <td key={column.header} className="px-3 py-3">
                    {/* The first cell is a real link, for the keyboard and for opening in a new tab. */}
                    {index === 0 ? (
                      <Link
                        to={`/${path}/${item.id}`}
                        state={back}
                        className="font-semibold"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {column.cell(item)}
                      </Link>
                    ) : (
                      column.cell(item)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {page && pages > 1 ? (
        <nav aria-label="Pages" className="flex items-center gap-4">
          <button type="button" disabled={pageNumber <= 1} onClick={() => change("page", String(pageNumber - 1))}>
            Previous
          </button>
          <span className="text-sm text-neutral-600">
            Page {pageNumber} of {pages}
          </span>
          <button type="button" disabled={pageNumber >= pages} onClick={() => change("page", String(pageNumber + 1))}>
            Next
          </button>
        </nav>
      ) : null}
    </div>
  );
}

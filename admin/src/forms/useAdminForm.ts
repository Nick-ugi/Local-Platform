import { ApiError } from "@queenstown/shared";
import { type FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { adminRequest } from "@/auth/session";
import type { Errors, Values } from "./fields";

type Options<Item, Input> = {
  /** "places": the API path under /admin and the list's path. */
  path: string;
  /** The item's id, or null for a new one. */
  id: string | null;
  /** The fields of a new item. */
  blank: Values;
  /** The fields of an item that is there. */
  toValues: (item: Item) => Values;
  /** The request body, or the fields that are wrong before anything is sent. */
  toInput: (values: Values) => { input: Input } | { errors: Errors };
};

export type AdminForm = {
  /** "loading" while an item that is there is fetched; "missing" when there is none for the id. */
  status: "loading" | "ready" | "missing" | "failed";
  values: Values;
  errors: Errors;
  /** Above the form, for a failure that is not about one field. */
  problem: string | null;
  saving: boolean;
  change: (name: string, value: string) => void;
  /** Changes several fields at once, such as latitude and longitude from the map. */
  changeAll: (changes: Values) => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
  cancel: () => void;
};

/**
 * The life of an admin form (wireframe ad-place-form, 1): load the item, edit the fields, check the
 * required ones, then POST a new item or PUT the whole item back. The server's field errors are
 * shown under their fields. Saving or cancelling goes back to the list as it was left.
 */
export function useAdminForm<Item, Input>({ path, id, blank, toValues, toInput }: Options<Item, Input>): AdminForm {
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState<Values>(blank);
  const [status, setStatus] = useState<AdminForm["status"]>(id === null ? "ready" : "loading");
  const [errors, setErrors] = useState<Errors>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // The list's address as the admin left it (ListPage passes it), to come back to.
  const back = (location.state as { list?: string } | null)?.list ?? `/${path}`;

  useEffect(() => {
    if (id === null) {
      return;
    }
    let gone = false;
    adminRequest<Item>("GET", `/${path}/${id}`).then(
      (item) => {
        if (!gone) {
          setValues(toValues(item));
          setStatus("ready");
        }
      },
      (error: unknown) => {
        if (!gone) {
          setStatus(error instanceof ApiError && error.status === 404 ? "missing" : "failed");
        }
      },
    );
    return () => {
      gone = true;
    };
    // toValues is a plain function of the screen; the item is fetched once per id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, id]);

  function change(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!(name in current)) {
        return current;
      }
      const rest = { ...current };
      delete rest[name];
      return rest;
    });
  }

  function changeAll(changes: Values) {
    for (const [name, value] of Object.entries(changes)) {
      change(name, value);
    }
  }

  async function save(input: Input) {
    setSaving(true);
    setProblem(null);
    try {
      await adminRequest(id === null ? "POST" : "PUT", id === null ? `/${path}` : `/${path}/${id}`, input);
      navigate(back);
    } catch (error) {
      if (error instanceof ApiError && error.errors.length > 0) {
        setErrors(Object.fromEntries(error.errors.map((field) => [field.field, field.message])));
        setProblem("Some fields need fixing.");
      } else if (error instanceof ApiError && error.status === 404) {
        setProblem("This item no longer exists.");
      } else {
        setProblem("We couldn't save. Try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = toInput(values);
    if ("errors" in result) {
      setErrors(result.errors);
      setProblem("Some fields need fixing.");
      return;
    }
    setErrors({});
    void save(result.input);
  }

  return { status, values, errors, problem, saving, change, changeAll, submit, cancel: () => navigate(back) };
}

/** Text that may be left empty: null when it is. */
export function optional(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

/** Collects "is required" for each required field that is empty. */
export function requireFields(values: Values, names: string[]): Errors {
  const errors: Errors = {};
  for (const name of names) {
    if ((values[name] ?? "").trim() === "") {
      errors[name] = "is required";
    }
  }
  return errors;
}

/** A number typed in a field, or null when it is empty or not a number. */
export function numberOf(value: string | undefined): number | null {
  const text = (value ?? "").trim();
  if (text === "") {
    return null;
  }
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

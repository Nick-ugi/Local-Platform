import type { ReactNode } from "react";

/** The fields of a form as text, the way the inputs hold them. */
export type Values = Record<string, string>;

/** A message under each field that is wrong, by field name. */
export type Errors = Record<string, string>;

type FieldProps = {
  name: string;
  label: string;
  required?: boolean;
  values: Values;
  errors: Errors;
  onChange: (name: string, value: string) => void;
};

function Label({ label, required, hint }: { label: string; required?: boolean; hint?: string }) {
  return (
    <span className="text-sm font-semibold">
      {label}
      {required ? <span aria-hidden="true"> *</span> : null}
      {hint ? <span className="font-normal text-neutral-500"> {hint}</span> : null}
    </span>
  );
}

function ErrorText({ id, error }: { id: string; error?: string }) {
  return error ? (
    <span id={id} className="text-sm text-red-700">
      {error}
    </span>
  ) : null;
}

const inputClass = "rounded-lg border border-neutral-400 px-3 py-2 aria-[invalid=true]:border-red-700";

/** A text input with its label, and the error under it (wireframe ad-place-form, 1). */
export function TextField({
  name,
  label,
  required,
  values,
  errors,
  onChange,
  type = "text",
  multiline = false,
  hint,
  placeholder,
}: FieldProps & { type?: string; multiline?: boolean; hint?: string; placeholder?: string }) {
  const errorId = `${name}-error`;
  const common = {
    name,
    value: values[name] ?? "",
    required,
    placeholder,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? errorId : undefined,
    className: inputClass,
  };
  return (
    <label className="flex flex-col gap-1">
      <Label label={label} required={required} hint={hint} />
      {multiline ? (
        <textarea rows={4} {...common} onChange={(event) => onChange(name, event.target.value)} />
      ) : (
        <input type={type} step={type === "number" ? "any" : undefined} {...common} onChange={(event) => onChange(name, event.target.value)} />
      )}
      <ErrorText id={errorId} error={errors[name]} />
    </label>
  );
}

export function SelectField({
  name,
  label,
  required,
  values,
  errors,
  onChange,
  options,
  disabled,
  hint,
}: FieldProps & { options: { value: string; label: string }[]; disabled?: boolean; hint?: string }) {
  const errorId = `${name}-error`;
  return (
    <label className="flex flex-col gap-1">
      <Label label={label} required={required} hint={hint} />
      <select
        name={name}
        value={values[name] ?? ""}
        disabled={disabled}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={errors[name] ? errorId : undefined}
        onChange={(event) => onChange(name, event.target.value)}
        className={`${inputClass} disabled:bg-neutral-100`}
      >
        <option value="">-</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ErrorText id={errorId} error={errors[name]} />
    </label>
  );
}

/** Public or Private (wireframe ad-place-form, 5). */
export function StatusField({ values, onChange }: Pick<FieldProps, "values" | "onChange">) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-sm font-semibold">Status</legend>
      <div className="flex gap-6 pt-1">
        {[
          { value: "public", label: "Public" },
          { value: "private", label: "Private" },
        ].map((option) => (
          <label key={option.value} className="flex items-center gap-2">
            <input
              type="radio"
              name="status"
              value={option.value}
              checked={values.status === option.value}
              onChange={() => onChange("status", option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
      <span className="text-sm text-neutral-500">Public items show on the web and in the app.</span>
    </fieldset>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

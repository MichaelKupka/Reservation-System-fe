import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { InlineError, Submit } from "../../../shared/ui/index";

export function MutationForm({
  children,
  save,
  done,
  label = "Uložiť",
}: {
  children: ReactNode;
  save: (data: FormData) => Promise<unknown>;
  done: () => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError(undefined);
    try {
      await save(values);
      done();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-stack" onSubmit={submit}>
      <InlineError error={error} />
      <fieldset disabled={busy}>{children}</fieldset>
      <Submit busy={busy}>{label}</Submit>
    </form>
  );
}
export function Field({
  label,
  name,
  value,
  type = "text",
  required = true,
  min,
  max,
  step,
  maxLength,
}: {
  label: string;
  name: string;
  value?: string | number;
  type?: string;
  required?: boolean;
  min?: number | string;
  max?: number;
  step?: string;
  maxLength?: number;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        defaultValue={value}
        required={required}
        min={min}
        max={max}
        step={step}
        maxLength={maxLength}
      />
    </label>
  );
}
export const text = (data: FormData, key: string) =>
  String(data.get(key) || "");
export const number = (data: FormData, key: string) => Number(data.get(key));

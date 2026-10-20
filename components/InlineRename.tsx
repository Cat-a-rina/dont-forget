"use client";

import { useId, useRef, useState } from "react";
import FieldError from "./FieldError";

/**
 * A text box for renaming something in place. A bad name never throws away what was typed:
 * the box stays open and an error under it says what to do. Enter saves, Escape keeps the old name.
 */
export default function InlineRename({
  value,
  label,
  validate,
  onCommit,
  className = "inline-edit",
}: {
  value: string;
  label: string;
  /** Returns a message saying what is wrong and what to do, or null if the name is fine. */
  validate: (next: string) => string | null;
  onCommit: (next: string) => void;
  className?: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const done = useRef(false);

  const commit = (next: string) => {
    if (done.current) return;
    const message = validate(next);
    if (message) {
      setError(message);
      return;
    }
    done.current = true;
    onCommit(next.trim());
  };

  return (
    <span className="rename">
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        ref={input}
        className={className}
        defaultValue={value}
        autoFocus
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        onFocus={(e) => e.currentTarget.select()}
        onChange={() => error && setError(null)}
        onBlur={(e) => commit(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(e.currentTarget.value);
          }
          if (e.key === "Escape") {
            e.preventDefault();
            e.currentTarget.value = value;
            commit(value);
          }
        }}
      />
      <FieldError id={`${id}-error`} message={error} />
    </span>
  );
}

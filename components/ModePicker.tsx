"use client";

import type { Mode } from "@/lib/types";

export const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "time", label: "By time of day", hint: "Lists rotate as your day changes." },
  { id: "date", label: "By date", hint: "Overdue and soonest first." },
  { id: "manual", label: "My own order", hint: "Drag lists to reorder." },
];

/** Choose how lists are ordered. Arrow keys move the choice; only the chosen option is a Tab stop. */
export default function ModePicker({ mode, onPick, compact = false }: { mode: Mode; onPick: (m: Mode) => void; compact?: boolean }) {
  const move = (e: React.KeyboardEvent, i: number) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = MODES[(i + step + MODES.length) % MODES.length].id;
    onPick(next);
    const group = e.currentTarget.parentElement;
    setTimeout(() => group?.querySelector<HTMLElement>(`[data-id="${next}"]`)?.focus(), 0);
  };

  return (
    <div className={`mode-picker${compact ? " compact" : ""}`} role="radiogroup" aria-label="How lists are ordered">
      {MODES.map((m, i) => (
        <button
          key={m.id}
          type="button"
          role="radio"
          data-id={m.id}
          aria-checked={mode === m.id}
          tabIndex={mode === m.id ? 0 : -1}
          className={mode === m.id ? "on" : ""}
          onClick={() => onPick(m.id)}
          onKeyDown={(e) => move(e, i)}
        >
          <strong>{m.label}</strong>
          {!compact && <span className="faint small">{m.hint}</span>}
        </button>
      ))}
    </div>
  );
}

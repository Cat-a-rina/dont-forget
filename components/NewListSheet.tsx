"use client";

import { useState } from "react";
import { unusedSuggestions } from "@/lib/suggestions";

/** Name a new list (or tap a suggestion) and add its first items right away. */
export default function NewListSheet({
  existingNames,
  onCreate,
  onClose,
}: {
  existingNames: string[];
  onCreate: (name: string, items: string[]) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const suggestions = unusedSuggestions(existingNames);
  const taken = existingNames.some((n) => n.toLowerCase() === name.trim().toLowerCase());

  const withDraft = () => (draft.trim() ? [...items, draft.trim()] : items);

  return (
    <div className="scrim" onClick={onClose} onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="sheet" role="dialog" aria-label="New list" onClick={(e) => e.stopPropagation()}>
        <h2 className="brand">New list</h2>
        <input
          className="sheet-title"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              document.getElementById("new-list-item")?.focus();
            }
          }}
          placeholder="Enter list name"
          aria-label="List name"
          autoFocus
        />
        {taken && <p className="faint small">You already have a list with this name, so new items will be added to it.</p>}
        {suggestions.length > 0 && (
          <div>
            <p className="faint small">Suggested</p>
            <div className="chips">
              {suggestions.map((s) => (
                <button key={s} type="button" className="suggest" onClick={() => setName(s)}>
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <ul className="plain-list">
          {items.map((t, i) => (
            <li key={i} className="plain-row">
              <span>{t}</span>
              <button className="icon-btn" aria-label={`Remove ${t}`} onClick={() => setItems(items.filter((_, j) => j !== i))}>
                &times;
              </button>
            </li>
          ))}
        </ul>
        <form
          className="add-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) {
              setItems(withDraft());
              setDraft("");
            } else if (name.trim()) {
              document.getElementById("create-list")?.focus();
            }
          }}
        >
          <input id="new-list-item" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add an item" aria-label="New item" />
          <button type="submit" className="btn ghost" disabled={!draft.trim()}>
            + Add
          </button>
        </form>

        <div className="sheet-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button id="create-list" type="button" className="btn primary" disabled={!name.trim()} onClick={() => onCreate(name, withDraft())}>
            Create list
          </button>
        </div>
      </div>
    </div>
  );
}

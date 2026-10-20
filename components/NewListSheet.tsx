"use client";

import { useId, useRef, useState } from "react";
import { unusedSuggestions } from "@/lib/suggestions";
import { clearDraft, usePersistedState } from "@/lib/useDraft";
import { useDialog } from "@/lib/useDialog";
import FieldError, { DraftNote } from "./FieldError";

interface Form {
  name: string;
  items: string[];
  draft: string;
}
const EMPTY: Form = { name: "", items: [], draft: "" };

/** Name a new list (or tap a suggestion) and add its first items right away. */
export default function NewListSheet({
  existingNames,
  onCreate,
  onClose,
  saveFailed = false,
}: {
  existingNames: string[];
  onCreate: (name: string, items: string[]) => void;
  onClose: () => void;
  saveFailed?: boolean;
}) {
  const [form, setForm, restored] = usePersistedState<Form>("new-list", EMPTY);
  const [nameError, setNameError] = useState<string | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  useDialog(dialog, onClose);
  const id = useId();
  const nameId = `${id}-name`;
  const itemId = `${id}-item`;

  const suggestions = unusedSuggestions(existingNames);
  const taken = existingNames.some((n) => n.toLowerCase() === form.name.trim().toLowerCase());
  const withDraft = () => (form.draft.trim() ? [...form.items, form.draft.trim()] : form.items);
  const hasDraft = restored && JSON.stringify(form) !== JSON.stringify(EMPTY);

  const create = () => {
    if (!form.name.trim()) {
      setNameError("Give the list a name, like “Groceries”, or tap a suggestion below.");
      document.getElementById(nameId)?.focus();
      return;
    }
    clearDraft("new-list");
    onCreate(form.name, withDraft());
  };

  const addItem = () => {
    if (!form.draft.trim()) {
      setItemError("Type an item first, then press Add or Enter.");
      document.getElementById(itemId)?.focus();
      return;
    }
    setItemError(null);
    setForm({ ...form, items: withDraft(), draft: "" });
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div ref={dialog} className="sheet" role="dialog" aria-modal="true" aria-label="New list" onClick={(e) => e.stopPropagation()}>
        <h2 className="brand">New list</h2>
        {hasDraft && <DraftNote onDiscard={() => setForm(EMPTY)} />}

        <div className="field">
          <label className="field-label" htmlFor={nameId}>
            List name
          </label>
          <input
            id={nameId}
            className="sheet-title"
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              if (nameError) setNameError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                document.getElementById(itemId)?.focus();
              }
            }}
            placeholder="Enter list name"
            aria-invalid={!!nameError}
            aria-describedby={nameError ? `${nameId}-error` : taken ? `${nameId}-note` : undefined}
            autoFocus
          />
          <FieldError id={`${nameId}-error`} message={nameError} />
          {taken && (
            <p id={`${nameId}-note`} className="faint small">
              You already have a list with this name, so new items will be added to it.
            </p>
          )}
        </div>

        {suggestions.length > 0 && (
          <div>
            <p className="faint small" id={`${id}-sug`}>
              Suggested
            </p>
            <div className="chips" role="group" aria-labelledby={`${id}-sug`}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="suggest"
                  onClick={() => {
                    setForm({ ...form, name: s });
                    setNameError(null);
                  }}
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {form.items.length > 0 && (
          <ul className="plain-list" aria-label="Items in this list">
            {form.items.map((t, i) => (
              <li key={i} className="plain-row">
                <span className="grow">{t}</span>
                <button className="icon-btn" aria-label={`Remove ${t}`} onClick={() => setForm({ ...form, items: form.items.filter((_, j) => j !== i) })}>
                  &times;
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="add-row"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.draft.trim() && form.name.trim()) {
              document.getElementById("create-list")?.focus();
              return;
            }
            addItem();
          }}
        >
          <label className="sr-only" htmlFor={itemId}>
            Add an item to this list
          </label>
          <input
            id={itemId}
            value={form.draft}
            onChange={(e) => {
              setForm({ ...form, draft: e.target.value });
              if (itemError) setItemError(null);
            }}
            placeholder="Add an item"
            aria-invalid={!!itemError}
            aria-describedby={itemError ? `${itemId}-error` : undefined}
          />
          <button type="submit" className="btn ghost">
            + Add
          </button>
        </form>
        <FieldError id={`${itemId}-error`} message={itemError} />

        {saveFailed && (
          <p className="field-error" role="alert">
            <span aria-hidden>! </span>
            This device can&rsquo;t save right now, so this list may be lost when you close the page. Export your data from Settings.
          </p>
        )}

        <div className="sheet-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              clearDraft("new-list");
              onClose();
            }}
          >
            Cancel
          </button>
          <button id="create-list" type="button" className="btn primary" onClick={create}>
            Create list
          </button>
        </div>
      </div>
    </div>
  );
}

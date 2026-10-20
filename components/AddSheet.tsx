"use client";

import { useId, useRef, useState } from "react";
import type { Category, Item, Repeat } from "@/lib/types";
import { defaultRepeat } from "@/lib/actions";
import { todayStr } from "@/lib/dates";
import { paletteAt } from "@/lib/style";
import { clearDraft, usePersistedState } from "@/lib/useDraft";
import { useDialog } from "@/lib/useDialog";
import FieldError, { DraftNote } from "./FieldError";

const NEW = "__new__";

export interface AddInput {
  title: string;
  categoryId: string | null;
  newCategory: string;
  repeat: Repeat;
  due: string | null;
}

interface Form {
  title: string;
  cat: string;
  newName: string;
  repeat: Repeat;
  due: string;
}

/** Add a new item, or (with `editing`) change an existing item's title, list, repeat, and date. */
export default function AddSheet({
  categories,
  defaultCategoryId,
  editing,
  existingTitles,
  onAdd,
  onDelete,
  onClose,
  saveFailed = false,
}: {
  categories: Category[];
  defaultCategoryId: string | null;
  editing?: Item;
  existingTitles: (categoryId: string) => string[];
  onAdd: (input: AddInput) => void;
  onDelete?: () => void;
  onClose: () => void;
  saveFailed?: boolean;
}) {
  const startCat = editing?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? NEW;
  const initial: Form = {
    title: editing?.title ?? "",
    cat: startCat,
    newName: "",
    repeat: editing?.repeat ?? defaultRepeat(categories.find((c) => c.id === startCat)),
    due: editing?.due ?? "",
  };
  const draftKey = editing ? `edit:${editing.id}` : "add-item";
  const [saved, setForm, restored] = usePersistedState<Form>(draftKey, initial);
  // A draft can point at a list that no longer exists; fall back to the starting list.
  const form: Form = saved.cat === NEW || categories.some((c) => c.id === saved.cat) ? saved : { ...saved, cat: startCat };
  const set = (patch: Partial<Form>) => setForm({ ...form, ...patch });

  const [errors, setErrors] = useState<{ title?: string; newName?: string }>({});
  const dialog = useRef<HTMLDivElement>(null);
  useDialog(dialog, onClose);
  const id = useId();
  const titleId = `${id}-title`;
  const newNameId = `${id}-newname`;

  const creating = form.cat === NEW;
  const dupe =
    !editing && !creating && existingTitles(form.cat).some((t) => t.toLowerCase() === form.title.trim().toLowerCase()) && form.title.trim() !== "";
  const past = form.due !== "" && form.due < todayStr();
  const hasDraft = restored && JSON.stringify(form) !== JSON.stringify(initial);

  const submit = () => {
    const next: typeof errors = {};
    if (!form.title.trim()) next.title = "Give this item a name, like “Call the dentist”.";
    if (creating && !form.newName.trim()) next.newName = "Name the new list, or pick one of your lists above.";
    setErrors(next);
    if (next.title) {
      document.getElementById(titleId)?.focus();
      return;
    }
    if (next.newName) {
      document.getElementById(newNameId)?.focus();
      return;
    }
    clearDraft(draftKey);
    onAdd({ title: form.title, categoryId: creating ? null : form.cat, newCategory: creating ? form.newName : "", repeat: form.repeat, due: form.due || null });
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div ref={dialog} className="sheet" role="dialog" aria-modal="true" aria-label={editing ? "Edit item" : "Add an item"} onClick={(e) => e.stopPropagation()}>
      <form
        className="sheet-body"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {editing && <h2 className="brand">Edit item</h2>}
        {hasDraft && <DraftNote onDiscard={() => setForm(initial)} />}

        <div className="field">
          <label className="field-label" htmlFor={titleId}>
            Item
          </label>
          <input
            id={titleId}
            className="sheet-title"
            value={form.title}
            onChange={(e) => {
              set({ title: e.target.value });
              if (errors.title) setErrors({ ...errors, title: undefined });
            }}
            placeholder="What shouldn't you forget?"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? `${titleId}-error` : dupe ? `${titleId}-note` : undefined}
            autoFocus
          />
          <FieldError id={`${titleId}-error`} message={errors.title} />
          {dupe && (
            <p id={`${titleId}-note`} className="faint small">
              Already on this list. You can still add it.
            </p>
          )}
        </div>

        <div className="field">
          <span id={`${id}-list`}>List</span>
          <div className="chips" role="radiogroup" aria-labelledby={`${id}-list`}>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={form.cat === c.id}
                className={`pick${form.cat === c.id ? " on" : ""}`}
                onClick={() => {
                  set({ cat: c.id, ...(editing ? {} : { repeat: defaultRepeat(c) }) });
                }}
              >
                <span aria-hidden style={form.cat === c.id ? undefined : { color: paletteAt(c.style).color }}>
                  {paletteAt(c.style).icon}
                </span>{" "}
                {c.name}
              </button>
            ))}
            {!editing && (
              <button type="button" role="radio" aria-checked={creating} className={`pick${creating ? " on" : ""}`} onClick={() => set({ cat: NEW })}>
                + New list
              </button>
            )}
          </div>
        </div>
        {creating && (
          <div className="field">
            <label className="field-label" htmlFor={newNameId}>
              New list name
            </label>
            <input
              id={newNameId}
              value={form.newName}
              onChange={(e) => {
                set({ newName: e.target.value });
                if (errors.newName) setErrors({ ...errors, newName: undefined });
              }}
              placeholder="List name"
              aria-invalid={!!errors.newName}
              aria-describedby={errors.newName ? `${newNameId}-error` : undefined}
            />
            <FieldError id={`${newNameId}-error`} message={errors.newName} />
          </div>
        )}

        <div className="field">
          <span id={`${id}-repeat`}>Repeat</span>
          <div className="seg" role="radiogroup" aria-labelledby={`${id}-repeat`}>
            <button type="button" role="radio" aria-checked={form.repeat === "once"} className={form.repeat === "once" ? "on" : ""} onClick={() => set({ repeat: "once" })}>
              Once
            </button>
            <button type="button" role="radio" aria-checked={form.repeat === "daily"} className={form.repeat === "daily" ? "on" : ""} onClick={() => set({ repeat: "daily" })}>
              Every day
            </button>
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor={`${id}-date`}>
            Date (optional)
          </label>
          <input id={`${id}-date`} type="date" value={form.due} onChange={(e) => set({ due: e.target.value })} aria-describedby={past ? `${id}-date-note` : `${id}-date-hint`} />
          {past ? (
            <p id={`${id}-date-note`} className="faint small">
              That date has already passed, so this will show as overdue.
            </p>
          ) : (
            !editing &&
            !form.due && (
              <p id={`${id}-date-hint`} className="faint small">
                Leave it empty and we&rsquo;ll look for a date in the title, like &ldquo;due Friday&rdquo;.
              </p>
            )
          )}
        </div>

        {saveFailed && (
          <p className="field-error" role="alert">
            <span aria-hidden>! </span>
            This device can&rsquo;t save right now, so this item may be lost when you close the page. Export your data from Settings.
          </p>
        )}

        <div className="sheet-actions">
          {editing && onDelete && (
            <button type="button" className="btn danger delete-item" onClick={onDelete}>
              Delete
            </button>
          )}
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              clearDraft(draftKey);
              onClose();
            }}
          >
            Cancel
          </button>
          <button type="submit" className="btn primary">
            {editing ? "Save" : "+ Add"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}

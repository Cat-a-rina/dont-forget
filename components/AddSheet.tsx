"use client";

import { useState } from "react";
import type { Category, Item, Repeat } from "@/lib/types";
import { defaultRepeat } from "@/lib/actions";
import { todayStr } from "@/lib/dates";
import { paletteAt } from "@/lib/style";

const NEW = "__new__";

export interface AddInput {
  title: string;
  categoryId: string | null;
  newCategory: string;
  repeat: Repeat;
  due: string | null;
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
}: {
  categories: Category[];
  defaultCategoryId: string | null;
  editing?: Item;
  existingTitles: (categoryId: string) => string[];
  onAdd: (input: AddInput) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const startCat = editing?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? NEW;
  const [title, setTitle] = useState(editing?.title ?? "");
  const [cat, setCat] = useState(startCat);
  const [newName, setNewName] = useState("");
  const [repeat, setRepeat] = useState<Repeat>(editing?.repeat ?? defaultRepeat(categories.find((c) => c.id === startCat)));
  const [due, setDue] = useState(editing?.due ?? "");

  const creating = cat === NEW;
  const dupe =
    !editing && !creating && existingTitles(cat).some((t) => t.toLowerCase() === title.trim().toLowerCase()) && title.trim() !== "";
  const past = due !== "" && due < todayStr();
  const canAdd = title.trim() !== "" && (!creating || newName.trim() !== "");

  const submit = () => {
    if (!canAdd) return;
    onAdd({ title, categoryId: creating ? null : cat, newCategory: creating ? newName : "", repeat, due: due || null });
  };

  return (
    <div className="scrim" onClick={onClose} onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <form
        className="sheet"
        role="dialog"
        aria-label={editing ? "Edit item" : "Add an item"}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {editing && <h2 className="brand">Edit item</h2>}
        <input
          className="sheet-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What shouldn't you forget?"
          aria-label="Item"
          autoFocus
        />
        {dupe && <p className="faint small">Already on this list. You can still add it.</p>}

        <div className="field">
          <span>List</span>
          <div className="chips" role="radiogroup" aria-label="List">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={cat === c.id}
                className={`pick${cat === c.id ? " on" : ""}`}
                onClick={() => {
                  setCat(c.id);
                  if (!editing) setRepeat(defaultRepeat(c));
                }}
              >
                <span aria-hidden style={cat === c.id ? undefined : { color: paletteAt(c.style).color }}>
                  {paletteAt(c.style).icon}
                </span>{" "}
                {c.name}
              </button>
            ))}
            {!editing && (
              <button type="button" role="radio" aria-checked={creating} className={`pick${creating ? " on" : ""}`} onClick={() => setCat(NEW)}>
                + New list
              </button>
            )}
          </div>
        </div>
        {creating && (
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="List name" aria-label="New list name" />
        )}

        <div className="field">
          <span>Repeat</span>
          <div className="seg" role="radiogroup" aria-label="Repeat">
            <button type="button" role="radio" aria-checked={repeat === "once"} className={repeat === "once" ? "on" : ""} onClick={() => setRepeat("once")}>
              Once
            </button>
            <button type="button" role="radio" aria-checked={repeat === "daily"} className={repeat === "daily" ? "on" : ""} onClick={() => setRepeat("daily")}>
              Every day
            </button>
          </div>
        </div>

        <label className="field">
          <span>Date</span>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </label>
        {past && <p className="faint small">That date has already passed. It will show as overdue.</p>}
        {!editing && !due && <p className="faint small">Leave the date empty and we&rsquo;ll look for one in the title, like &ldquo;due Friday&rdquo;.</p>}

        <div className="sheet-actions">
          {editing && onDelete && (
            <button type="button" className="btn danger delete-item" onClick={onDelete}>
              Delete
            </button>
          )}
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={!canAdd}>
            {editing ? "Save" : "+ Add"}
          </button>
        </div>
      </form>
    </div>
  );
}

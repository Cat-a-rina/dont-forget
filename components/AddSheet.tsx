"use client";

import { useState } from "react";
import type { Category, Repeat } from "@/lib/types";
import { defaultRepeat } from "@/lib/actions";
import { todayStr } from "@/lib/dates";

const NEW = "__new__";

export interface AddInput {
  title: string;
  categoryId: string | null;
  newCategory: string;
  repeat: Repeat;
  due: string | null;
}

export default function AddSheet({
  categories,
  defaultCategoryId,
  existingTitles,
  onAdd,
  onClose,
}: {
  categories: Category[];
  defaultCategoryId: string | null;
  existingTitles: (categoryId: string) => string[];
  onAdd: (input: AddInput) => void;
  onClose: () => void;
}) {
  const startCat = defaultCategoryId ?? categories[0]?.id ?? NEW;
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState(startCat);
  const [newName, setNewName] = useState("");
  const [repeat, setRepeat] = useState<Repeat>(defaultRepeat(categories.find((c) => c.id === startCat)));
  const [due, setDue] = useState("");

  const creating = cat === NEW;
  const dupe = !creating && existingTitles(cat).some((t) => t.toLowerCase() === title.trim().toLowerCase()) && title.trim() !== "";
  const past = due !== "" && due < todayStr();
  const canAdd = title.trim() !== "" && (!creating || newName.trim() !== "");

  const submit = () => {
    if (!canAdd) return;
    onAdd({ title, categoryId: creating ? null : cat, newCategory: creating ? newName : "", repeat, due: due || null });
  };

  return (
    <div className="scrim" onClick={onClose}>
      <form
        className="sheet"
        role="dialog"
        aria-label="Add an item"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          className="sheet-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What shouldn't you forget?"
          aria-label="Item"
          autoFocus
        />
        {dupe && <p className="faint small">Already on this list. You can still add it.</p>}

        <label className="field">
          <span>List</span>
          <select
            value={cat}
            onChange={(e) => {
              setCat(e.target.value);
              setRepeat(defaultRepeat(categories.find((c) => c.id === e.target.value)));
            }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={NEW}>+ New list&hellip;</option>
          </select>
        </label>
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

        <div className="sheet-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={!canAdd}>
            + Add
          </button>
        </div>
      </form>
    </div>
  );
}

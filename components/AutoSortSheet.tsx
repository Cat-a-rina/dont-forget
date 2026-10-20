"use client";

import { useId, useRef, useState } from "react";
import type { Group } from "@/lib/types";
import { parseDump } from "@/lib/categorize";
import { clearDraft, usePersistedState } from "@/lib/useDraft";
import { useDialog } from "@/lib/useDialog";
import FieldError, { DraftNote } from "./FieldError";
import GroupEditor, { toEditGroups, toGroups, type EditGroup } from "./GroupEditor";

/** Type or paste items, preview how they will be filed, then add them. */
export default function AutoSortSheet({
  existingNames,
  onAdd,
  onClose,
}: {
  existingNames: string[];
  onAdd: (groups: Group[]) => void;
  onClose: () => void;
}) {
  const [text, setText, restored] = usePersistedState<string>("auto-sort", "");
  const [groups, setGroups] = useState<EditGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  useDialog(dialog, onClose);
  const id = useId();
  const textId = `${id}-text`;
  const count = groups?.reduce((n, g) => n + g.items.length, 0) ?? 0;

  const sort = () => {
    if (!text.trim()) {
      setError("Type or paste at least one item first, one per line. Then press Sort it!");
      document.getElementById(textId)?.focus();
      return;
    }
    setGroups(toEditGroups(parseDump(text, existingNames)));
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div ref={dialog} className="sheet" role="dialog" aria-modal="true" aria-label={groups ? "Preview" : "Add new items"} onClick={(e) => e.stopPropagation()}>
        {groups ? (
          <form
            noValidate
            className="sheet-body"
            onSubmit={(e) => {
              e.preventDefault();
              if (count === 0) {
                setError("There is nothing left to add. Press Back to type more items.");
                return;
              }
              clearDraft("auto-sort");
              onAdd(toGroups(groups.filter((g) => g.items.length > 0)));
            }}
          >
            <h2 className="brand">Preview</h2>
            <p className="faint small">
              This is how your items will be filed. Rename a group, or drag items between groups and within them. Groups named like an existing
              list are added to it.
            </p>
            <GroupEditor groups={groups} setGroups={setGroups} existingLists={existingNames} />
            <FieldError id={`${id}-count-error`} message={error} />
            <div className="sheet-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setGroups(null);
                  setError(null);
                }}
              >
                Back
              </button>
              <button type="submit" className="btn primary" autoFocus aria-describedby={error ? `${id}-count-error` : undefined}>
                Add {count} items
              </button>
            </div>
          </form>
        ) : (
          <form
            noValidate
            className="sheet-body"
            onSubmit={(e) => {
              e.preventDefault();
              sort();
            }}
          >
            {restored && text.trim() !== "" && <DraftNote onDiscard={() => setText("")} />}
            <div className="field">
              <label className="field-label" htmlFor={textId}>
                Items to add (one per line)
              </label>
              <textarea
                id={textId}
                className="sheet-dump"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    sort();
                  }
                }}
                placeholder={"We'll sort them into your lists.\ne.g. Buy milk\nPick up the kids at 3"}
                aria-invalid={!!error}
                aria-describedby={error ? `${textId}-error` : `${textId}-hint`}
                autoFocus
              />
              <FieldError id={`${textId}-error`} message={error} />
              <p id={`${textId}-hint`} className="faint small">
                Press Ctrl+Enter to sort without leaving the keyboard.
              </p>
            </div>
            <div className="sheet-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  clearDraft("auto-sort");
                  onClose();
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn primary">
                Sort it!
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

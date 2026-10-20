"use client";

import { useState } from "react";
import type { Group } from "@/lib/types";
import { parseDump } from "@/lib/categorize";
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
  const [text, setText] = useState("");
  const [groups, setGroups] = useState<EditGroup[] | null>(null);
  const count = groups?.reduce((n, g) => n + g.items.length, 0) ?? 0;

  const sort = () => setGroups(toEditGroups(parseDump(text, existingNames)));

  return (
    <div className="scrim" onClick={onClose} onKeyDown={(e) => e.key === "Escape" && onClose()}>
      {groups ? (
        <form
          className="sheet"
          role="dialog"
          aria-label="Preview"
          onClick={(e) => e.stopPropagation()}
          onSubmit={(e) => {
            e.preventDefault();
            onAdd(toGroups(groups.filter((g) => g.items.length > 0)));
          }}
        >
          <h2 className="brand">Preview</h2>
          <p className="faint small">
            This is how your items will be filed. Rename a group, or drag items between groups and within them. Groups named like an existing
            list are added to it.
          </p>
          <GroupEditor groups={groups} setGroups={setGroups} existingLists={existingNames} />
          <div className="sheet-actions">
            <button type="button" className="btn ghost" onClick={() => setGroups(null)}>
              Back
            </button>
            <button type="submit" className="btn primary" autoFocus disabled={count === 0}>
              Add {count} items
            </button>
          </div>
        </form>
      ) : (
        <form
          className="sheet"
          role="dialog"
          aria-label="Add new items"
          onClick={(e) => e.stopPropagation()}
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) sort();
          }}
        >
          <textarea
            className="sheet-dump"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && text.trim()) {
                e.preventDefault();
                sort();
              }
            }}
            placeholder={"One item per line. We'll sort them into your lists.\ne.g. Buy milk\nPick up the kids at 3"}
            aria-label="New items"
            autoFocus
          />
          <div className="sheet-actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={!text.trim()}>
              Sort it!
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

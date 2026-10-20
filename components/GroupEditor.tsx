"use client";

import { useRef, useState } from "react";
import type { Group } from "@/lib/types";
import { UNSORTED } from "@/lib/categorize";
import { uid } from "@/lib/actions";

export interface EditItem {
  id: string;
  title: string;
}
export interface EditGroup {
  key: string;
  name: string;
  items: EditItem[];
}

export function toEditGroups(groups: Group[]): EditGroup[] {
  return groups.map((g) => ({ key: uid(), name: g.name, items: g.items.map((title) => ({ id: uid(), title })) }));
}

/** Blank names fall back to "Unsorted" so nothing is silently dropped. */
export function toGroups(groups: EditGroup[]): Group[] {
  return groups.map((g) => ({ name: g.name.trim() || UNSORTED, context: null, items: g.items.map((i) => i.title) }));
}

function insertBefore(items: EditItem[], item: EditItem, beforeId?: string): EditItem[] {
  const idx = beforeId ? items.findIndex((i) => i.id === beforeId) : -1;
  return idx < 0 ? [...items, item] : [...items.slice(0, idx), item, ...items.slice(idx)];
}

const refocus = (id: string) =>
  setTimeout(() => document.querySelector<HTMLElement>(`[data-grip-id="${id}"]`)?.focus(), 0);

/**
 * Editable preview of groups. Rename a group, remove an item, or move items by dragging them
 * (between groups or within one). Dropping on the dashed area at the bottom starts a new group.
 *
 * Keyboard: Tab to an item's handle. Up/Down moves between items. Enter picks the item up; then
 * Up/Down reorders it, Left/Right moves it to the previous/next group, and Enter drops it. While
 * an item is picked up you can also Tab to "new group" or one of your lists and press Enter there.
 */
export default function GroupEditor({
  groups,
  setGroups,
  existingLists,
}: {
  groups: EditGroup[];
  setGroups: (g: EditGroup[]) => void;
  /** Names of lists already in the app; shown at the bottom as places to drop items. */
  existingLists?: string[];
}) {
  const drag = useRef<{ from: string; id: string } | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [grabbedId, setGrabbedId] = useState<string | null>(null);

  const visible = groups.filter((g) => g.items.length > 0);
  const grabbedTitle = grabbedId ? groups.flatMap((g) => g.items).find((i) => i.id === grabbedId)?.title : undefined;

  const rename = (key: string, name: string) => setGroups(groups.map((g) => (g.key === key ? { ...g, name } : g)));
  const remove = (key: string, id: string) =>
    setGroups(groups.map((g) => (g.key === key ? { ...g, items: g.items.filter((i) => i.id !== id) } : g)));

  /** Moves an item to group `to`, "new", or "list:<name>", placed before `beforeId` or at the end. */
  const move = (from: string, id: string, to: string, beforeId?: string) => {
    const item = groups.find((g) => g.key === from)?.items.find((i) => i.id === id);
    if (!item || id === beforeId) return;
    const without = groups.map((g) => (g.key === from ? { ...g, items: g.items.filter((i) => i.id !== id) } : g));
    if (to === "new") setGroups([...without, { key: uid(), name: "", items: [item] }]);
    else if (to.startsWith("list:")) {
      const name = to.slice(5);
      const hit = without.find((g) => g.name.trim().toLowerCase() === name.toLowerCase());
      if (hit) setGroups(without.map((g) => (g === hit ? { ...g, items: [...g.items, item] } : g)));
      else setGroups([...without, { key: uid(), name, items: [item] }]);
    } else setGroups(without.map((g) => (g.key === to ? { ...g, items: insertBefore(g.items, item, beforeId) } : g)));
  };

  const drop = (to: string, beforeId?: string) => {
    const d = drag.current;
    drag.current = null;
    setOver(null);
    if (d) move(d.from, d.id, to, beforeId);
  };

  // Keyboard drop onto "new group" or one of the existing lists.
  const dropGrabbed = (to: string) => {
    if (!grabbedId) return;
    const from = groups.find((g) => g.items.some((i) => i.id === grabbedId));
    if (!from) return;
    move(from.key, grabbedId, to);
    const id = grabbedId;
    setGrabbedId(null);
    refocus(id);
  };
  const zoneKey = (e: React.KeyboardEvent, to: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      dropGrabbed(to);
    } else if (e.key === "Escape") setGrabbedId(null);
  };

  const gripKey = (e: React.KeyboardEvent, g: EditGroup, index: number) => {
    const id = g.items[index].id;
    const held = grabbedId === id;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setGrabbedId(held ? null : id);
      return;
    }
    if (e.key === "Escape") {
      if (grabbedId) setGrabbedId(null);
      return;
    }
    const up = e.key === "ArrowUp";
    const down = e.key === "ArrowDown";
    const left = e.key === "ArrowLeft";
    const right = e.key === "ArrowRight";
    if (!(up || down || left || right)) return;
    e.preventDefault();
    if (!held) {
      if (up || down) {
        const grips = [...document.querySelectorAll<HTMLElement>("[data-grip-id]")];
        grips[grips.indexOf(e.currentTarget as HTMLElement) + (up ? -1 : 1)]?.focus();
      }
      return;
    }
    if (up && index > 0) move(g.key, id, g.key, g.items[index - 1].id);
    else if (down && index < g.items.length - 1) move(g.key, id, g.key, g.items[index + 2]?.id);
    else if (left || right) {
      const target = visible[visible.findIndex((x) => x.key === g.key) + (left ? -1 : 1)];
      if (target) move(g.key, id, target.key);
    }
    refocus(id);
  };

  return (
    <>
      <p className="faint small grab-hint" aria-live="polite">
        {grabbedTitle
          ? `Moving "${grabbedTitle}". Up and Down reorder, Left and Right change group, Enter drops it, Escape cancels. You can also Tab to a box below and press Enter.`
          : "Keyboard: Tab to a ⋮⋮ handle and press Enter to pick an item up."}
      </p>
      {visible.map((g) => (
        <section
          key={g.key}
          className={`review-group${over === g.key ? " drop" : ""}`}
          onDragOver={(e) => {
            if (!drag.current) return;
            e.preventDefault();
            setOver(g.key);
          }}
          onDragLeave={() => setOver((o) => (o === g.key ? null : o))}
          onDrop={(e) => {
            e.preventDefault();
            drop(g.key);
          }}
        >
          <input
            className="group-name"
            value={g.name}
            onChange={(e) => rename(g.key, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            aria-label="Group name"
            placeholder={UNSORTED}
          />
          <ul className="plain-list">
            {g.items.map((i, index) => (
              <li
                key={i.id}
                className={`plain-row draggable${over === `item:${i.id}` ? " insert" : ""}${grabbedId === i.id ? " grabbed" : ""}`}
                draggable
                onDragStart={(e) => {
                  drag.current = { from: g.key, id: i.id };
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", i.title);
                }}
                onDragEnd={() => {
                  drag.current = null;
                  setOver(null);
                }}
                onDragOver={(e) => {
                  if (!drag.current) return;
                  e.preventDefault();
                  e.stopPropagation();
                  setOver(`item:${i.id}`);
                }}
                onDragLeave={() => setOver((o) => (o === `item:${i.id}` ? null : o))}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  drop(g.key, i.id);
                }}
              >
                <span
                  className="grip"
                  role="button"
                  tabIndex={0}
                  data-grip-id={i.id}
                  aria-pressed={grabbedId === i.id}
                  aria-label={`Move ${i.title}. Press Enter to pick it up.`}
                  onKeyDown={(e) => gripKey(e, g, index)}
                >
                  &#8942;&#8942;
                </span>
                <span>{i.title}</span>
                <button className="icon-btn" aria-label={`Remove ${i.title}`} onClick={() => remove(g.key, i.id)}>
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <div
        className={`new-group${over === "new" ? " drop" : ""}`}
        role="button"
        tabIndex={0}
        aria-label="New group. With an item picked up, press Enter to move it here."
        onKeyDown={(e) => zoneKey(e, "new")}
        onDragOver={(e) => {
          if (!drag.current) return;
          e.preventDefault();
          setOver("new");
        }}
        onDragLeave={() => setOver((o) => (o === "new" ? null : o))}
        onDrop={(e) => {
          e.preventDefault();
          drop("new");
        }}
      >
        Drag an item here to start a new group
      </div>
      {existingLists && existingLists.length > 0 && (
        <div className="existing-lists">
          <p className="faint small">Your lists. Drag an item onto one to add it there.</p>
          <div className="chips">
            {existingLists.map((name) => (
              <div
                key={name}
                className={`list-drop${over === `list:${name}` ? " drop" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={`Add to ${name}. With an item picked up, press Enter to move it here.`}
                onKeyDown={(e) => zoneKey(e, `list:${name}`)}
                onDragOver={(e) => {
                  if (!drag.current) return;
                  e.preventDefault();
                  setOver(`list:${name}`);
                }}
                onDragLeave={() => setOver((o) => (o === `list:${name}` ? null : o))}
                onDrop={(e) => {
                  e.preventDefault();
                  drop(`list:${name}`);
                }}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

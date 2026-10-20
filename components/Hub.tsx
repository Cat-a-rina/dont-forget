"use client";

import { useEffect, useRef, useState } from "react";
import type { AppState, Category, Item } from "@/lib/types";
import { paletteAt } from "@/lib/style";
import Confetti, { makePieces, type Piece } from "./Confetti";
import { dueInfo, todayStr } from "@/lib/dates";
import { greeting, orderCategories, orderItems, orderLabel } from "@/lib/order";
import {
  addItem, addList, addNextStep, defaultRepeat, importGroups, renameCategory, renameItem, restoreFromHistory, completeItem, moveCategory, moveItem, toggleCollapsed, uncheckDaily, undoComplete,
} from "@/lib/actions";
import AddSheet, { type AddInput } from "./AddSheet";
import Menu from "./Menu";
import AutoSortSheet from "./AutoSortSheet";
import NewListSheet from "./NewListSheet";
import Progress from "./Progress";
import Doodle, { DoodleRow, type DoodleName } from "./Doodles";
import CompletedList from "./CompletedList";
import { rangeStart, summarize } from "@/lib/stats";

type Update = (fn: (s: AppState) => AppState) => void;

// Icons that sit on the corners of each list sheet (paper themes with the Sheet layout).
const CORNER_TL: DoodleName[] = ["flower", "sparkle", "leaf", "heart"];
const CORNER_BR: DoodleName[] = ["bean", "pumpkin", "mushroom", "smiley"];

interface Toast {
  id: number;
  snapshot: Item;
  completionId: string;
  index: number;
  message?: string;
  prompt: boolean;
}

export default function Hub({ state, update }: { state: AppState; update: Update }) {
  const [tab, setTab] = useState<string>("hub");
  const [adding, setAdding] = useState<{ categoryId: string | null } | null>(null);
  const [menu, setMenu] = useState(false);
  const [addMenu, setAddMenu] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const toggleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [party, setParty] = useState<{ id: number; pieces: Piece[] } | null>(null);
  const [welcomePieces] = useState(() => makePieces(44));
  const [sorting, setSorting] = useState(false);
  const [newList, setNewList] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [now, setNow] = useState(() => new Date());
  // What is being dragged: a whole list (manual mode) or a single item between lists.
  const drag = useRef<{ kind: "cat" | "item"; id: string } | null>(null);
  const [over, setOver] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!party) return;
    const t = setTimeout(() => setParty(null), 3400);
    return () => clearTimeout(t);
  }, [party]);

  useEffect(() => {
    if (!toast || toast.prompt) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const today = todayStr();
  const tz = state.profile.timeZone || undefined;
  const dayStart = rangeStart("today", now.getTime());
  const ordered = orderCategories(state.categories, state.items, state.mode, now, tz);
  const hello = greeting(state.profile.name, now, tz);
  const visible = tab === "hub" ? ordered : ordered.filter((c) => c.id === tab);
  const openCount = (c: Category) => state.items.filter((i) => i.categoryId === c.id && !(i.repeat === "daily" && i.doneOn)).length;

  const allDone =
    state.categories.length > 0 && state.categories.every((c) => openCount(c) === 0) && state.log.some((l) => l.at >= dayStart);

  const complete = (item: Item) => {
    const result = completeItem(state, item.id, today);
    if (!result) return;
    // Celebrate when this check-off empties a list (and louder when every list is empty).
    const openIn = (s: AppState, id: string) => s.items.filter((i) => i.categoryId === id && !(i.repeat === "daily" && i.doneOn)).length;
    const cat = state.categories.find((c) => c.id === item.categoryId);
    const cleared = !!cat && openIn(state, cat.id) > 0 && openIn(result.state, cat.id) === 0;
    const everything = cleared && state.categories.every((c) => openIn(result.state, c.id) === 0);
    if (cleared) setParty({ id: result.completion.at, pieces: makePieces(everything ? 80 : 40) });
    update(() => result.state);
    setToast({ message: cleared ? (everything ? "Everything is done!" : `${cat.name} is all done!`) : undefined, id: result.completion.at, snapshot: result.snapshot, completionId: result.completion.id, index: result.index, prompt: false });
  };

  const nudge = (e: React.KeyboardEvent, item: Item) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const up = e.key === "ArrowUp";
    if (e.shiftKey) {
      const target = ordered[ordered.findIndex((c) => c.id === item.categoryId) + (up ? -1 : 1)];
      if (target) update((s) => moveItem(s, item.id, target.id));
    } else if (state.mode !== "date") {
      const list = orderItems(state.items.filter((x) => x.categoryId === item.categoryId), state.mode);
      const idx = list.findIndex((x) => x.id === item.id);
      if (up && idx > 0) update((s) => moveItem(s, item.id, item.categoryId, list[idx - 1].id));
      if (!up && idx < list.length - 1) update((s) => moveItem(s, item.id, item.categoryId, list[idx + 2]?.id ?? null));
    }
    setTimeout(() => document.querySelector<HTMLElement>(`[data-grip-id="${item.id}"]`)?.focus(), 0);
  };

  const drop = (targetId: string, beforeId?: string) => {
    const d = drag.current;
    drag.current = null;
    setOver(null);
    if (!d) return;
    update((s) => (d.kind === "item" ? moveItem(s, d.id, targetId, beforeId) : moveCategory(s, d.id, targetId)));
  };
  const canDrop = (kind: "cat" | "item") => (kind === "item" ? true : state.mode === "manual");

  const onAdd = (input: AddInput) => {
    update((s) => addItem(s, input));
    setAdding(null);
  };

  return (
    <main className="screen hub">
      <header className="topbar">
        <button className="icon-btn" aria-label="Menu" onClick={() => setMenu(true)}>
          &#9776;
        </button>
        <h1>Don&rsquo;t Forget&hellip;!</h1>
        <div className="add-wrap">
          <button className="btn primary add-btn" aria-haspopup="menu" aria-expanded={addMenu} onClick={() => setAddMenu((v) => !v)}>
            + Add
          </button>
          {addMenu && (
            <>
              <div className="menu-scrim" onClick={() => setAddMenu(false)} />
              <div
                className="add-menu"
                role="menu"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setAddMenu(false);
                  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    e.preventDefault();
                    const btns = [...e.currentTarget.querySelectorAll<HTMLElement>("button")];
                    const i = btns.indexOf(document.activeElement as HTMLElement);
                    btns[(i + (e.key === "ArrowDown" ? 1 : btns.length - 1)) % btns.length]?.focus();
                  }
                }}
              >
                <button
                  role="menuitem"
                  autoFocus
                  onClick={() => {
                    setAddMenu(false);
                    setSorting(true);
                  }}
                >
                  Add new items and auto-categorize
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setAddMenu(false);
                    setNewList(true);
                  }}
                >
                  Add new list
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setAddMenu(false);
                    setAdding({ categoryId: tab === "hub" ? null : tab });
                  }}
                >
                  Add items to list
                </button>
              </div>
            </>
          )}
        </div>
      </header>
      <div className="meta">
        <span className="hello">{hello}</span>
        <span className="pill">{orderLabel(state.mode, now, tz)}</span>
      </div>
      <DoodleRow className="in-sheet" names={["pumpkin", "flower", "smiley", "mushroom", "sparkle", "leaf"]} />

      {!state.profile.welcomed && (
        <div className="banner welcome" role="status">
          <Confetti pieces={welcomePieces} />
          <div>
            <strong>You&rsquo;re all set{state.profile.name ? `, ${state.profile.name}` : ""}!</strong>
            <span className="faint small">Check items off, and finish a whole list to see what happens.</span>
          </div>
          <button className="btn primary" onClick={() => update((s) => ({ ...s, profile: { ...s.profile, welcomed: true } }))}>
            Got it
          </button>
        </div>
      )}

      <nav className="tabs" aria-label="Lists">
        <button className={tab === "hub" ? "tab on" : "tab"} onClick={() => setTab("hub")}>
          Hub
        </button>
        {ordered.map((c) => (
          <button
            key={c.id}
            className={`${tab === c.id ? "tab on" : "tab"}${over === `tab:${c.id}` ? " drop" : ""}`}
            onClick={() => setTab(c.id)}
            onDragOver={(e) => {
              if (drag.current?.kind !== "item") return;
              e.preventDefault();
              setOver(`tab:${c.id}`);
            }}
            onDragLeave={() => setOver((o) => (o === `tab:${c.id}` ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              drop(c.id);
            }}
          >
            <span aria-hidden style={{ color: paletteAt(c.style).color }}>
              {paletteAt(c.style).icon}
            </span>{" "}
            {c.name}
            <span className="count">{openCount(c)}</span>
          </button>
        ))}
        <button className={tab === "completed" ? "tab on" : "tab"} onClick={() => setTab("completed")}>
          Completed<span className="count">{state.log.length}</span>
        </button>
      </nav>

      <div className="hub-layout">
        <aside className="hub-side">
          <Progress state={state} nowMs={now.getTime()} onViewCompleted={() => setTab("completed")} />
        </aside>
        <div className="hub-main">
          {allDone && tab !== "completed" && (
            <div className="banner all-done" role="status">
              <strong>Everything is done for now.</strong>
              <span className="faint small">Enjoy the quiet.</span>
            </div>
          )}

      {tab === "completed" ? (
        <CompletedList
          entries={summarize(state, rangeStart("all", 0)).entries}
          categories={state.categories}
          nowMs={now.getTime()}
          onRestore={(id) => update((s) => restoreFromHistory(s, id))}
        />
      ) : (
      <div className="sections">
        {visible.map((c) => {
          const items = orderItems(state.items.filter((i) => i.categoryId === c.id), state.mode);
          const open = tab !== "hub" || !c.collapsed;
          const p = paletteAt(c.style);
          const left = openCount(c);
          const doneToday = state.log.filter((l) => l.categoryId === c.id && l.at >= dayStart).length;
          const pct = left + doneToday > 0 ? Math.round((doneToday / (left + doneToday)) * 100) : 0;
          const cleared = left === 0 && doneToday > 0;
          return (
            <section
              key={c.id}
              className={`section${over === c.id ? " drop" : ""}${cleared ? " cleared" : ""}`}
              style={{ ["--cat" as string]: p.color }}
              draggable={state.mode === "manual" && tab === "hub"}
              onDragStart={(e) => {
                if (e.target === e.currentTarget) drag.current = { kind: "cat", id: c.id };
              }}
              onDragOver={(e) => {
                if (drag.current && canDrop(drag.current.kind)) {
                  e.preventDefault();
                  setOver(c.id);
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver((o) => (o === c.id ? null : o));
              }}
              onDrop={(e) => {
                e.preventDefault();
                drop(c.id);
              }}
              onDragEnd={() => {
                drag.current = null;
                setOver(null);
              }}
            >
              <Doodle name={CORNER_TL[c.style % CORNER_TL.length]} size={40} className="doodle in-sheet corner-tl" />
              <Doodle name={CORNER_BR[c.style % CORNER_BR.length]} size={54} className="doodle in-sheet corner-br" />
              {editingCat === c.id ? (
                <div className="section-head editing">
                  <span className="badge" aria-hidden>
                    {p.icon}
                  </span>
                  <input
                    className="inline-edit"
                    defaultValue={c.name}
                    autoFocus
                    aria-label="List name"
                    onFocus={(e) => e.currentTarget.select()}
                    onBlur={(e) => {
                      update((s) => renameCategory(s, c.id, e.currentTarget.value));
                      setEditingCat(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") {
                        e.currentTarget.value = c.name;
                        e.currentTarget.blur();
                      }
                    }}
                  />
                </div>
              ) : (
                <button
                  className="section-head"
                  aria-expanded={open}
                  title="Double-click to rename"
                  onClick={() => {
                    if (tab !== "hub") return;
                    // Wait a moment so a double-click can rename instead of collapsing.
                    if (toggleTimer.current) clearTimeout(toggleTimer.current);
                    toggleTimer.current = setTimeout(() => update((s) => toggleCollapsed(s, c.id)), 220);
                  }}
                  onDoubleClick={() => {
                    if (toggleTimer.current) clearTimeout(toggleTimer.current);
                    setEditingCat(c.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "F2") {
                      e.preventDefault();
                      setEditingCat(c.id);
                      return;
                    }
                    if (!e.altKey || state.mode !== "manual" || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
                    e.preventDefault();
                    const other = state.categories[state.categories.findIndex((x) => x.id === c.id) + (e.key === "ArrowUp" ? -1 : 1)];
                    if (other) update((s) => moveCategory(s, c.id, other.id));
                  }}
                >
                  {state.mode === "manual" && tab === "hub" && <span className="grip" aria-hidden>&#8942;&#8942;</span>}
                  <span className="badge" aria-hidden>
                    {p.icon}
                  </span>
                  <span className="section-name">{c.name}</span>
                  <span className="pill">{cleared ? "All done ✓" : left}</span>
                  {tab === "hub" && (
                    <span className="chev" aria-hidden>
                      {open ? "▾" : "▸"}
                    </span>
                  )}
                </button>
              )}
              {doneToday > 0 && (
                <div className="bar" role="progressbar" aria-label={`${c.name} progress today`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
                  <span style={{ width: `${pct}%` }} />
                </div>
              )}
              {open && (
                <ul className="items">
                  {cleared && (
                    <li className="cleared-banner">
                      <span aria-hidden>✓</span> All done. Nice work!
                    </li>
                  )}
                  {items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      today={today}
                      onComplete={() => complete(item)}
                      onUncheck={() => update((s) => uncheckDaily(s, item.id))}
                      onDragStart={() => (drag.current = { kind: "item", id: item.id })}
                      onNudge={(e) => nudge(e, item)}
                      onRename={(title) => update((s) => renameItem(s, item.id, title))}
                      isOver={over === `item:${item.id}`}
                      onDragOverItem={(e) => {
                        if (drag.current?.kind !== "item") return;
                        e.preventDefault();
                        e.stopPropagation();
                        setOver(`item:${item.id}`);
                      }}
                      onDragLeaveItem={() => setOver((o) => (o === `item:${item.id}` ? null : o))}
                      onDropItem={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        drop(c.id, item.id);
                      }}
                    />
                  ))}
                  <li className="inline-add">
                    <InlineAdd
                      onAdd={(title) =>
                        update((s) => addItem(s, { title, categoryId: c.id, newCategory: "", repeat: defaultRepeat(c), due: null }))
                      }
                    />
                  </li>
                </ul>
              )}
            </section>
          );
        })}
      </div>
      )}
        </div>
      </div>


      {adding && (
        <AddSheet
          categories={ordered}
          defaultCategoryId={adding.categoryId}
          existingTitles={(id) => state.items.filter((i) => i.categoryId === id).map((i) => i.title)}
          onAdd={onAdd}
          onClose={() => setAdding(null)}
        />
      )}

      {party && <Confetti key={party.id} pieces={party.pieces} />}

      {sorting && (
        <AutoSortSheet
          existingNames={state.categories.map((c) => c.name)}
          onAdd={(groups) => {
            update((s) => importGroups(s, groups));
            setSorting(false);
          }}
          onClose={() => setSorting(false)}
        />
      )}

      {newList && (
        <NewListSheet
          existingNames={state.categories.map((c) => c.name)}
          onCreate={(name, items) => {
            update((s) => importGroups(addList(s, name), [{ name: name.trim(), context: null, items }]));
            setNewList(false);
          }}
          onClose={() => setNewList(false)}
        />
      )}

      {menu && <Menu state={state} update={update} onClose={() => setMenu(false)} />}

      {toast && (
        <ToastBar
          toast={toast}
          onUndo={() => {
            update((s) => undoComplete(s, toast.snapshot, toast.completionId, toast.index));
            setToast(null);
          }}
          onNext={() => setToast({ ...toast, prompt: true })}
          onSubmitNext={(title) => {
            update((s) => addNextStep(s, toast.snapshot, title));
            setToast(null);
          }}
          onClose={() => setToast(null)}
        />
      )}
      <DoodleRow className="in-sheet bottom" names={["leaf", "sparkle", "mushroom", "smiley", "flower", "pumpkin"]} />
    </main>
  );
}

function ItemRow({
  item, today, onComplete, onUncheck, onDragStart, onNudge, onRename, isOver, onDragOverItem, onDragLeaveItem, onDropItem,
}: {
  item: Item;
  today: string;
  onComplete: () => void;
  onUncheck: () => void;
  onDragStart: () => void;
  onNudge: (e: React.KeyboardEvent) => void;
  onRename: (title: string) => void;
  isOver: boolean;
  onDragOverItem: (e: React.DragEvent) => void;
  onDragLeaveItem: () => void;
  onDropItem: (e: React.DragEvent) => void;
}) {
  const [dx, setDx] = useState(0);
  const [gone, setGone] = useState(false);
  const start = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState(false);
  const doneToday = item.repeat === "daily" && item.doneOn === today;
  const info = item.due ? dueInfo(item.due, today) : null;

  const finish = () => {
    // A repeating item (like "Leaving the house") stays put and just gets checked off for today.
    // Only one-time items slide away.
    if (item.repeat === "daily") {
      setDx(0);
      onComplete();
      return;
    }
    setGone(true);
    setDx(-500);
    setTimeout(onComplete, 180);
  };

  return (
    <li className={`item-wrap${gone ? " gone" : ""}${isOver ? " insert" : ""}`} onDragOver={onDragOverItem} onDragLeave={onDragLeaveItem} onDrop={onDropItem}>
      <div className="swipe-hint" aria-hidden>
        Done
      </div>
      <div
        className={`item${doneToday ? " done" : ""}`}
        style={{ transform: `translateX(${dx}px)`, transition: dragging ? "none" : "transform .18s" }}
        onPointerDown={(e) => {
          if (doneToday || (e.target as HTMLElement).closest("button, input, [data-grip]")) return;
          start.current = e.clientX;
          setDragging(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (start.current !== null) setDx(Math.min(0, e.clientX - start.current));
        }}
        onPointerUp={() => {
          if (start.current === null) return;
          start.current = null;
          setDragging(false);
          if (dx < -90) finish();
          else setDx(0);
        }}
        onPointerCancel={() => {
          start.current = null;
          setDragging(false);
          setDx(0);
        }}
      >
        <span
          className="grip"
          data-grip
          draggable
          role="button"
          tabIndex={0}
          data-grip-id={item.id}
          title="Drag to move or reorder"
          aria-label={`Move ${item.title}. Up and Down arrows reorder, Shift plus arrow changes list.`}
          onKeyDown={(e) => {
            if (e.key === "F2") {
              e.preventDefault();
              setEditing(true);
            } else onNudge(e);
          }}
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", item.title);
            const row = e.currentTarget.closest(".item");
            if (row) e.dataTransfer.setDragImage(row, 20, 20);
            onDragStart();
          }}
        >
          &#8942;&#8942;
        </span>
        <button
          className={`check${doneToday ? " on" : ""}`}
          aria-label={doneToday ? `Mark ${item.title} as not done` : `Complete ${item.title}`}
          aria-pressed={doneToday}
          onClick={() => (doneToday ? onUncheck() : finish())}
        >
          {doneToday ? "✓" : ""}
        </button>
        {editing ? (
          <input
            className="inline-edit item-edit"
            defaultValue={item.title}
            autoFocus
            aria-label="Item"
            onFocus={(e) => e.currentTarget.select()}
            onBlur={(e) => {
              onRename(e.currentTarget.value);
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                e.currentTarget.value = item.title;
                e.currentTarget.blur();
              }
            }}
          />
        ) : (
          <span className="item-title" title="Double-click to edit" onDoubleClick={() => setEditing(true)}>
            {item.title}
          </span>
        )}
        {item.repeat === "daily" && !doneToday && <span className="faint small" title="Repeats every day" aria-label="Repeats every day">&#8635;</span>}
        {item.steps.length > 0 && <span className="chip faint">Step {item.steps.length + 1}</span>}
        {info && (
          <span className={`chip ring ${info.state}`}>
            {info.state === "overdue" && <span aria-hidden>! </span>}
            {info.label}
          </span>
        )}
      </div>
    </li>
  );
}

function ToastBar({
  toast, onUndo, onNext, onSubmitNext, onClose,
}: {
  toast: Toast;
  onUndo: () => void;
  onNext: () => void;
  onSubmitNext: (title: string) => void;
  onClose: () => void;
}) {
  const [next, setNext] = useState("");
  const chainable = toast.snapshot.repeat === "once";

  if (toast.prompt) {
    return (
      <form
        className="toast"
        onSubmit={(e) => {
          e.preventDefault();
          if (next.trim()) onSubmitNext(next);
        }}
      >
        <input value={next} onChange={(e) => setNext(e.target.value)} placeholder="Next step" aria-label="Next step" autoFocus />
        <button type="submit" className="link" disabled={!next.trim()}>
          Add
        </button>
        <button type="button" className="link" onClick={onClose}>
          Skip
        </button>
      </form>
    );
  }

  return (
    <div className="toast" role="status">
      <span>{toast.message ?? "Done"}</span>
      <button className="link" onClick={onUndo}>
        Undo
      </button>
      {chainable && (
        <button className="link" onClick={onNext}>
          Next step
        </button>
      )}
    </div>
  );
}

/** Type straight into a list from the hub: Enter adds the item and keeps the box ready for the next one. */
function InlineAdd({ onAdd }: { onAdd: (title: string) => void }) {
  const [draft, setDraft] = useState("");
  return (
    <form
      className="inline-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (draft.trim()) {
          onAdd(draft.trim());
          setDraft("");
        }
      }}
    >
      <span className="plus" aria-hidden>
        +
      </span>
      <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add an item" aria-label="Add an item to this list" />
    </form>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { AppState, Category, Item } from "@/lib/types";
import { paletteAt } from "@/lib/style";
import { dueInfo, todayStr } from "@/lib/dates";
import { orderCategories, orderItems, orderLabel } from "@/lib/order";
import {
  addItem, addNextStep, completeItem, moveCategory, toggleCollapsed, uncheckDaily, undoComplete,
} from "@/lib/actions";
import AddSheet, { type AddInput } from "./AddSheet";
import Menu from "./Menu";

type Update = (fn: (s: AppState) => AppState) => void;

interface Toast {
  id: number;
  snapshot: Item;
  completionId: string;
  prompt: boolean;
}

export default function Hub({ state, update }: { state: AppState; update: Update }) {
  const [tab, setTab] = useState<string>("hub");
  const [adding, setAdding] = useState<{ categoryId: string | null } | null>(null);
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [now, setNow] = useState(() => new Date());
  const dragId = useRef<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!toast || toast.prompt) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const today = todayStr();
  const ordered = orderCategories(state.categories, state.items, state.mode, now);
  const visible = tab === "hub" ? ordered : ordered.filter((c) => c.id === tab);
  const openCount = (c: Category) => state.items.filter((i) => i.categoryId === c.id && !(i.repeat === "daily" && i.doneOn)).length;

  const complete = (item: Item) => {
    const result = completeItem(state, item.id, today);
    if (!result) return;
    update(() => result.state);
    setToast({ id: result.completion.at, snapshot: result.snapshot, completionId: result.completion.id, prompt: false });
  };

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
        <span className="mode faint small">{orderLabel(state.mode, now)}</span>
      </header>

      <nav className="tabs" aria-label="Lists">
        <button className={tab === "hub" ? "tab on" : "tab"} onClick={() => setTab("hub")}>
          Hub
        </button>
        {ordered.map((c) => (
          <button key={c.id} className={tab === c.id ? "tab on" : "tab"} onClick={() => setTab(c.id)}>
            <span aria-hidden style={{ color: paletteAt(c.style).color }}>
              {paletteAt(c.style).icon}
            </span>{" "}
            {c.name}
            <span className="count">{openCount(c)}</span>
          </button>
        ))}
      </nav>

      <div className="sections">
        {visible.map((c) => {
          const items = orderItems(state.items.filter((i) => i.categoryId === c.id), state.mode);
          const open = tab !== "hub" || !c.collapsed;
          const p = paletteAt(c.style);
          return (
            <section
              key={c.id}
              className="section"
              style={{ ["--cat" as string]: p.color }}
              draggable={state.mode === "manual" && tab === "hub"}
              onDragStart={() => (dragId.current = c.id)}
              onDragOver={(e) => state.mode === "manual" && e.preventDefault()}
              onDrop={() => {
                if (dragId.current) {
                  const from = dragId.current;
                  update((s) => moveCategory(s, from, c.id));
                }
                dragId.current = null;
              }}
            >
              <button className="section-head" aria-expanded={open} onClick={() => tab === "hub" && update((s) => toggleCollapsed(s, c.id))}>
                {state.mode === "manual" && tab === "hub" && <span className="grip" aria-hidden>&#8942;&#8942;</span>}
                <span className="badge" aria-hidden>
                  {p.icon}
                </span>
                <span className="section-name">{c.name}</span>
                <span className="count">{openCount(c)}</span>
                {tab === "hub" && <span aria-hidden>{open ? "▾" : "▸"}</span>}
              </button>
              {open && (
                <ul className="items">
                  {items.map((item) => (
                    <ItemRow key={item.id} item={item} today={today} onComplete={() => complete(item)} onUncheck={() => update((s) => uncheckDaily(s, item.id))} />
                  ))}
                  {items.length === 0 && (
                    <li>
                      <button className="empty-row" onClick={() => setAdding({ categoryId: c.id })}>
                        + Add an item
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <button className="fab" onClick={() => setAdding({ categoryId: tab === "hub" ? null : tab })}>
        + Add
      </button>

      {adding && (
        <AddSheet
          categories={ordered}
          defaultCategoryId={adding.categoryId}
          existingTitles={(id) => state.items.filter((i) => i.categoryId === id).map((i) => i.title)}
          onAdd={onAdd}
          onClose={() => setAdding(null)}
        />
      )}

      {menu && <Menu state={state} update={update} onClose={() => setMenu(false)} />}

      {toast && (
        <ToastBar
          toast={toast}
          onUndo={() => {
            update((s) => undoComplete(s, toast.snapshot, toast.completionId));
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
    </main>
  );
}

function ItemRow({ item, today, onComplete, onUncheck }: { item: Item; today: string; onComplete: () => void; onUncheck: () => void }) {
  const [dx, setDx] = useState(0);
  const [gone, setGone] = useState(false);
  const start = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const doneToday = item.repeat === "daily" && item.doneOn === today;
  const info = item.due ? dueInfo(item.due, today) : null;

  const finish = () => {
    setGone(true);
    setDx(-500);
    setTimeout(onComplete, 180);
  };

  return (
    <li className={`item-wrap${gone ? " gone" : ""}`}>
      <div className="swipe-hint" aria-hidden>
        Done
      </div>
      <div
        className={`item${doneToday ? " done" : ""}`}
        style={{ transform: `translateX(${dx}px)`, transition: dragging ? "none" : "transform .18s" }}
        onPointerDown={(e) => {
          if (doneToday || (e.target as HTMLElement).closest("button")) return;
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
        <button
          className={`check${doneToday ? " on" : ""}`}
          aria-label={doneToday ? `Mark ${item.title} as not done` : `Complete ${item.title}`}
          aria-pressed={doneToday}
          onClick={() => (doneToday ? onUncheck() : finish())}
        >
          {doneToday ? "✓" : ""}
        </button>
        <span className="item-title">{item.title}</span>
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
      <span>Done</span>
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

"use client";

import { useEffect, useState } from "react";
import type { AppState, Group } from "@/lib/types";
import { parseDump, UNSORTED } from "@/lib/categorize";
import { seed, uid } from "@/lib/actions";
import { todayStr } from "@/lib/dates";

type Update = (fn: (s: AppState) => AppState) => void;

const EXAMPLES = [
  "Keys, wallet, phone before leaving",
  "RSVP for brother's wedding",
  "Permission slip due Friday",
  "change car oil",
  "reach out to a friend about brunch",
];

interface DraftList {
  key: string;
  title: string;
  items: string[];
  draft: string;
}

interface ReviewItem {
  id: string;
  title: string;
}
interface ReviewGroup {
  key: string;
  name: string;
  items: ReviewItem[];
}

const newList = (): DraftList => ({ key: uid(), title: "", items: [], draft: "" });

/** Pending text in an add-item box counts as an item when the user moves on. */
function flushed(lists: DraftList[]): DraftList[] {
  return lists.map((l) => (l.draft.trim() ? { ...l, items: [...l.items, l.draft.trim()], draft: "" } : l));
}

export default function FirstVisit({ state, update }: { state: AppState; update: Update }) {
  const [lists, setLists] = useState<DraftList[]>(() => [newList()]);
  const [review, setReview] = useState<ReviewGroup[] | null>(null);
  const [n, setN] = useState(0);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setN((x) => x + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const finish = (groups: Group[]) => update((s) => seed(s, groups, todayStr()));
  const imported = state.items.length;
  const hasItems = imported > 0 || lists.some((l) => l.items.length > 0 || l.draft.trim());
  const patch = (key: string, p: Partial<DraftList>) => setLists((ls) => ls.map((l) => (l.key === key ? { ...l, ...p } : l)));

  // Titled lists keep their title. Items in untitled lists are filed by the sorter.
  const sort = () => {
    const groups: Group[] = [];
    for (const l of flushed(lists)) {
      if (l.items.length === 0) continue;
      if (l.title.trim()) groups.push({ name: l.title.trim(), context: null, items: l.items });
      else groups.push(...parseDump(l.items.join("\n")));
    }
    if (groups.length === 0) return finish([]);
    setLists(flushed(lists));
    setReview(groups.map((g) => ({ key: uid(), name: g.name, items: g.items.map((title) => ({ id: uid(), title })) })));
  };

  // Lists are kept exactly as written. An untitled list becomes "Unsorted".
  const createManually = () =>
    finish(flushed(lists).map((l) => ({ name: l.title.trim() || UNSORTED, context: null, items: l.items })));

  if (review) {
    return (
      <Review
        groups={review}
        setGroups={(g) => setReview(g)}
        onBack={() => setReview(null)}
        onConfirm={() => finish(review.map((g) => ({ name: g.name, context: null, items: g.items.map((i) => i.title) })))}
      />
    );
  }

  return (
    <main className="screen write">
      <header className="intro">
        <h1 className="brand">Don&rsquo;t Forget&hellip;!</h1>
        <p className="faint">
          One place for the things you&rsquo;d normally forget: checklists, errands, deadlines. It reorders itself to fit your day.
        </p>
        <p className="routes faint">
          <strong>Sort it!</strong> Write everything in one go. We file it into lists for you, and you review before it&rsquo;s saved.
        </p>
        <p className="routes faint">
          <strong>Create Manually</strong> Make your own lists and titles. Nothing gets moved or renamed.
        </p>
      </header>

      {imported > 0 && <p className="faint small">{imported} imported tasks are already filed into your lists.</p>}

      {lists.map((l) => (
        <section key={l.key} className="draft-list">
          <div className="title-row">
            <input
              className="title-input"
              value={l.title}
              onChange={(e) => patch(l.key, { title: e.target.value })}
              placeholder="Enter category name"
              aria-label="Category name"
            />
            <button
              className="icon-btn trash"
              aria-label="Delete list"
              title="Delete list"
              onClick={() => setLists((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : [newList()]))}
              disabled={lists.length === 1 && !l.title && l.items.length === 0 && !l.draft}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M6 6l1 14h10l1-14" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </button>
          </div>
          <ul className="plain-list">
            {l.items.map((t, i) => (
              <li key={i} className="plain-row">
                <span>{t}</span>
                <button className="icon-btn" aria-label={`Remove ${t}`} onClick={() => patch(l.key, { items: l.items.filter((_, j) => j !== i) })}>
                  &times;
                </button>
              </li>
            ))}
          </ul>
          <form
            className="add-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (l.draft.trim()) patch(l.key, { items: [...l.items, l.draft.trim()], draft: "" });
            }}
          >
            <input
              value={l.draft}
              onChange={(e) => patch(l.key, { draft: e.target.value })}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                if (!/\r?\n/.test(text)) return;
                e.preventDefault();
                const lines = text.split(/\r?\n/).map((x) => x.replace(/^[\s\-*•]+/, "").trim()).filter(Boolean);
                patch(l.key, { items: [...l.items, ...lines] });
              }}
              onFocus={() => setFocused(l.key)}
              onBlur={() => setFocused((f) => (f === l.key ? null : f))}
              placeholder={focused === l.key ? `e.g. ${EXAMPLES[n % EXAMPLES.length]}` : "Add an item"}
              aria-label="New item"
            />
            <button type="submit" className="btn ghost" disabled={!l.draft.trim()}>
              + Add
            </button>
          </form>
        </section>
      ))}

      <button className="link new-list" onClick={() => setLists((ls) => [...flushed(ls), newList()])}>
        + New list
      </button>

      <div className="footer-bar stack">
        <div className="footer-buttons">
          <button className="btn ghost" disabled={!hasItems} onClick={createManually}>
            Create Manually
          </button>
          <button className="btn primary" disabled={!hasItems} onClick={sort}>
            Sort it!
          </button>
        </div>
      </div>
    </main>
  );
}

function Review({
  groups,
  setGroups,
  onBack,
  onConfirm,
}: {
  groups: ReviewGroup[];
  setGroups: (g: ReviewGroup[]) => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const rename = (key: string, name: string) => setGroups(groups.map((g) => (g.key === key ? { ...g, name } : g)));
  const remove = (key: string, id: string) =>
    setGroups(groups.map((g) => (g.key === key ? { ...g, items: g.items.filter((i) => i.id !== id) } : g)));
  const move = (from: string, id: string, to: string) => {
    const item = groups.find((g) => g.key === from)?.items.find((i) => i.id === id);
    if (!item || from === to) return;
    setGroups(
      groups.map((g) => {
        if (g.key === from) return { ...g, items: g.items.filter((i) => i.id !== id) };
        if (g.key === to) return { ...g, items: [...g.items, item] };
        return g;
      }),
    );
  };
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  if (total === 0) {
    return (
      <main className="screen">
        <button className="link" onClick={onBack}>
          &lsaquo; Back
        </button>
        <p className="faint">Nothing to sort yet.</p>
      </main>
    );
  }

  return (
    <main className="screen">
      <button className="link" onClick={onBack}>
        &lsaquo; Back
      </button>
      <p className="faint small">Rename a group or move items. Groups with the same name are merged.</p>
      {groups
        .filter((g) => g.items.length > 0)
        .map((g) => (
          <section key={g.key} className="review-group">
            <input
              className="group-name"
              value={g.name}
              onChange={(e) => rename(g.key, e.target.value)}
              aria-label="Group name"
              placeholder={UNSORTED}
            />
            <ul className="plain-list">
              {g.items.map((i) => (
                <li key={i.id} className="plain-row">
                  <span>{i.title}</span>
                  <select value={g.key} onChange={(e) => move(g.key, i.id, e.target.value)} aria-label={`Move ${i.title}`}>
                    {groups.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.name || UNSORTED}
                      </option>
                    ))}
                  </select>
                  <button className="icon-btn" aria-label={`Remove ${i.title}`} onClick={() => remove(g.key, i.id)}>
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      <div className="footer-bar">
        <button className="btn primary" onClick={onConfirm}>
          Looks good
        </button>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { AppState, Group } from "@/lib/types";
import { parseDump, UNSORTED } from "@/lib/categorize";
import { seed, uid } from "@/lib/actions";
import { todayStr } from "@/lib/dates";
import { unusedSuggestions } from "@/lib/suggestions";
import { DoodleRow } from "./Doodles";
import GroupEditor, { toEditGroups, toGroups, type EditGroup } from "./GroupEditor";

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

const newList = (): DraftList => ({ key: uid(), title: "", items: [], draft: "" });

/** Pending text in an add-item box counts as an item when the user moves on. */
function flushed(lists: DraftList[]): DraftList[] {
  return lists.map((l) => (l.draft.trim() ? { ...l, items: [...l.items, l.draft.trim()], draft: "" } : l));
}

export default function FirstVisit({ state, update }: { state: AppState; update: Update }) {
  const [lists, setLists] = useState<DraftList[]>(() => [newList()]);
  const [review, setReview] = useState<EditGroup[] | null>(null);
  const [n, setN] = useState(0);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setN((x) => x + 1), 3000);
    return () => clearInterval(t);
  }, []);

  // Fill the first empty list's title, otherwise start a new list with that title.
  const addSuggested = (title: string) =>
    setLists((ls) => {
      const empty = ls.find((l) => !l.title.trim() && l.items.length === 0 && !l.draft.trim());
      return empty ? ls.map((l) => (l === empty ? { ...l, title } : l)) : [...flushed(ls), { ...newList(), title }];
    });

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
    setReview(toEditGroups(groups));
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
        onConfirm={() => finish(toGroups(review))}
      />
    );
  }

  return (
    <main className="screen write">
      <DoodleRow names={["leaf", "sparkle", "mushroom", "smiley", "flower", "pumpkin"]} />
      <button
        className="link"
        onClick={() => update((s) => ({ ...s, profile: { ...s.profile, setupDone: false } }))}
      >
        &lsaquo; Back to setup
      </button>
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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  document.getElementById(`item-${l.key}`)?.focus();
                }
              }}
              placeholder="Category name (Optional)"
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
              // Enter on an empty box means "I'm done": jump to the Sort it! button.
              else if (hasItems) document.getElementById("sort-it")?.focus();
            }}
          >
            <input
              id={`item-${l.key}`}
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

      <div className="suggested">
        <p className="faint small">Suggested lists</p>
        <div className="chips">
          {unusedSuggestions([...lists.map((l) => l.title), ...state.categories.map((c) => c.name)]).map((s) => (
            <button key={s} type="button" className="suggest" onClick={() => addSuggested(s)}>
              + {s}
            </button>
          ))}
        </div>
      </div>

      <button className="link new-list" onClick={() => setLists((ls) => [...flushed(ls), newList()])}>
        + New list
      </button>

      <div className="footer-bar stack">
        <div className="footer-buttons">
          <button className="btn ghost" disabled={!hasItems} onClick={createManually}>
            Create Manually
          </button>
          <button id="sort-it" className="btn primary" disabled={!hasItems} onClick={sort}>
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
  groups: EditGroup[];
  setGroups: (g: EditGroup[]) => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <main className="screen">
      <button className="link" onClick={onBack}>
        &lsaquo; Back
      </button>
      {total === 0 ? (
        <p className="faint">Nothing to sort yet.</p>
      ) : (
        <>
          <h2 className="brand">Preview</h2>
          <p className="faint small">
            This is just a preview, so your lists aren&rsquo;t set up yet. Rename a group, or drag items between groups and within them. Groups
            with the same name are merged.
          </p>
          <GroupEditor groups={groups} setGroups={setGroups} />
          <div className="footer-bar">
            <button className="btn primary" autoFocus onClick={onConfirm}>
              Looks good
            </button>
          </div>
        </>
      )}
    </main>
  );
}

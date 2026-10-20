"use client";

import { useEffect, useRef, useState } from "react";
import type { AppState, Group } from "@/lib/types";
import { parseDump, UNSORTED } from "@/lib/categorize";
import { importGroups, seed, uid } from "@/lib/actions";
import { todayStr } from "@/lib/dates";
import { IMPORT_SOURCES } from "@/lib/sampleImports";
import { unusedSuggestions } from "@/lib/suggestions";
import { cityOf, deviceZone, zoneOptions } from "@/lib/timezones";
import { phaseOf } from "@/lib/order";
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

/**
 * The whole onboarding on one screen. The steps sit side by side (stacked on a phone) and only
 * the step you are on is bright; the others fade until you reach them. Every step can be skipped.
 * When setup is re-run from Settings (the lists already exist), the last step is "Where are you?".
 */
export default function Onboarding({ state, update }: { state: AppState; update: Update }) {
  const rerun = state.onboarded;
  const steps = rerun ? (["name", "import", "location"] as const) : (["name", "import", "location", "lists"] as const);
  const last = steps.length - 1;

  const [active, setActive] = useState(!rerun && state.profile.setupDone ? last : 0);
  const [name, setName] = useState(state.profile.name);
  const [imported, setImported] = useState<string[]>([]);
  const [preview, setPreview] = useState<{ id: string; label: string; groups: EditGroup[] } | null>(null);
  const [zone, setZone] = useState(state.profile.timeZone);
  const [lists, setLists] = useState<DraftList[]>(() => [newList()]);
  const [review, setReview] = useState<EditGroup[] | null>(null);
  const [n, setN] = useState(0);
  const [focused, setFocused] = useState<string | null>(null);

  const panels = useRef<(HTMLElement | null)[]>([]);
  const firstRun = useRef(true);

  useEffect(() => {
    const t = setInterval(() => setN((x) => x + 1), 3000);
    return () => clearInterval(t);
  }, []);

  // When the active step changes, bring it into view and put the cursor in it.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const el = panels.current[active];
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    // Cursor in the first text box; if there is none, on the main button so Enter continues.
    const target =
      el?.querySelector<HTMLElement>("input, textarea") ??
      el?.querySelector<HTMLElement>("button[type=submit]") ??
      el?.querySelector<HTMLElement>("button:not([disabled])");
    target?.focus({ preventScroll: true });
  }, [active]);

  const imports = state.items.length;
  const hasItems = imports > 0 || lists.some((l) => l.items.length > 0 || l.draft.trim());
  const patch = (key: string, p: Partial<DraftList>) => setLists((ls) => ls.map((l) => (l.key === key ? { ...l, ...p } : l)));
  const next = () => setActive((a) => Math.min(a + 1, last));
  const back = () => setActive((a) => Math.max(a - 1, 0));

  const profilePatch = (s: AppState) => ({ ...s.profile, name: name.trim(), timeZone: zone, setupDone: true });
  /** Re-running setup from Settings: save the answers and go back to the hub. */
  const finishSetup = () => update((s) => ({ ...s, profile: profilePatch(s) }));
  /** First run: save the answers, build the lists, and open the hub. */
  const finish = (groups: Group[]) => update((s) => ({ ...seed(s, groups, todayStr()), profile: profilePatch(s) }));

  const addSuggested = (title: string) =>
    setLists((ls) => {
      const empty = ls.find((l) => !l.title.trim() && l.items.length === 0 && !l.draft.trim());
      return empty ? ls.map((l) => (l === empty ? { ...l, title } : l)) : [...flushed(ls), { ...newList(), title }];
    });

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
      <Review groups={review} setGroups={setReview} onBack={() => setReview(null)} onConfirm={() => finish(toGroups(review))} />
    );
  }

  const current = zone || deviceZone();
  const phaseText = phaseOf(new Date(), current) === "day" ? "daytime" : phaseOf(new Date(), current);

  const panel = (i: number, title: string, body: React.ReactNode) => {
    const status = i < active ? "done" : i === active ? "active" : "future";
    return (
      <section
        key={title}
        ref={(el) => {
          panels.current[i] = el;
        }}
        className={`panel ${status}`}
        inert={status !== "active"}
        aria-label={`Step ${i + 1}: ${title}`}
      >
        <header className="panel-head">
          <span className="num" aria-hidden>
            {status === "done" ? "✓" : i + 1}
          </span>
          <h2 className="brand">{title}</h2>
        </header>
        {body}
      </section>
    );
  };

  const backBtn = (
    <button type="button" className="btn ghost" onClick={back}>
      Back
    </button>
  );

  const body: Record<string, React.ReactNode> = {
    name: (
      <form
        className="setup-step"
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
      >
        <p className="faint">We&rsquo;ll use it to say hello. It stays on this device.</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" aria-label="Your name" autoFocus />
        <div className="setup-actions">
          <button type="button" className="btn ghost" onClick={next}>
            Skip
          </button>
          <button type="submit" className="btn primary">
            Continue
          </button>
        </div>
      </form>
    ),

    import: preview ? (
      <form
        className="setup-step"
        onKeyDown={(e) => e.key === "Escape" && setPreview(null)}
        onSubmit={(e) => {
          e.preventDefault();
          update((s) => importGroups(s, toGroups(preview.groups.filter((g) => g.items.length > 0))));
          setImported([...imported, preview.id]);
          setPreview(null);
        }}
      >
        <h3 className="preview-title">Preview</h3>
        <p className="faint small">
          Importing from {preview.label}. This is just a preview, so nothing is in your lists yet. Rename a group, or drag items between groups and
          within them.
        </p>
        <GroupEditor groups={preview.groups} setGroups={(groups) => setPreview({ ...preview, groups })} />
        <div className="setup-actions">
          <button type="button" className="btn ghost" onClick={() => setPreview(null)}>
            Back
          </button>
          <button type="submit" className="btn primary" autoFocus disabled={preview.groups.every((g) => g.items.length === 0)}>
            Add {preview.groups.reduce((c, g) => c + g.items.length, 0)} tasks
          </button>
        </div>
      </form>
    ) : (
      <form
        className="setup-step"
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
      >
        <p className="faint">Optional. You&rsquo;ll see a preview of how the tasks will be filed before anything is added.</p>
        <ul className="plain-list">
          {IMPORT_SOURCES.map((src) => {
            const isDone = imported.includes(src.id);
            return (
              <li key={src.id} className="plain-row">
                <span className="grow">
                  {src.label}
                  {isDone && <span className="faint small"> &middot; {src.tasks.length} imported</span>}
                </span>
                <button
                  type="button"
                  className="btn ghost"
                  disabled={isDone}
                  onClick={() =>
                    setPreview({
                      id: src.id,
                      label: src.label,
                      groups: toEditGroups(parseDump(src.tasks.join("\n"), state.categories.map((c) => c.name))),
                    })
                  }
                >
                  {isDone ? "✓" : "Preview"}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="setup-actions">
          {backBtn}
          <button type="submit" className="btn primary">
            {imported.length ? "Continue" : "Skip"}
          </button>
        </div>
      </form>
    ),

    location: (
      <form
        className="setup-step"
        onSubmit={(e) => {
          e.preventDefault();
          if (rerun) finishSetup();
          else next();
        }}
      >
        <p className="faint">
          So we know when it&rsquo;s day, evening, or night where you are, and can put the right lists first. We only read your time zone, not your
          exact location.
        </p>
        <button type="button" className="btn ghost" onClick={() => setZone(deviceZone())}>
          Use my location
        </button>
        <label className="field">
          <span>Or pick a time zone</span>
          <select value={zone} onChange={(e) => setZone(e.target.value)}>
            <option value="">Device default ({cityOf(deviceZone()) || "unknown"})</option>
            {zoneOptions(zone).map((z) => (
              <option key={z} value={z}>
                {cityOf(z)}
              </option>
            ))}
          </select>
        </label>
        <p className="faint small">
          Right now in {cityOf(current) || "your area"} it&rsquo;s {phaseText}.
        </p>
        <div className="setup-actions">
          {backBtn}
          <button type="button" className="btn ghost" onClick={() => (rerun ? finishSetup() : (setZone(""), next()))}>
            Skip
          </button>
          <button type="submit" className="btn primary">
            {rerun ? "Finish" : "Continue"}
          </button>
        </div>
      </form>
    ),

    lists: (
      <div className="setup-step">
        <div className="routes-grid">
          <p className="routes faint">
            <strong>Sort it!</strong>
            Write everything in one go. We file it into lists for you, and you review before it&rsquo;s saved.
          </p>
          <p className="routes faint">
            <strong>Create Manually</strong>
            Make your own lists and titles. Nothing gets moved or renamed.
          </p>
        </div>
        {imports > 0 && <p className="faint small">{imports} imported tasks are already filed into your lists.</p>}

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
            {l.items.length > 0 && (
              <ul className="plain-list">
                {l.items.map((t, i) => (
                  <li key={i} className="plain-row">
                    <span className="grow">{t}</span>
                    <button className="icon-btn" aria-label={`Remove ${t}`} onClick={() => patch(l.key, { items: l.items.filter((_, j) => j !== i) })}>
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <form
              className="add-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (l.draft.trim()) patch(l.key, { items: [...l.items, l.draft.trim()], draft: "" });
                // Enter on an empty box means "I'm done": jump to the Sort it! button.
                else if (hasItems) document.getElementById("sort-it")?.focus();
              }}
            >
              <span className="plus" aria-hidden>
                +
              </span>
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

        <button className="link new-list" onClick={() => setLists((ls) => [...flushed(ls), newList()])}>
          + New list
        </button>

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

        <div className="setup-actions">
          {backBtn}
          <button className="btn ghost" disabled={!hasItems} onClick={createManually}>
            Create Manually
          </button>
          <button id="sort-it" className="btn primary" disabled={!hasItems} onClick={sort}>
            Sort it!
          </button>
        </div>
      </div>
    ),
  };

  const titles: Record<string, string> = {
    name: "What should we call you?",
    import: "Bring in a to-do list?",
    location: "Where are you?",
    lists: "Start your lists",
  };

  return (
    <main className="screen onboarding">
      <DoodleRow names={["pumpkin", "flower", "smiley", "mushroom", "sparkle", "leaf"]} />
      <header className="onboard-intro">
        <div>
          <h1 className="brand">Don&rsquo;t Forget&hellip;!</h1>
          <p className="faint">
            One place for the things you&rsquo;d normally forget: checklists, errands, deadlines. It reorders itself to fit your day.
          </p>
        </div>
        <button className="link" onClick={() => (rerun ? finishSetup() : setActive(last))}>
          {rerun ? "Skip setup" : active < last ? "Skip to my lists" : ""}
        </button>
      </header>
      <div className="onboard">{steps.map((s, i) => panel(i, titles[s], body[s]))}</div>
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

"use client";

import { useEffect, useRef, useState } from "react";
import type { AppState, Group } from "@/lib/types";
import { parseDump, UNSORTED } from "@/lib/categorize";
import { seed, uid } from "@/lib/actions";
import { todayStr } from "@/lib/dates";

type Step = "choose" | "build" | "dump" | "review";
type Update = (fn: (s: AppState) => AppState) => void;

const SUGGESTED_TITLE = "Leaving the house";

const DUMP_EXAMPLES = [
  "Keys, wallet, phone before leaving",
  "RSVP for brother's wedding",
  "Permission slip due Friday",
  "change car oil",
  "reach out to a friend about brunch",
];

interface ReviewItem {
  id: string;
  title: string;
}
interface ReviewGroup {
  key: string;
  name: string;
  items: ReviewItem[];
}

export default function FirstVisit({ update }: { update: Update }) {
  const [step, setStep] = useState<Step>("choose");
  const [dump, setDump] = useState("");
  const [review, setReview] = useState<ReviewGroup[]>([]);

  const finish = (groups: Group[]) => update((s) => seed(s, groups, todayStr()));

  if (step === "build") {
    return <Build onBack={() => setStep("choose")} onDone={finish} />;
  }

  if (step === "dump") {
    return (
      <Dump
        text={dump}
        setText={setDump}
        onBack={() => setStep("choose")}
        onSort={() => {
          const groups = parseDump(dump);
          setReview(groups.map((g) => ({ key: uid(), name: g.name, items: g.items.map((title) => ({ id: uid(), title })) })));
          setStep("review");
        }}
      />
    );
  }

  if (step === "review") {
    return (
      <Review
        groups={review}
        setGroups={setReview}
        onBack={() => setStep("dump")}
        onConfirm={() => finish(review.map((g) => ({ name: g.name, context: null, items: g.items.map((i) => i.title) })))}
      />
    );
  }

  return (
    <main className="screen first">
      <h1 className="brand">Don&rsquo;t Forget&hellip;!</h1>
      <div className="choices">
        <button className="choice" onClick={() => setStep("build")}>
          <strong>Build my own</strong>
          <span>Start with one list.</span>
        </button>
        <button className="choice" onClick={() => setStep("dump")}>
          <strong>Dump everything</strong>
          <span>Type it all out. We&rsquo;ll sort it.</span>
        </button>
      </div>
    </main>
  );
}

function Build({ onBack, onDone }: { onBack: () => void; onDone: (g: Group[]) => void }) {
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  const addDraft = () => {
    const t = draft.trim();
    if (t) setItems((prev) => [...prev, t]);
    setDraft("");
    return t ? [...items, t] : items;
  };

  return (
    <main className="screen">
      <button className="link" onClick={onBack}>
        &lsaquo; Back
      </button>
      <input
        className="title-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={SUGGESTED_TITLE}
        aria-label="List title"
        autoFocus
      />
      <ul className="plain-list">
        {items.map((t, i) => (
          <li key={i} className="plain-row">
            <span>{t}</span>
            <button className="icon-btn" aria-label={`Remove ${t}`} onClick={() => setItems(items.filter((_, j) => j !== i))}>
              &times;
            </button>
          </li>
        ))}
      </ul>
      <form
        className="add-row"
        onSubmit={(e) => {
          e.preventDefault();
          addDraft();
        }}
      >
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add an item" aria-label="New item" />
        <button type="submit" className="btn ghost" disabled={!draft.trim()}>
          + Add
        </button>
      </form>
      <div className="footer-bar">
        <button
          className="btn primary"
          disabled={!draft.trim() && items.length === 0}
          onClick={() => {
            const all = addDraft();
            onDone([{ name: title.trim() || SUGGESTED_TITLE, context: null, items: all }]);
          }}
        >
          Done
        </button>
      </div>
    </main>
  );
}

function Dump({ text, setText, onBack, onSort }: { text: string; setText: (t: string) => void; onBack: () => void; onSort: () => void }) {
  const [n, setN] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => setN((x) => x + 1), 3000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  return (
    <main className="screen">
      <button className="link" onClick={onBack}>
        &lsaquo; Back
      </button>
      <textarea
        className="dump"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={DUMP_EXAMPLES[n % DUMP_EXAMPLES.length]}
        aria-label="Everything you don't want to forget"
        autoFocus
      />
      <div className="footer-bar">
        <button className="btn primary" disabled={!text.trim()} onClick={onSort}>
          Sort it
        </button>
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

"use client";

import { useRef, useState } from "react";
import { useDialog } from "@/lib/useDialog";
import type { AppState, Mode } from "@/lib/types";
import { rangeStart, summarize, type Range } from "@/lib/stats";
import Pie, { Legend } from "./Pie";
import CompletedList from "./CompletedList";
import AppearancePicker from "./AppearancePicker";
import { restoreCategory, restoreFromHistory } from "@/lib/actions";
import { clearAll, exportData } from "@/lib/storage";
import { cityOf, deviceZone, zoneOptions } from "@/lib/timezones";

type View = "menu" | "history" | "settings";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "time", label: "By time of day", hint: "Lists rotate as your day changes." },
  { id: "date", label: "By date", hint: "Overdue and soonest first." },
  { id: "manual", label: "My own order", hint: "Drag lists to reorder." },
];

export default function Menu({
  state,
  update,
  onClose,
}: {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  onClose: () => void;
}) {
  const [view, setView] = useState<View>("menu");
  const drawer = useRef<HTMLDivElement>(null);
  useDialog(drawer, onClose);

  return (
    <div className="scrim left" onClick={onClose}>
      <div ref={drawer} className="drawer" role="dialog" aria-modal="true" aria-label="Menu" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          {view !== "menu" ? (
            <button className="link" onClick={() => setView("menu")}>
              &lsaquo; Menu
            </button>
          ) : (
            <span />
          )}
          <button className="icon-btn" aria-label="Close menu" onClick={onClose}>
            &times;
          </button>
        </div>

        {view === "menu" && (
          <nav className="menu-list">
            <button onClick={() => setView("history")}>History &amp; Your Stats</button>
            <button onClick={() => setView("settings")}>Settings</button>
          </nav>
        )}
        {view === "history" && <History state={state} update={update} />}
        {view === "settings" && <Settings state={state} update={update} />}
      </div>
    </div>
  );
}

function History({ state, update }: { state: AppState; update: (fn: (s: AppState) => AppState) => void }) {
  const [range, setRange] = useState<Range>("week");
  const [opened] = useState(() => Date.now());
  const { entries, slices } = summarize(state, rangeStart(range, opened));

  return (
    <div className="drawer-body">
      <div className="seg" role="radiogroup" aria-label="Range">
        {(["today", "week", "all"] as Range[]).map((r) => (
          <button key={r} role="radio" aria-checked={range === r} className={range === r ? "on" : ""} onClick={() => setRange(r)}>
            {r === "today" ? "Today" : r === "week" ? "Week" : "All"}
          </button>
        ))}
      </div>
      {entries.length > 0 && (
        <>
          <Pie slices={slices} total={entries.length} />
          <Legend slices={slices} />
        </>
      )}
      <CompletedList entries={entries} categories={state.categories} nowMs={opened} onRestore={(id) => update((s) => restoreFromHistory(s, id))} />
    </div>
  );
}

function Settings({ state, update }: { state: AppState; update: (fn: (s: AppState) => AppState) => void }) {
  const download = () => {
    const url = URL.createObjectURL(new Blob([exportData()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "dont-forget.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="drawer-body">
      <AppearancePicker appearance={state.appearance} onChange={(patch) => update((s) => ({ ...s, appearance: { ...s.appearance, ...patch } }))} />
      <label className="field">
        <span>Your name</span>
        <input
          value={state.profile.name}
          onChange={(e) => update((s) => ({ ...s, profile: { ...s.profile, name: e.target.value } }))}
          placeholder="Optional"
        />
      </label>
      <label className="field">
        <span>Time zone</span>
        <select value={state.profile.timeZone} onChange={(e) => update((s) => ({ ...s, profile: { ...s.profile, timeZone: e.target.value } }))}>
          <option value="">Device default ({cityOf(deviceZone()) || "unknown"})</option>
          {zoneOptions(state.profile.timeZone).map((z) => (
            <option key={z} value={z}>
              {cityOf(z)}
            </option>
          ))}
        </select>
      </label>
      <div role="radiogroup" aria-label="Order lists" className="radio-list">
        {MODES.map((m) => (
          <button key={m.id} role="radio" aria-checked={state.mode === m.id} className={state.mode === m.id ? "on" : ""} onClick={() => update((s) => ({ ...s, mode: m.id }))}>
            <strong>{m.label}</strong>
            <span className="faint small">{m.hint}</span>
          </button>
        ))}
      </div>
      {state.categories.some((c) => c.archived) && (
        <div className="field">
          <span>Cleared lists</span>
          <ul className="plain-list">
            {state.categories
              .filter((c) => c.archived)
              .map((c) => (
                <li key={c.id} className="plain-row">
                  <span className="grow">{c.name}</span>
                  <button className="btn ghost" onClick={() => update((s) => restoreCategory(s, c.id))}>
                    Bring back
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
      <button className="btn ghost" onClick={() => update((s) => ({ ...s, profile: { ...s.profile, setupDone: false } }))}>
        Set up again
      </button>
      <button className="btn ghost" onClick={download}>
        Export my data
      </button>
      <button
        className="btn danger"
        onClick={() => {
          if (window.confirm("Erase everything and start over?")) clearAll();
        }}
      >
        Erase everything
      </button>
    </div>
  );
}

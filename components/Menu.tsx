"use client";

import { useState } from "react";
import type { AppState, Mode } from "@/lib/types";
import { paletteAt } from "@/lib/style";
import { restoreFromHistory } from "@/lib/actions";
import { clearAll, exportData } from "@/lib/storage";
import { cityOf, deviceZone, zoneOptions } from "@/lib/timezones";

type View = "menu" | "history" | "settings";
type Range = "today" | "week" | "all";

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

  return (
    <div className="scrim left" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-label="Menu" onClick={(e) => e.stopPropagation()}>
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
      </aside>
    </div>
  );
}

function History({ state, update }: { state: AppState; update: (fn: (s: AppState) => AppState) => void }) {
  const [range, setRange] = useState<Range>("week");
  const [opened] = useState(() => Date.now());
  const startOfToday = new Date(opened).setHours(0, 0, 0, 0);
  const since = range === "today" ? startOfToday : range === "week" ? opened - 7 * 86400000 : 0;
  const entries = state.log.filter((c) => c.at >= since).sort((a, b) => b.at - a.at);

  const counts = new Map<string, { name: string; value: number; style: number }>();
  for (const c of entries) {
    const cat = state.categories.find((x) => x.id === c.categoryId);
    const row = counts.get(c.categoryId) ?? { name: c.categoryName, value: 0, style: cat?.style ?? 0 };
    row.value += 1;
    counts.set(c.categoryId, row);
  }
  const slices = [...counts.values()].sort((a, b) => b.value - a.value);

  return (
    <div className="drawer-body">
      <div className="seg" role="radiogroup" aria-label="Range">
        {(["today", "week", "all"] as Range[]).map((r) => (
          <button key={r} role="radio" aria-checked={range === r} className={range === r ? "on" : ""} onClick={() => setRange(r)}>
            {r === "today" ? "Today" : r === "week" ? "Week" : "All"}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <p className="faint">Nothing completed yet. Swipe an item away and it shows up here.</p>
      ) : (
        <>
          <Pie slices={slices} total={entries.length} />
          <ul className="legend">
            {slices.map((s) => (
              <li key={s.name}>
                <span className="swatch" style={{ color: paletteAt(s.style).color }} aria-hidden>
                  {paletteAt(s.style).icon}
                </span>
                <span>{s.name}</span>
                <strong>{s.value}</strong>
              </li>
            ))}
          </ul>
          <ul className="history">
            {entries.map((c) => (
              <li key={c.id}>
                <div>
                  <span>{c.title}</span>
                  <span className="faint small">
                    {c.categoryName} &middot; {new Date(c.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                  {c.steps.length > 0 && <span className="faint small">Steps: {[...c.steps, c.title].join(" → ")}</span>}
                </div>
                {c.repeat === "once" && (
                  <button className="link" onClick={() => update((s) => restoreFromHistory(s, c.id))}>
                    Restore
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Pie({ slices, total }: { slices: { name: string; value: number; style: number }[]; total: number }) {
  const offsets = slices.map((_, i) => slices.slice(0, i).reduce((n, s) => n + (s.value / total) * 100, 0));
  return (
    <svg className="pie" viewBox="0 0 42 42" role="img" aria-label={`${total} tasks completed`}>
      <circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--line)" strokeWidth="8" />
      {slices.map((s, i) => {
        const pct = (s.value / total) * 100;
        return (
          <circle
            key={s.name}
            cx="21"
            cy="21"
            r="15.9155"
            fill="none"
            stroke={paletteAt(s.style).color}
            strokeWidth="8"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeDashoffset={25 - offsets[i]}
          />
        );
      })}
      <text x="21" y="22.5" textAnchor="middle" className="pie-total">
        {total}
      </text>
    </svg>
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

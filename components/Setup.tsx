"use client";

import { useState } from "react";
import type { AppState } from "@/lib/types";
import { importItems } from "@/lib/actions";
import { IMPORT_SOURCES } from "@/lib/sampleImports";
import { cityOf, deviceZone, zoneOptions } from "@/lib/timezones";
import { phaseOf } from "@/lib/order";

type Update = (fn: (s: AppState) => AppState) => void;

const STEPS = ["name", "import", "location"] as const;

/** Optional setup after the first lists are saved. Every step can be skipped. */
export default function Setup({ state, update }: { state: AppState; update: Update }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(state.profile.name);
  const [imported, setImported] = useState<string[]>([]);
  const [zone, setZone] = useState(state.profile.timeZone);

  const done = () => update((s) => ({ ...s, profile: { ...s.profile, setupDone: true } }));
  const next = () => (step === STEPS.length - 1 ? done() : setStep(step + 1));

  const current = zone || deviceZone();
  const phase = phaseOf(new Date(), current);
  const phaseText = phase === "day" ? "daytime" : phase;

  return (
    <main className="screen write">
      <div className="setup-top">
        <span className="faint small">
          Step {step + 1} of {STEPS.length}
        </span>
        <button className="link" onClick={done}>
          Skip setup
        </button>
      </div>

      {step === 0 && (
        <header className="intro">
          <p className="brand-small">Don&rsquo;t Forget&hellip;!</p>
          <p className="faint">
            One place for the things you&rsquo;d normally forget: checklists, errands, deadlines. It reorders itself to fit your day.
          </p>
        </header>
      )}

      {STEPS[step] === "name" && (
        <section className="setup-step">
          <h2 className="brand">What should we call you?</h2>
          <p className="faint">We&rsquo;ll use it to say hello. It stays on this device.</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" aria-label="Your name" autoFocus />
          <div className="setup-actions">
            <button className="btn ghost" onClick={next}>
              Skip
            </button>
            <button
              className="btn primary"
              disabled={!name.trim()}
              onClick={() => {
                update((s) => ({ ...s, profile: { ...s.profile, name: name.trim() } }));
                next();
              }}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {STEPS[step] === "import" && (
        <section className="setup-step">
          <h2 className="brand">Bring in an existing to-do list?</h2>
          <p className="faint">Tasks are filed into your lists automatically. You can import more than one.</p>
          <ul className="plain-list">
            {IMPORT_SOURCES.map((src) => {
              const isDone = imported.includes(src.id);
              return (
                <li key={src.id} className="plain-row">
                  <span>
                    {src.label}
                    {isDone && <span className="faint small"> &middot; {src.tasks.length} imported</span>}
                  </span>
                  <button
                    className="btn ghost"
                    disabled={isDone}
                    onClick={() => {
                      update((s) => importItems(s, src.tasks));
                      setImported([...imported, src.id]);
                    }}
                  >
                    {isDone ? "✓" : "Import"}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="setup-actions">
            <button className="btn ghost" onClick={next}>
              {imported.length ? "Continue" : "Skip"}
            </button>
          </div>
        </section>
      )}

      {STEPS[step] === "location" && (
        <section className="setup-step">
          <h2 className="brand">Where are you?</h2>
          <p className="faint">
            So we know when it&rsquo;s day, evening, or night where you are, and can put the right lists first. We only read your time zone, not your
            exact location.
          </p>
          <button className="btn ghost" onClick={() => setZone(deviceZone())}>
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
            <button className="btn ghost" onClick={done}>
              Skip
            </button>
            <button
              className="btn primary"
              onClick={() => {
                update((s) => ({ ...s, profile: { ...s.profile, timeZone: zone, setupDone: true } }));
              }}
            >
              Finish
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

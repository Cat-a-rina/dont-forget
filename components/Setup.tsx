"use client";

import { useState } from "react";
import type { AppState } from "@/lib/types";
import { importGroups } from "@/lib/actions";
import { parseDump } from "@/lib/categorize";
import { IMPORT_SOURCES } from "@/lib/sampleImports";
import { cityOf, deviceZone, zoneOptions } from "@/lib/timezones";
import { phaseOf } from "@/lib/order";
import AppearancePicker from "./AppearancePicker";
import { DoodleRow } from "./Doodles";
import GroupEditor, { toEditGroups, toGroups, type EditGroup } from "./GroupEditor";

type Update = (fn: (s: AppState) => AppState) => void;

const STEPS = ["name", "look", "import", "location"] as const;

/** Optional setup after the first lists are saved. Every step can be skipped. */
export default function Setup({ state, update }: { state: AppState; update: Update }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(state.profile.name);
  const [imported, setImported] = useState<string[]>([]);
  const [zone, setZone] = useState(state.profile.timeZone);
  const [preview, setPreview] = useState<{ id: string; label: string; groups: EditGroup[] } | null>(null);

  const done = () => update((s) => ({ ...s, profile: { ...s.profile, setupDone: true } }));
  const next = () => (step === STEPS.length - 1 ? done() : setStep(step + 1));

  const current = zone || deviceZone();
  const phase = phaseOf(new Date(), current);
  const phaseText = phase === "day" ? "daytime" : phase;

  return (
    <main className="screen write">
      <DoodleRow names={["pumpkin", "flower", "smiley", "mushroom", "sparkle", "leaf"]} />
      <div className="setup-top">
        <div className="dots" role="img" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((_, i) => (
            <span key={i} className={i <= step ? "dot on" : "dot"} />
          ))}
        </div>
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
        <form
          className="setup-step"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) update((s) => ({ ...s, profile: { ...s.profile, name: name.trim() } }));
            next();
          }}
        >
          <h2 className="brand">What should we call you?</h2>
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
      )}

      {STEPS[step] === "look" && (
        <form
          className="setup-step"
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
        >
          <h2 className="brand">Pick a look</h2>
          <p className="faint">It changes right away, and you can change it any time in Settings.</p>
          <AppearancePicker
            appearance={state.appearance}
            show={["theme", "font"]}
            onChange={(patch) => update((s) => ({ ...s, appearance: { ...s.appearance, ...patch } }))}
          />
          <div className="setup-actions">
            <button type="button" className="btn ghost" onClick={() => setStep(step - 1)}>
              Back
            </button>
            <button type="submit" className="btn primary">
              Continue
            </button>
          </div>
        </form>
      )}

      {STEPS[step] === "import" && preview && (
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
          <h2 className="brand">Preview</h2>
          <p className="faint small">
            Importing from {preview.label}. This is just a preview, so nothing is in your lists yet. Rename a group, or drag items between groups
            and within them.
          </p>
          <GroupEditor groups={preview.groups} setGroups={(groups) => setPreview({ ...preview, groups })} />
          <div className="setup-actions">
            <button type="button" className="btn ghost" onClick={() => setPreview(null)}>
              Back
            </button>
            <button type="submit" className="btn primary" autoFocus disabled={preview.groups.every((g) => g.items.length === 0)}>
              Add {preview.groups.reduce((n, g) => n + g.items.length, 0)} tasks
            </button>
          </div>
        </form>
      )}

      {STEPS[step] === "import" && !preview && (
        <form
          className="setup-step"
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
        >
          <h2 className="brand">Bring in an existing to-do list?</h2>
          <p className="faint">You&rsquo;ll see a preview of how the tasks will be filed before anything is added. You can import more than one.</p>
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
            <button type="button" className="btn ghost" onClick={() => setStep(step - 1)}>
              Back
            </button>
            <button type="submit" className="btn primary" autoFocus>
              {imported.length ? "Continue" : "Skip"}
            </button>
          </div>
        </form>
      )}

      {STEPS[step] === "location" && (
        <form
          className="setup-step"
          onSubmit={(e) => {
            e.preventDefault();
            update((s) => ({ ...s, profile: { ...s.profile, timeZone: zone, setupDone: true } }));
          }}
        >
          <h2 className="brand">Where are you?</h2>
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
            <button type="button" className="btn ghost" onClick={() => setStep(step - 1)}>
              Back
            </button>
            <button type="button" className="btn ghost" onClick={done}>
              Skip
            </button>
            <button type="submit" className="btn primary" autoFocus>
              Finish
            </button>
          </div>
        </form>
      )}
    </main>
  );
}

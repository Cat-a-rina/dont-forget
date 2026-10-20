"use client";

import { useState } from "react";
import type { AppState } from "@/lib/types";
import { rangeStart, summarize, type Range } from "@/lib/stats";
import Pie, { Legend } from "./Pie";
import Doodle from "./Doodles";

/** A compact version of the stats pie chart for the hub. */
export default function Progress({ state, nowMs, onViewCompleted }: { state: AppState; nowMs: number; onViewCompleted: () => void }) {
  const [range, setRange] = useState<Range>("today");
  const { entries, slices } = summarize(state, rangeStart(range, nowMs));

  return (
    <section className="progress" aria-label="Your progress">
      <Doodle name="bean" size={34} className="doodle in-sheet side-doodle" />
      <div className="progress-head">
        <strong>Done {range === "today" ? "today" : "this week"}</strong>
        <div className="seg small-seg" role="radiogroup" aria-label="Range">
          {(["today", "week"] as Range[]).map((r) => (
            <button key={r} role="radio" aria-checked={range === r} className={range === r ? "on" : ""} onClick={() => setRange(r)}>
              {r === "today" ? "Today" : "Week"}
            </button>
          ))}
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="faint small">Nothing completed {range === "today" ? "today" : "this week"} yet.</p>
      ) : (
        <div className="progress-body">
          <Pie slices={slices} total={entries.length} size={76} />
          <Legend slices={slices.slice(0, 3)} />
        </div>
      )}
      <button className="link" onClick={onViewCompleted}>
        View completed items &rsaquo;
      </button>
    </section>
  );
}

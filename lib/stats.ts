import type { AppState, Completion } from "./types";

export type Range = "today" | "week" | "all";

export interface Slice {
  name: string;
  value: number;
  style: number;
}

/** Start time (ms) of a range, measured from `nowMs`. */
export function rangeStart(range: Range, nowMs: number): number {
  if (range === "today") return new Date(nowMs).setHours(0, 0, 0, 0);
  if (range === "week") return nowMs - 7 * 86400000;
  return 0;
}

/** Completions since `since`, newest first, plus per-category counts for the pie chart. */
export function summarize(state: AppState, since: number): { entries: Completion[]; slices: Slice[] } {
  const entries = state.log.filter((c) => c.at >= since).sort((a, b) => b.at - a.at);
  const counts = new Map<string, Slice>();
  for (const c of entries) {
    const cat = state.categories.find((x) => x.id === c.categoryId);
    const row = counts.get(c.categoryId) ?? { name: c.categoryName, value: 0, style: cat?.style ?? 0 };
    row.value += 1;
    counts.set(c.categoryId, row);
  }
  return { entries, slices: [...counts.values()].sort((a, b) => b.value - a.value) };
}

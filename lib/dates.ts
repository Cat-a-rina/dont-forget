const pad = (n: number) => String(n).padStart(2, "0");

export function dateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayStr(): string {
  return dateStr(new Date());
}

function parse(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / 86400000);
}

export type DueState = "overdue" | "today" | "soon" | "later";

export function dueInfo(due: string, today: string): { state: DueState; label: string } {
  const diff = daysBetween(today, due);
  const pretty = parse(due).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  if (diff < 0) return { state: "overdue", label: `Overdue · ${pretty}` };
  if (diff === 0) return { state: "today", label: "Today" };
  if (diff === 1) return { state: "soon", label: "Tomorrow" };
  return { state: diff <= 3 ? "soon" : "later", label: pretty };
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * Looks for a date written in plain words ("due Friday", "tomorrow", "on Monday", "Oct 19", "10/19")
 * and returns it as YYYY-MM-DD, or null. Used so urgent items stand out without picking a date.
 */
export function inferDue(text: string, today: string): string | null {
  const t = text.toLowerCase();
  const base = parse(today);
  const shift = (days: number) => dateStr(new Date(base.getFullYear(), base.getMonth(), base.getDate() + days));
  const fromParts = (month: number, day: number) => {
    let d = new Date(base.getFullYear(), month, day);
    if (d.getMonth() !== month) return null;
    if (daysBetween(today, dateStr(d)) < -180) d = new Date(base.getFullYear() + 1, month, day);
    return dateStr(d);
  };

  if (/\b(today|tonight)\b/.test(t)) return today;
  if (/\btomorrow\b/.test(t)) return shift(1);

  const named = t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (named) return fromParts(MONTHS.indexOf(named[1]), Number(named[2]));

  const slash = t.match(/\b(\d{1,2})\/(\d{1,2})\b/);
  if (slash && Number(slash[1]) >= 1 && Number(slash[1]) <= 12) return fromParts(Number(slash[1]) - 1, Number(slash[2]));

  const day = t.match(/\b(?:(next)\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (day) {
    let diff = (WEEKDAYS.indexOf(day[2]) - base.getDay() + 7) % 7;
    if (diff === 0 && day[1]) diff = 7;
    return shift(diff);
  }
  return null;
}

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

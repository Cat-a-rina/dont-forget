import type { Category, Item, Mode } from "./types";

export type Phase = "day" | "evening" | "night";

export function hourIn(now: Date, timeZone?: string): number {
  if (timeZone) {
    try {
      const h = new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone }).format(now);
      return Number(h) % 24;
    } catch {
      /* fall through to the device clock */
    }
  }
  return now.getHours();
}

export function phaseOf(now: Date, timeZone?: string): Phase {
  const h = hourIn(now, timeZone);
  if (h >= 22 || h < 5) return "night";
  if (h >= 17) return "evening";
  return "day";
}

export function orderLabel(mode: Mode, now: Date, timeZone?: string): string {
  if (mode === "manual") return "My order";
  if (mode === "date") return "By date";
  const p = phaseOf(now, timeZone);
  return p === "day" ? "Daytime" : p === "evening" ? "Evening" : "Night";
}

export function greeting(name: string, now: Date, timeZone?: string): string {
  if (!name.trim()) return "";
  const h = hourIn(now, timeZone);
  const p = phaseOf(now, timeZone);
  if (p === "night") return `Hi, ${name.trim()}`;
  return `Good ${p === "evening" ? "evening" : h < 12 ? "morning" : "afternoon"}, ${name.trim()}`;
}

/** Arrays sort stably, so ties keep the user's own category order. */
export function orderCategories(cats: Category[], items: Item[], mode: Mode, now: Date, timeZone?: string): Category[] {
  if (mode === "manual") return cats;
  if (mode === "time") {
    const evening = phaseOf(now, timeZone) !== "day";
    const rank = (c: Category) => {
      if (c.context === "leaving") return evening ? 2 : 0;
      if (c.context === "arriving") return evening ? 0 : 2;
      return 1;
    };
    return [...cats].sort((a, b) => rank(a) - rank(b));
  }
  const soonest = (c: Category) => {
    const dues = items.filter((i) => i.categoryId === c.id && i.due && !(i.repeat === "daily" && i.doneOn)).map((i) => i.due as string);
    return dues.length ? dues.sort()[0] : "9999-99-99";
  };
  return [...cats].sort((a, b) => soonest(a).localeCompare(soonest(b)));
}

export function orderItems(items: Item[], mode: Mode): Item[] {
  // Items keep the order the user gave them (the order of the saved list); date mode sorts by due date.
  if (mode !== "date") return [...items];
  return [...items].sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"));
}

import type { Category, Item, Mode } from "./types";

export function isEvening(now: Date): boolean {
  const h = now.getHours();
  return h >= 17 || h < 5;
}

export function orderLabel(mode: Mode, now: Date): string {
  if (mode === "manual") return "My order";
  if (mode === "date") return "By date";
  return isEvening(now) ? "Evening" : "Daytime";
}

/** Arrays sort stably, so ties keep the user's own category order. */
export function orderCategories(cats: Category[], items: Item[], mode: Mode, now: Date): Category[] {
  if (mode === "manual") return cats;
  if (mode === "time") {
    const evening = isEvening(now);
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
  const byCreated = [...items].sort((a, b) => a.createdAt - b.createdAt);
  if (mode !== "date") return byCreated;
  return byCreated.sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"));
}

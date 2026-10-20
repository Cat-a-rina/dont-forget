import type { AppState, Category, Completion, Context, Group, Item, Repeat } from "./types";
import { contextFor } from "./categorize";
import { daysBetween } from "./dates";

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function makeCategory(name: string, count: number, context: Context = contextFor(name)): Category {
  return { id: uid(), name, style: count, context, collapsed: false };
}

export function defaultRepeat(cat: Category | undefined): Repeat {
  return cat?.context ? "daily" : "once";
}

/** Merges groups by name (case-insensitive), drops empty ones, and finishes onboarding. */
export function seed(state: AppState, groups: Group[], today: string): AppState {
  const categories: Category[] = [...state.categories];
  const items: Item[] = [...state.items];
  let t = Date.now();
  for (const g of groups) {
    const name = g.name.trim();
    if (!name || g.items.length === 0) continue;
    let cat = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (!cat) {
      cat = makeCategory(name, categories.length);
      categories.push(cat);
    }
    for (const title of g.items) {
      items.push({
        id: uid(), title, categoryId: cat.id, repeat: defaultRepeat(cat), doneOn: null, due: null, createdAt: t++, steps: [],
      });
    }
  }
  return { ...state, onboarded: true, categories, items, lastOpened: today };
}

export function addItem(
  state: AppState,
  input: { title: string; categoryId: string | null; newCategory: string; repeat: Repeat; due: string | null },
): AppState {
  let categories = state.categories;
  let categoryId = input.categoryId;
  const newName = input.newCategory.trim();
  if (!categoryId || newName) {
    const name = newName || "Unsorted";
    const existing = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      categoryId = existing.id;
    } else {
      const cat = makeCategory(name, categories.length);
      categories = [...categories, cat];
      categoryId = cat.id;
    }
  }
  const item: Item = {
    id: uid(), title: input.title.trim(), categoryId, repeat: input.repeat, doneOn: null, due: input.due, createdAt: Date.now(), steps: [],
  };
  return { ...state, categories, items: [...state.items, item] };
}

export function completeItem(
  state: AppState, id: string, today: string,
): { state: AppState; completion: Completion; snapshot: Item; index: number } | null {
  const item = state.items.find((i) => i.id === id);
  if (!item) return null;
  const cat = state.categories.find((c) => c.id === item.categoryId);
  const completion: Completion = {
    id: uid(), itemId: item.id, title: item.title, categoryId: item.categoryId, categoryName: cat?.name ?? "Unsorted",
    repeat: item.repeat, at: Date.now(), steps: item.steps,
  };
  const items =
    item.repeat === "daily"
      ? state.items.map((i) => (i.id === id ? { ...i, doneOn: today } : i))
      : state.items.filter((i) => i.id !== id);
  return { state: { ...state, items, log: [...state.log, completion] }, completion, snapshot: item, index: state.items.indexOf(item) };
}

export function undoComplete(state: AppState, snapshot: Item, completionId: string, index: number): AppState {
  const rest = state.items.filter((i) => i.id !== snapshot.id);
  const at = Math.min(Math.max(index, 0), rest.length);
  return {
    ...state,
    items: [...rest.slice(0, at), snapshot, ...rest.slice(at)],
    log: state.log.filter((c) => c.id !== completionId),
  };
}

/** Chain step: the finished step moves into `steps` and the new step takes its place on the list. */
export function addNextStep(state: AppState, finished: Item, title: string): AppState {
  const next: Item = {
    ...finished, id: uid(), title: title.trim(), doneOn: null, due: null, createdAt: Date.now(), steps: [...finished.steps, finished.title],
  };
  return { ...state, items: [...state.items, next] };
}

export function uncheckDaily(state: AppState, id: string): AppState {
  return { ...state, items: state.items.map((i) => (i.id === id ? { ...i, doneOn: null } : i)) };
}

export function restoreFromHistory(state: AppState, completionId: string): AppState {
  const c = state.log.find((x) => x.id === completionId);
  if (!c || c.repeat === "daily") return state;
  let categories = state.categories;
  let cat = categories.find((x) => x.id === c.categoryId);
  if (!cat) {
    cat = { ...makeCategory(c.categoryName, categories.length), id: c.categoryId };
    categories = [...categories, cat];
  }
  const item: Item = {
    id: uid(), title: c.title, categoryId: cat.id, repeat: "once", doneOn: null, due: null, createdAt: Date.now(), steps: c.steps,
  };
  return { ...state, categories, items: [...state.items, item], log: state.log.filter((x) => x.id !== completionId) };
}

/** Runs once when the app is opened on a new day, even after many days away. */
export function dailyReset(state: AppState, today: string): AppState {
  return {
    ...state,
    lastOpened: today,
    items: state.items.map((i) => (i.repeat === "daily" && i.doneOn && daysBetween(i.doneOn, today) > 0 ? { ...i, doneOn: null } : i)),
  };
}

export function toggleCollapsed(state: AppState, categoryId: string): AppState {
  return { ...state, categories: state.categories.map((c) => (c.id === categoryId ? { ...c, collapsed: !c.collapsed } : c)) };
}

export function moveCategory(state: AppState, fromId: string, toId: string): AppState {
  if (fromId === toId) return state;
  const cats = [...state.categories];
  const from = cats.findIndex((c) => c.id === fromId);
  const to = cats.findIndex((c) => c.id === toId);
  if (from < 0 || to < 0) return state;
  const [moved] = cats.splice(from, 1);
  cats.splice(to, 0, moved);
  return { ...state, categories: cats };
}

/**
 * Drag-and-drop: move an item into a category (the same one to reorder). It goes before `beforeId`,
 * or to the end of the category when no id is given. List order is the order of `state.items`.
 */
export function moveItem(state: AppState, itemId: string, categoryId: string, beforeId?: string | null): AppState {
  const item = state.items.find((i) => i.id === itemId);
  if (!item || itemId === beforeId) return state;
  const rest = state.items.filter((i) => i.id !== itemId);
  let at = beforeId ? rest.findIndex((i) => i.id === beforeId) : -1;
  if (at < 0) {
    const last = rest.reduce((n, i, k) => (i.categoryId === categoryId ? k : n), -1);
    at = last < 0 ? rest.length : last + 1;
  }
  return { ...state, items: [...rest.slice(0, at), { ...item, categoryId }, ...rest.slice(at)] };
}

/** Adds previewed groups: matching lists are reused, the rest become new lists. Titles already on a list are skipped. */
export function importGroups(state: AppState, groups: Group[]): AppState {
  let next = state;
  for (const g of groups) {
    for (const title of g.items) {
      if (next.items.some((i) => i.title.toLowerCase() === title.toLowerCase())) continue;
      const existing = next.categories.find((c) => c.name.toLowerCase() === g.name.toLowerCase());
      next = addItem(next, {
        title, categoryId: existing?.id ?? null, newCategory: existing ? "" : g.name,
        repeat: defaultRepeat(existing ?? ({ context: contextFor(g.name) } as Category)), due: null,
      });
    }
  }
  return next;
}

/** Adds an empty list. Does nothing if a list with that name already exists. */
export function addList(state: AppState, name: string): AppState {
  const n = name.trim();
  if (!n || state.categories.some((c) => c.name.toLowerCase() === n.toLowerCase())) return state;
  return { ...state, categories: [...state.categories, makeCategory(n, state.categories.length)] };
}

/** Renames a list. Blank names and names already used by another list are ignored. */
export function renameCategory(state: AppState, id: string, name: string): AppState {
  const n = name.trim();
  if (!n || state.categories.some((c) => c.id !== id && c.name.toLowerCase() === n.toLowerCase())) return state;
  return {
    ...state,
    categories: state.categories.map((c) => (c.id === id ? { ...c, name: n } : c)),
    log: state.log.map((c) => (c.categoryId === id ? { ...c, categoryName: n } : c)),
  };
}

/** Renames an item. Blank titles are ignored. */
export function renameItem(state: AppState, id: string, title: string): AppState {
  const t = title.trim();
  if (!t) return state;
  return { ...state, items: state.items.map((i) => (i.id === id ? { ...i, title: t } : i)) };
}

import type { AppState } from "./types";
import { todayStr } from "./dates";

const KEY = "dont-forget:v1";
const BACKUP = `${KEY}:backup`;

/** Server snapshot while the browser's saved data hasn't been read yet. */
export const LOADING = "__loading__";

// `memory` mirrors what we last read/wrote so getRaw() returns a stable string between renders.
let memory: string | null | undefined;
let failed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      memory = undefined;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function getRaw(): string | null {
  if (memory === undefined) {
    try {
      memory = localStorage.getItem(KEY);
    } catch {
      memory = null;
      failed = true;
    }
  }
  return memory;
}

export const getFailed = () => failed;

export function freshState(): AppState {
  return { version: 1, onboarded: false, mode: "time", categories: [], items: [], log: [], lastOpened: todayStr() };
}

function valid(s: unknown): s is AppState {
  const x = s as AppState;
  return !!x && x.version === 1 && Array.isArray(x.categories) && Array.isArray(x.items) && Array.isArray(x.log);
}

function tryParse(raw: string | null): AppState | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    return valid(s) ? s : null;
  } catch {
    return null;
  }
}

export type Recovery = "backup" | "fresh" | null;

/** Parses saved data; if it is corrupt, falls back to the last good backup, then to a fresh start. */
export function parseState(raw: string | null): { state: AppState; recovered: Recovery } {
  if (raw === null) return { state: freshState(), recovered: null };
  const ok = tryParse(raw);
  if (ok) return { state: ok, recovered: null };
  let backup: string | null = null;
  try {
    backup = localStorage.getItem(BACKUP);
  } catch {
    /* ignore */
  }
  const restored = tryParse(backup);
  return restored ? { state: restored, recovered: "backup" } : { state: freshState(), recovered: "fresh" };
}

export function write(state: AppState) {
  const json = JSON.stringify(state);
  try {
    const prev = localStorage.getItem(KEY);
    if (tryParse(prev)) localStorage.setItem(BACKUP, prev as string);
    localStorage.setItem(KEY, json);
    failed = false;
  } catch {
    failed = true;
  }
  memory = json;
  emit();
}

export function exportData(): string {
  return JSON.stringify(parseState(getRaw()).state, null, 2);
}

export function clearAll() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(BACKUP);
  } catch {
    /* ignore */
  }
  memory = null;
  emit();
}

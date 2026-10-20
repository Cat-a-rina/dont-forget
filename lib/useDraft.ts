"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Drafts: whatever someone has typed into a form but not finished yet. They are kept in the
 * browser as they type, so closing a sheet, pressing Escape, or refreshing never loses the text.
 * Only text that differs from the empty form is stored.
 */
const PREFIX = "dont-forget:draft:";

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearDraft(key: string) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

export function clearDraftPrefix(prefix: string) {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIX + prefix)) localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

/** Like useState, but remembers the value in the browser. The third value is true if a saved draft was restored. */
export function usePersistedState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const empty = useRef(initial);
  const [value, setValue] = useState<T>(() => read<T>(key) ?? initial);
  const [restored] = useState(() => {
    const saved = read<T>(key);
    return saved !== null && JSON.stringify(saved) !== JSON.stringify(initial);
  });

  useEffect(() => {
    try {
      if (JSON.stringify(value) === JSON.stringify(empty.current)) localStorage.removeItem(PREFIX + key);
      else localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* storage unavailable: the page-level warning already tells the person */
    }
  }, [key, value]);

  return [value, setValue, restored];
}

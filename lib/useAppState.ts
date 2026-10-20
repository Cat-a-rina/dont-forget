"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { AppState } from "./types";
import { LOADING, getFailed, getRaw, parseState, subscribe, write } from "./storage";

export function useAppState() {
  const raw = useSyncExternalStore(subscribe, getRaw, () => LOADING);
  const failed = useSyncExternalStore(subscribe, getFailed, () => false);
  const parsed = useMemo(() => (raw === LOADING ? null : parseState(raw)), [raw]);

  const update = useCallback((fn: (s: AppState) => AppState) => {
    write(fn(parseState(getRaw()).state));
  }, []);

  return { state: parsed?.state ?? null, recovered: parsed?.recovered ?? null, failed, update };
}

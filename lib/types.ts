import type { Appearance } from "./appearance";

export type Mode = "time" | "date" | "manual";
export type Context = "leaving" | "arriving" | null;
export type Repeat = "daily" | "once";

export interface Category {
  id: string;
  name: string;
  /** index into the palette in lib/style.ts */
  style: number;
  context: Context;
  collapsed: boolean;
  /** cleared off the board; hidden but can be brought back from Settings */
  archived?: boolean;
}

export interface Item {
  id: string;
  title: string;
  categoryId: string;
  repeat: Repeat;
  /** local date (YYYY-MM-DD) a "daily" item was last completed */
  doneOn: string | null;
  /** local date (YYYY-MM-DD) */
  due: string | null;
  createdAt: number;
  /** titles of earlier chain steps, oldest first */
  steps: string[];
}

export interface Completion {
  id: string;
  itemId: string;
  title: string;
  categoryId: string;
  categoryName: string;
  repeat: Repeat;
  at: number;
  steps: string[];
}

export interface Profile {
  name: string;
  /** IANA zone like "America/Chicago"; empty means use the device's zone */
  timeZone: string;
  setupDone: boolean;
  /** false until the user dismisses the "you're all set" card after onboarding */
  welcomed: boolean;
}

export interface AppState {
  version: 1;
  onboarded: boolean;
  mode: Mode;
  categories: Category[];
  items: Item[];
  log: Completion[];
  lastOpened: string;
  profile: Profile;
  appearance: Appearance;
}

export interface Group {
  name: string;
  context: Context;
  items: string[];
}

export type Theme = "paper";
export type FontChoice = "storybook" | "rounded" | "typewriter" | "clean";
export type Layout = "sheet" | "cards" | "notebook" | "scrapbook";

export interface Appearance {
  theme: Theme;
  font: FontChoice;
  layout: Layout;
}

export const DEFAULT_APPEARANCE: Appearance = { theme: "paper", font: "storybook", layout: "sheet" };

export const THEMES: { id: Theme; label: string; hint: string; swatch: string[] }[] = [
  { id: "paper", label: "Paper", hint: "White paper, brown ink", swatch: ["#ffffff", "#4a3424", "#c4683a"] },
];

export const FONTS: { id: FontChoice; label: string; hint: string; family: string }[] = [
  { id: "storybook", label: "Storybook", hint: "Fraunces and Lora", family: "var(--font-fraunces), Georgia, serif" },
  { id: "rounded", label: "Rounded", hint: "Fredoka and Nunito", family: "var(--font-fredoka), system-ui, sans-serif" },
  { id: "typewriter", label: "Typewriter", hint: "Special Elite and Courier", family: "var(--font-elite), 'Courier New', monospace" },
  { id: "clean", label: "Clean", hint: "Geist, modern and plain", family: "var(--font-geist-sans), system-ui, sans-serif" },
];

export const LAYOUTS: { id: Layout; label: string; hint: string }[] = [
  { id: "sheet", label: "Sheet", hint: "Paper to-do lists with ruled lines" },
  { id: "cards", label: "Cards", hint: "Lists side by side" },
  { id: "notebook", label: "Notebook", hint: "One ruled page, top to bottom" },
  { id: "scrapbook", label: "Scrapbook", hint: "Taped, slightly tilted cards" },
];

/** Saved settings from an older version may name a look that no longer exists; fall back to the default. */
export function cleanAppearance(a?: Partial<Appearance>): Appearance {
  const pick = <T extends string>(list: { id: T }[], value: unknown, fallback: T): T =>
    list.some((x) => x.id === value) ? (value as T) : fallback;
  return {
    theme: pick(THEMES, a?.theme, DEFAULT_APPEARANCE.theme),
    font: pick(FONTS, a?.font, DEFAULT_APPEARANCE.font),
    layout: pick(LAYOUTS, a?.layout, DEFAULT_APPEARANCE.layout),
  };
}

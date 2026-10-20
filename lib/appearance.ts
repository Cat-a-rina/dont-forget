export type Theme = "paper" | "sage" | "blush" | "pumpkin" | "checker" | "midnight" | "classic";
export type FontChoice = "handwritten" | "rounded" | "storybook" | "typewriter" | "clean";
export type Layout = "sheet" | "cards" | "notebook" | "scrapbook";

export interface Appearance {
  theme: Theme;
  font: FontChoice;
  layout: Layout;
}

export const DEFAULT_APPEARANCE: Appearance = { theme: "paper", font: "handwritten", layout: "sheet" };

export const THEMES: { id: Theme; label: string; hint: string; swatch: string[] }[] = [
  { id: "paper", label: "Paper", hint: "White paper, brown ink", swatch: ["#ffffff", "#4a3424", "#c4683a"] },
  { id: "sage", label: "Sage", hint: "Soft green backdrop", swatch: ["#cfdca3", "#4d3d1c", "#7f9a3e"] },
  { id: "blush", label: "Blush", hint: "Pale pink backdrop", swatch: ["#f1dedb", "#5a3a32", "#d0707f"] },
  { id: "pumpkin", label: "Pumpkin", hint: "Warm cream, dotted lines", swatch: ["#fff7ee", "#7a4a24", "#e0793a"] },
  { id: "checker", label: "Checkerboard", hint: "Pink and green squares", swatch: ["#f7c6d9", "#d3e3a8", "#fbf0df"] },
  { id: "midnight", label: "Midnight", hint: "Dark plum with rose glow", swatch: ["#14121c", "#e08fb0", "#8fcf9a"] },
  { id: "classic", label: "Classic", hint: "Plain, follows your device", swatch: ["#ffffff", "#e8590c", "#1d4ed8"] },
];

export const FONTS: { id: FontChoice; label: string; hint: string; family: string }[] = [
  { id: "handwritten", label: "Handwritten", hint: "Caveat and Patrick Hand", family: "var(--font-caveat), cursive" },
  { id: "rounded", label: "Rounded", hint: "Fredoka and Nunito", family: "var(--font-fredoka), system-ui, sans-serif" },
  { id: "storybook", label: "Storybook", hint: "Fraunces and Lora", family: "var(--font-fraunces), Georgia, serif" },
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

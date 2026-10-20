/** Ready-made lists the user can add with one tap. */
export const SUGGESTED_LISTS = [
  "Leaving the house",
  "Groceries",
  "Kids",
  "Work",
  "Family",
  "Health",
  "Home",
  "Errands",
  "Pets",
  "School",
];

/** Suggestions not already used, compared without regard to case. */
export function unusedSuggestions(used: string[]): string[] {
  const taken = new Set(used.map((n) => n.trim().toLowerCase()));
  return SUGGESTED_LISTS.filter((s) => !taken.has(s.toLowerCase()));
}

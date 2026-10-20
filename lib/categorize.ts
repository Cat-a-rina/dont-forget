import type { Context, Group } from "./types";

interface Rule {
  name: string;
  context: Context;
  words: string[];
}

// Order matters: the first rule that matches wins.
const RULES: Rule[] = [
  { name: "Charging devices", context: "arriving", words: ["charging", "portable charger"] },
  {
    name: "Leaving the house",
    context: "leaving",
    words: [
      "keys", "key", "airpods", "water bottle", "phone", "student id", "wallet", "lip combo", "earrings",
      "necklace", "watch", "rings", "ipad", "computer", "laptop", "charger", "mouse", "headphones",
      "sunglasses", "umbrella",
    ],
  },
  { name: "Pets", context: null, words: ["litter", "vet", "dog", "cat", "pet", "feed"] },
  { name: "Maintenance", context: null, words: ["car", "oil", "repair", "fix", "filter", "tire", "bills", "maintenance"] },
  {
    name: "Family",
    context: null,
    words: ["mom", "mother", "dad", "brother", "sister", "family", "wedding", "rsvp", "birthday", "thanksgiving", "christmas", "flights", "grandma", "grandpa"],
  },
  { name: "Personal", context: null, words: ["friend", "brunch", "dinner", "lunch", "coffee", "call", "text"] },
  {
    name: "Assignments",
    context: null,
    words: ["homework", "assignment", "assignments", "exam", "quiz", "essay", "deadline", "deadlines", "internship", "study", "paper"],
  },
  { name: "Work", context: null, words: ["review", "pr", "meeting", "email", "report", "standup"] },
];

export const UNSORTED = "Unsorted";

export function contextFor(name: string): Context {
  if (/leav/i.test(name)) return "leaving";
  if (/charg|arriv|coming home/i.test(name)) return "arriving";
  return null;
}

function matchRule(line: string): Rule | null {
  const text = line.toLowerCase();
  for (const rule of RULES) {
    for (const w of rule.words) {
      if (new RegExp(`(^|[^a-z])${w}($|[^a-z])`).test(text)) return rule;
    }
  }
  return null;
}

/**
 * Turns a pasted brain-dump into groups. A line is a heading if it ends with ":" or exactly
 * names a known category. Everything else is an item: it goes under the latest heading, or
 * is matched by keyword, or lands in "Unsorted" (we never guess).
 */
export function parseDump(text: string, knownNames: string[] = []): Group[] {
  const headings = new Set([...RULES.map((r) => r.name), ...knownNames].map((n) => n.toLowerCase()));
  const groups = new Map<string, Group>();
  let current: string | null = null;

  const add = (name: string, item: string) => {
    const key = name.toLowerCase();
    let g = groups.get(key);
    if (!g) {
      g = { name, context: contextFor(name), items: [] };
      groups.set(key, g);
    }
    if (!g.items.some((i) => i.toLowerCase() === item.toLowerCase())) g.items.push(item);
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^[\s\-*•\d.)]+/, "").trim();
    if (!line) continue;
    const bare = line.replace(/:$/, "").trim();
    if (line.endsWith(":") || headings.has(bare.toLowerCase())) {
      const known = RULES.find((r) => r.name.toLowerCase() === bare.toLowerCase());
      current = known ? known.name : bare;
      continue;
    }
    add(current ?? matchRule(line)?.name ?? UNSORTED, line);
  }
  return [...groups.values()];
}

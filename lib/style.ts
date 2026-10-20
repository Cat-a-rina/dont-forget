/**
 * Every category gets a color AND a shape AND its name, so nothing relies on color alone.
 */
export const PALETTE = [
  { color: "var(--c0)", icon: "●" },
  { color: "var(--c1)", icon: "▲" },
  { color: "var(--c2)", icon: "■" },
  { color: "var(--c3)", icon: "◆" },
  { color: "var(--c4)", icon: "★" },
  { color: "var(--c5)", icon: "✚" },
  { color: "var(--c6)", icon: "⬢" },
  { color: "var(--c7)", icon: "☾" },
];

export function paletteAt(i: number) {
  return PALETTE[((i % PALETTE.length) + PALETTE.length) % PALETTE.length];
}

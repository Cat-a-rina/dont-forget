/**
 * Every category gets a color AND a shape AND its name, so nothing relies on color alone.
 */
export const PALETTE = [
  { color: "#c2410c", icon: "●" },
  { color: "#1d4ed8", icon: "▲" },
  { color: "#15803d", icon: "■" },
  { color: "#a21caf", icon: "◆" },
  { color: "#b45309", icon: "★" },
  { color: "#0f766e", icon: "✚" },
  { color: "#be123c", icon: "⬢" },
  { color: "#4338ca", icon: "☾" },
];

export function paletteAt(i: number) {
  return PALETTE[((i % PALETTE.length) + PALETTE.length) % PALETTE.length];
}

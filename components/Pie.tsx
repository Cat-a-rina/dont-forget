import type { Slice } from "@/lib/stats";
import { paletteAt } from "@/lib/style";

export default function Pie({ slices, total, size = 190 }: { slices: Slice[]; total: number; size?: number }) {
  const offsets = slices.map((_, i) => slices.slice(0, i).reduce((n, s) => n + (s.value / total) * 100, 0));
  return (
    <svg className="pie" style={{ width: size }} viewBox="0 0 42 42" role="img" aria-label={`${total} tasks completed`}>
      <circle cx="21" cy="21" r="15.9155" fill="none" style={{ stroke: "var(--line)" }} strokeWidth="8" />
      {slices.map((s, i) => {
        const pct = (s.value / total) * 100;
        return (
          <circle
            key={s.name}
            cx="21"
            cy="21"
            r="15.9155"
            fill="none"
            style={{ stroke: paletteAt(s.style).color }}
            strokeWidth="8"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeDashoffset={25 - offsets[i]}
          />
        );
      })}
      <text x="21" y="22.5" textAnchor="middle" className="pie-total">
        {total}
      </text>
    </svg>
  );
}

export function Legend({ slices }: { slices: Slice[] }) {
  return (
    <ul className="legend">
      {slices.map((s) => (
        <li key={s.name}>
          <span className="swatch" style={{ color: paletteAt(s.style).color }} aria-hidden>
            {paletteAt(s.style).icon}
          </span>
          <span>{s.name}</span>
          <strong>{s.value}</strong>
        </li>
      ))}
    </ul>
  );
}

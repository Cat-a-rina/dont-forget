import type { ReactNode } from "react";

/**
 * Little hand-drawn style icons, drawn here as simple SVG line art (brown ink, soft fills).
 * They are decoration only, so they are hidden from screen readers. Themes that don't use
 * them hide them with CSS (see --deco-display in globals.css).
 */
export type DoodleName = "flower" | "smiley" | "mushroom" | "pumpkin" | "leaf" | "sparkle" | "heart" | "bean";

const SHAPES: Record<DoodleName, ReactNode> = {
  flower: (
    <>
      <g fill="var(--d3)">
        <circle cx="24" cy="11" r="7" />
        <circle cx="36" cy="20" r="7" />
        <circle cx="31" cy="35" r="7" />
        <circle cx="17" cy="35" r="7" />
        <circle cx="12" cy="20" r="7" />
      </g>
      <circle cx="24" cy="24" r="6" fill="var(--d4)" />
    </>
  ),
  smiley: (
    <>
      <circle cx="24" cy="24" r="18" fill="var(--d4)" />
      <circle cx="17" cy="21" r="1.6" fill="var(--ink)" />
      <circle cx="31" cy="21" r="1.6" fill="var(--ink)" />
      <path d="M16 29 Q24 37 32 29" />
      <circle cx="12.5" cy="28" r="2.8" fill="var(--d3)" stroke="none" />
      <circle cx="35.5" cy="28" r="2.8" fill="var(--d3)" stroke="none" />
    </>
  ),
  mushroom: (
    <>
      <path d="M18 27 V38 Q24 43 30 38 V27" fill="var(--d4)" />
      <path d="M5 28 C5 9 43 9 43 28 Z" fill="var(--d1)" />
      <circle cx="15" cy="21" r="3" fill="var(--d4)" />
      <circle cx="26" cy="17" r="3" fill="var(--d4)" />
      <circle cx="35" cy="23" r="2.4" fill="var(--d4)" />
    </>
  ),
  pumpkin: (
    <>
      <ellipse cx="14" cy="30" rx="8" ry="12" fill="var(--d1)" />
      <ellipse cx="34" cy="30" rx="8" ry="12" fill="var(--d1)" />
      <ellipse cx="24" cy="30" rx="8.5" ry="13" fill="var(--d1)" />
      <path d="M24 17 Q23 10 28 7" />
      <circle cx="19" cy="29" r="1.5" fill="var(--ink)" />
      <circle cx="29" cy="29" r="1.5" fill="var(--ink)" />
      <path d="M21 34 Q24 37 27 34" />
    </>
  ),
  leaf: (
    <>
      <path d="M8 42 C16 30 26 18 40 8" />
      <path d="M19 31 C9 30 7 21 11 17 C20 17 23 24 19 31Z" fill="var(--d2)" />
      <path d="M28 22 C20 17 21 8 26 6 C33 10 33 17 28 22Z" fill="var(--d2)" />
      <path d="M33 18 C38 24 46 22 47 18 C43 13 36 13 33 18Z" fill="var(--d2)" />
    </>
  ),
  sparkle: <path d="M24 5 L28 20 L43 24 L28 28 L24 43 L20 28 L5 24 L20 20 Z" fill="var(--d4)" />,
  heart: <path d="M24 41 C5 28 8 11 18 11 C22 11 24 15 24 15 C24 15 26 11 30 11 C40 11 43 28 24 41Z" fill="var(--d3)" />,
  bean: (
    <>
      <path d="M11 40 C7 23 14 9 24 9 C34 9 41 23 37 40 Q24 45 11 40Z" fill="var(--d4)" />
      <circle cx="19" cy="22" r="1.7" fill="var(--ink)" />
      <circle cx="29" cy="22" r="1.7" fill="var(--ink)" />
      <circle cx="15" cy="27" r="2.8" fill="var(--d3)" stroke="none" />
      <circle cx="33" cy="27" r="2.8" fill="var(--d3)" stroke="none" />
      <path d="M21.5 27 Q24 30 26.5 27" />
      <path d="M28 33 h6 v5 h-6z" strokeDasharray="2 2" />
    </>
  ),
};

export default function Doodle({ name, size = 36, className }: { name: DoodleName; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="var(--ink)"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      {SHAPES[name]}
    </svg>
  );
}

/** A border of doodles, like the row along the top of a printed to-do page. */
export function DoodleRow({ names, className = "" }: { names: DoodleName[]; className?: string }) {
  return (
    <div className={`doodle-row ${className}`} aria-hidden>
      {names.map((n, i) => (
        <Doodle key={i} name={n} size={34} className="doodle-in-row" />
      ))}
    </div>
  );
}

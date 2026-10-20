import { PALETTE } from "@/lib/style";

export interface Piece {
  left: number;
  delay: number;
  dur: number;
  color: string;
  rot: number;
  size: number;
}

/** Random confetti. Call from an event handler or a state initializer, not during render. */
export function makePieces(n: number): Piece[] {
  return Array.from({ length: n }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    dur: 1.8 + Math.random() * 1.4,
    color: PALETTE[i % PALETTE.length].color,
    rot: 360 + Math.random() * 540,
    size: 6 + Math.random() * 7,
  }));
}

/** A one-time shower of confetti. Hidden for people who prefer reduced motion (see globals.css). */
export default function Confetti({ pieces }: { pieces: Piece[] }) {
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <i
          key={i}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            background: p.color,
            ["--dur" as string]: `${p.dur}s`,
            ["--delay" as string]: `${p.delay}s`,
            ["--rot" as string]: `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}

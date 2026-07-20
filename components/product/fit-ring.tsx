import type { ScoreBand } from "@/types/room";
import { cn } from "@/lib/utils";

/** Band → colour. Kept here so the ring, badges and score breakdown all read
 * from one place. Deliberately not the accent colour: fit is its own axis, and
 * a busy index shouldn't be a wall of brand-coloured rings. */
export const BAND_COLOR: Record<ScoreBand, string> = {
  strong: "#10b981",
  promising: "#f59e0b",
  long_shot: "#94a3b8",
};

type FitRingProps = {
  score: number;
  band: ScoreBand;
  size?: number;
  stroke?: number;
  className?: string;
};

/** A compact donut of the fit score, coloured by band. Pure SVG, no deps. */
export function FitRing({ score, band, size = 56, stroke = 5, className }: FitRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped / 100);
  const color = BAND_COLOR[band];

  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ft-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-bold tabular-nums text-[var(--ft-text)]"
          style={{ fontSize: size * 0.32 }}
        >
          {clamped}
        </span>
      </span>
    </span>
  );
}

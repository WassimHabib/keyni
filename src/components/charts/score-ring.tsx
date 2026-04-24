import { cn } from "@/lib/utils";
import { levelForScore } from "@/features/score/rules";
import type { ScoreLevelKey } from "@/features/score/types";

interface ScoreRingProps {
  value: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLevelLabel?: boolean;
}

const SIZE: Record<
  NonNullable<ScoreRingProps["size"]>,
  { outer: number; ring: number; stroke: number; font: number; subFont: number }
> = {
  sm: { outer: 72, ring: 60, stroke: 7, font: 18, subFont: 9 },
  md: { outer: 140, ring: 116, stroke: 10, font: 32, subFont: 10 },
  lg: { outer: 180, ring: 152, stroke: 12, font: 40, subFont: 11 },
};

const COLORS: Record<
  ScoreLevelKey,
  { start: string; end: string; bg: string; textColor: string }
> = {
  critique: {
    start: "#fb7185",
    end: "#ef4444",
    bg: "rgba(239, 68, 68, 0.12)",
    textColor: "#b91c1c",
  },
  modere: {
    start: "#fbbf24",
    end: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
    textColor: "#b45309",
  },
  bon: {
    start: "#34d399",
    end: "#10b981",
    bg: "rgba(16, 185, 129, 0.14)",
    textColor: "#047857",
  },
  excellent: {
    start: "#2dd4bf",
    end: "#14b8a6",
    bg: "rgba(20, 184, 166, 0.14)",
    textColor: "#0f766e",
  },
};

export function ScoreRing({
  value,
  label = "SCORE KEYNI",
  size = "md",
  className,
  showLevelLabel = false,
}: ScoreRingProps) {
  const dims = SIZE[size];
  const level = levelForScore(value);
  const palette = COLORS[level.key];
  const radius = dims.ring / 2 - dims.stroke / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, value)) / 100;
  const dashOffset = circumference * (1 - progress);

  const gradientId = `score-gradient-${size}-${level.key}`;

  return (
    <div
      className={cn("flex flex-col items-center gap-2", className)}
      style={{ width: dims.outer }}
    >
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: dims.outer,
          height: dims.outer,
          background: palette.bg,
        }}
      >
        <svg
          width={dims.ring}
          height={dims.ring}
          viewBox={`0 0 ${dims.ring} ${dims.ring}`}
          className="-rotate-90"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={palette.start} />
              <stop offset="100%" stopColor={palette.end} />
            </linearGradient>
          </defs>
          <circle
            cx={dims.ring / 2}
            cy={dims.ring / 2}
            r={radius}
            fill="#ffffff"
            stroke="rgba(255, 255, 255, 0.7)"
            strokeWidth={dims.stroke}
          />
          <circle
            cx={dims.ring / 2}
            cy={dims.ring / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={dims.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 700ms ease-out" }}
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
          style={{ color: palette.textColor }}
        >
          <span
            className="font-semibold uppercase tracking-wider"
            style={{ fontSize: dims.subFont }}
          >
            Score
          </span>
          <span
            className="font-bold leading-none"
            style={{ fontSize: dims.font }}
          >
            {value}
            <span className="text-[60%] font-semibold">/100</span>
          </span>
        </div>
      </div>
      <span
        className="font-semibold uppercase tracking-wider"
        style={{ fontSize: dims.subFont, color: palette.textColor }}
      >
        {label}
      </span>
      {showLevelLabel ? (
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-semibold shadow-card"
          style={{ color: palette.textColor }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: palette.end }}
          />
          Niveau {level.label.toLowerCase()}
        </span>
      ) : null}
    </div>
  );
}

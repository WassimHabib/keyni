import type { LucideIcon } from "lucide-react";
import { Info, TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

import { MiniChart } from "./mini-chart";

interface KpiCardProps {
  icon: LucideIcon;
  iconBg?: string;
  title: string;
  value: string;
  deltaLabel?: string;
  deltaDirection?: "up" | "down" | "flat";
  deltaTone?: "positive" | "negative" | "neutral";
  chart: "bar" | "line" | "area";
  chartColor?: string;
  chartData: number[];
  hint?: string;
}

const DELTA_TONE_CLASS: Record<
  NonNullable<KpiCardProps["deltaTone"]>,
  string
> = {
  positive: "text-success",
  negative: "text-danger",
  neutral: "text-text-secondary",
};

export function KpiCard({
  icon: Icon,
  iconBg = "var(--color-primary-soft)",
  title,
  value,
  deltaLabel,
  deltaDirection,
  deltaTone = "neutral",
  chart,
  chartColor,
  chartData,
  hint,
}: KpiCardProps) {
  const DeltaIcon =
    deltaDirection === "up"
      ? TrendingUp
      : deltaDirection === "down"
        ? TrendingDown
        : null;

  return (
    <article className="flex h-full flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-card">
      <header className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: iconBg, color: chartColor }}
            aria-hidden
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium text-text-secondary">
            {title}
          </span>
        </div>
        {hint ? (
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-text-muted"
            title={hint}
          >
            <Info className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </header>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-text-primary">{value}</span>
      </div>

      {deltaLabel ? (
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            DELTA_TONE_CLASS[deltaTone],
          )}
        >
          {DeltaIcon ? <DeltaIcon className="h-3.5 w-3.5" /> : null}
          <span>{deltaLabel}</span>
        </div>
      ) : null}

      <div className="mt-auto">
        <MiniChart data={chartData} variant={chart} color={chartColor} />
      </div>
    </article>
  );
}

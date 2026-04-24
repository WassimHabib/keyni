"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
} from "recharts";

interface MiniChartProps {
  data: number[];
  variant?: "bar" | "line" | "area";
  color?: string;
  height?: number;
}

export function MiniChart({
  data,
  variant = "line",
  color = "var(--color-primary)",
  height = 48,
}: MiniChartProps) {
  const formatted = data.map((v, i) => ({ index: i, value: v }));

  if (variant === "bar") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={formatted}>
          <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (variant === "area") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={formatted}>
          <defs>
            <linearGradient id="mini-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill="url(#mini-area)"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatted}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.2}
          dot={{ fill: color, r: 2 }}
          activeDot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface BarChartComponentProps {
  data: { name: string; value: number; fill?: string }[];
  config: ChartConfig;
  dataKey?: string;
  barColor?: string;
}

export function BarChartComponent({
  data,
  config,
  dataKey = "value",
  barColor,
}: BarChartComponentProps) {
  const fill = barColor ?? "var(--color-primary)";
  // With many thin bars the value labels collide with their neighbours; the tooltip still shows them.
  const showLabels = data.length <= 12;

  return (
    <ChartContainer config={config} className="w-full h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 16, bottom: 0, left: -16 }} barCategoryGap="25%">
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border/40"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent />}
          />
          <Bar
            dataKey={dataKey}
            radius={[4, 4, 0, 0]}
            maxBarSize={80}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill ?? fill} />
            ))}
            {showLabels && (
              <LabelList
                dataKey={dataKey}
                position="top"
                className="fill-foreground text-sm font-semibold"
                offset={8}
                // Revenue sums come back with float noise (53.68000000000001): show at most 2 decimals.
                formatter={(v: unknown) => (typeof v === "number" ? Math.round(v * 100) / 100 : String(v ?? ""))}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

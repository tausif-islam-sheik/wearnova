"use client";

import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface DonutChartProps {
  data: { name: string; value: number; fill: string }[];
  config: ChartConfig;
  innerLabel?: string;
  innerSublabel?: string;
}

export function DonutChart({ data, config, innerLabel, innerSublabel }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ChartContainer config={config} className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => {
                  const pct = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : "0";
                  return [`${value} (${pct}%)`, name];
                }}
              />
            }
          />
          {innerLabel && (
            <text
              x="50%"
              y="42%"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-foreground text-2xl font-bold"
            >
              {innerLabel}
            </text>
          )}
          {innerSublabel && (
            <text
              x="50%"
              y="52%"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-muted-foreground text-xs"
            >
              {innerSublabel}
            </text>
          )}
          <Legend
            verticalAlign="bottom"
            height={40}
            formatter={(value: string) => {
              const item = data.find((d) => d.name === value);
              const count = item?.value ?? 0;
              const pct = total > 0 ? ((count / total) * 100).toFixed(0) : "0";
              return (
                <span className="text-xs text-muted-foreground ml-1">
                  {value} — {pct}%
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

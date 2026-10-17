"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface PieChartComponentProps {
  data: { name: string; value: number; fill?: string }[];
  config: ChartConfig;
  dataKey?: string;
  nameKey?: string;
  height?: number;
}

export function PieChartComponent({
  data,
  config,
  dataKey = "value",
  nameKey = "name",
  height = 240,
}: PieChartComponentProps) {
  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

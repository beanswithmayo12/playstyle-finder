"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { METRIC_KEYS, type MetricVector } from "@/lib/metrics";
import { METRIC_LABELS } from "./metric-labels";

export function RadarCompare({
  athlete,
  pro,
  proName,
}: {
  athlete: MetricVector;
  pro: MetricVector;
  proName: string;
}) {
  const data = METRIC_KEYS.map((k) => ({
    metric: METRIC_LABELS[k],
    you: athlete[k],
    pro: pro[k],
  }));

  return (
    <ResponsiveContainer width="100%" height={380}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="#3f3f46" />
        <PolarAngleAxis dataKey="metric" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
        <Radar
          name={proName}
          dataKey="pro"
          stroke="#71717a"
          fill="#71717a"
          fillOpacity={0.25}
        />
        <Radar name="You" dataKey="you" stroke="#10b981" fill="#10b981" fillOpacity={0.35} />
        <Legend wrapperStyle={{ color: "#a1a1aa", fontSize: 12 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

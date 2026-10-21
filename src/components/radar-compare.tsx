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
        <PolarGrid stroke="var(--rule)" />
        <PolarAngleAxis dataKey="metric" tick={{ fill: "var(--soft)", fontSize: 11 }} />
        <Radar
          name={proName}
          dataKey="pro"
          stroke="var(--cobalt)"
          fill="var(--cobalt)"
          fillOpacity={0.25}
        />
        <Radar name="You" dataKey="you" stroke="var(--ink)" fill="var(--ink)" fillOpacity={0.3} />
        <Legend wrapperStyle={{ color: "var(--soft)", fontSize: 12 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

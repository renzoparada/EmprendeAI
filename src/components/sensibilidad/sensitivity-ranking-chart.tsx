"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SensitivityImpact } from "@/lib/engine/sensitivity";

export function SensitivityRankingChart({ data }: { data: SensitivityImpact[] }) {
  const chartData = data.map((d) => ({ ...d, absImpact: Math.abs(d.impactPctOnUtilidad) }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => `${v}%`} axisLine={{ stroke: "#e2e8f0" }} />
        <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11, fill: "#334155" }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(_value, _name, item) => [`${(item.payload as SensitivityImpact).impactPctOnUtilidad.toFixed(1)}%`, "Impacto en Utilidad Neta"]} />
        <Bar dataKey="absImpact" radius={[0, 4, 4, 0]}>
          {chartData.map((d) => (
            <Cell key={d.variable} fill={d.impactPctOnUtilidad >= 0 ? "#10b981" : "#ef4444"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

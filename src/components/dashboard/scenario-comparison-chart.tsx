"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

export interface ScenarioChartPoint {
  name: string;
  ventas: number;
  utilidadNeta: number;
}

export function ScenarioComparisonChart({ data, currency }: { data: ScenarioChartPoint[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatCurrency(Number(v), currency)}
          width={90}
        />
        <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="ventas" name="Ventas" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="utilidadNeta" name="Utilidad Neta" fill="#0f172a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

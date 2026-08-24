"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SimulationMonthResult } from "@/lib/engine/business-simulator";
import { formatCurrency } from "@/lib/utils";

export function SimulationChart({ results, currency }: { results: SimulationMonthResult[]; currency: string }) {
  const data = results.map((r) => ({ month: `M${r.month}`, ventas: r.ventas, utilidadNeta: r.utilidadNeta, flujoAcumulado: r.flujoAcumulado }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(Number(v), currency)} width={90} />
        <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="ventas" name="Ventas" stroke="#10b981" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="utilidadNeta" name="Utilidad Neta" stroke="#0f172a" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="flujoAcumulado" name="Flujo Acumulado" stroke="#2563eb" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

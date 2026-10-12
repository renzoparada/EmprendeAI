"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TemporalPoint } from "@/lib/engine/temporal-benchmark";
import { formatCurrency, formatPercent } from "@/lib/utils";

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function periodLabel(point: TemporalPoint): string {
  return `${MONTH_LABELS[point.month - 1]} ${String(point.year).slice(2)}`;
}

export function TemporalChart({ points, currency, kind = "currency" }: { points: TemporalPoint[]; currency: string; kind?: "currency" | "percent" }) {
  const format = (v: number) => (kind === "percent" ? formatPercent(v) : formatCurrency(v, currency));
  const data = points.map((p) => ({ label: periodLabel(p), value: p.value }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => format(Number(v))} width={70} />
        <Tooltip formatter={(value) => format(Number(value))} />
        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

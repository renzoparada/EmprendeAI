"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PriceCurvePoint } from "@/lib/engine/pricing";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function MiniChart({
  data,
  dataKey,
  label,
  color,
  currency,
  currentPrice,
  valueFormatter,
}: {
  data: PriceCurvePoint[];
  dataKey: keyof PriceCurvePoint;
  label: string;
  color: string;
  currency: string;
  currentPrice: number;
  valueFormatter: (v: number) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-slate-700">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="price"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickFormatter={(v) => formatCurrency(Number(v), currency)}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={50} tickFormatter={valueFormatter} />
            <Tooltip
              formatter={(value) => valueFormatter(Number(value))}
              labelFormatter={(v) => `Precio: ${formatCurrency(Number(v), currency)}`}
            />
            <ReferenceLine x={currentPrice} stroke="#94a3b8" strokeDasharray="4 4" />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function PriceCurveCharts({
  data,
  currency,
  currentPrice,
}: {
  data: PriceCurvePoint[];
  currency: string;
  currentPrice: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <MiniChart
        data={data}
        dataKey="demand"
        label="Precio vs. Demanda"
        color="#0f172a"
        currency={currency}
        currentPrice={currentPrice}
        valueFormatter={(v) => v.toFixed(0)}
      />
      <MiniChart
        data={data}
        dataKey="revenue"
        label="Precio vs. Ingresos"
        color="#2563eb"
        currency={currency}
        currentPrice={currentPrice}
        valueFormatter={(v) => formatCurrency(v, currency)}
      />
      <MiniChart
        data={data}
        dataKey="profit"
        label="Precio vs. Utilidad"
        color="#10b981"
        currency={currency}
        currentPrice={currentPrice}
        valueFormatter={(v) => formatCurrency(v, currency)}
      />
      <MiniChart
        data={data}
        dataKey="marginPct"
        label="Precio vs. Margen"
        color="#d97706"
        currency={currency}
        currentPrice={currentPrice}
        valueFormatter={(v) => `${v.toFixed(0)}%`}
      />
    </div>
  );
}

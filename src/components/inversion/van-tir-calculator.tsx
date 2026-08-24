"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { computeIRR, computeNPV } from "@/lib/engine/financial";
import { projectWithGrowth } from "@/lib/engine/projection";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatPercent } from "@/lib/utils";

/**
 * VAN/TIR (fórmula 21.4, spec §5) — el MVP no proyecta flujo de caja
 * año a año, así que se proyecta el flujo mensual actual × 12 con una tasa
 * de crecimiento anual y se descuenta a una tasa editable. Ambos supuestos
 * quedan explícitos y editables en línea (spec §23.9), nunca ocultos.
 */
export function VanTirCalculator({
  baseAnnualCashFlow,
  inversionTotal,
  currency,
}: {
  baseAnnualCashFlow: number;
  inversionTotal: number;
  currency: string;
}) {
  const [discountRatePct, setDiscountRatePct] = useState(15);
  const [growthRatePct, setGrowthRatePct] = useState(5);
  const [years, setYears] = useState(5);

  const projectedCashFlows = useMemo(
    () => projectWithGrowth(baseAnnualCashFlow, growthRatePct, years),
    [baseAnnualCashFlow, growthRatePct, years]
  );

  const npv = useMemo(() => computeNPV(projectedCashFlows, discountRatePct, inversionTotal), [projectedCashFlows, discountRatePct, inversionTotal]);
  const irr = useMemo(() => computeIRR(projectedCashFlows, inversionTotal), [projectedCashFlows, inversionTotal]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-900">VAN y TIR</CardTitle>
        <CardDescription>
          Proyecta tu flujo de caja mensual actual (×12) a {years} años con los supuestos de abajo — editables, marcados como supuesto (spec §0.3/§5).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="discountRate" className="text-xs">
              Tasa de descuento anual (%)
            </Label>
            <Input id="discountRate" type="number" step="0.5" value={discountRatePct} onChange={(e) => setDiscountRatePct(Number(e.target.value))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="growthRate" className="text-xs">
              Crecimiento anual proyectado (%)
            </Label>
            <Input id="growthRate" type="number" step="0.5" value={growthRatePct} onChange={(e) => setGrowthRatePct(Number(e.target.value))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="years" className="text-xs">
              Horizonte (años)
            </Label>
            <Input id="years" type="number" step="1" min={1} max={10} value={years} onChange={(e) => setYears(Number(e.target.value))} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">VAN (Valor Actual Neto)</p>
            <p className={`text-lg font-semibold ${npv >= 0 ? "text-emerald-700" : "text-red-600"}`}>{formatCurrency(npv, currency)}</p>
            <p className="mt-1 text-xs text-slate-400">{npv >= 0 ? "Positivo: el proyecto crea valor a esta tasa de descuento." : "Negativo: a esta tasa, el proyecto destruye valor."}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">TIR (Tasa Interna de Retorno)</p>
            <p className="text-lg font-semibold text-slate-900">{irr != null ? formatPercent(irr) : "No calculable"}</p>
            <p className="mt-1 text-xs text-slate-400">
              {irr != null ? "La tasa de descuento que hace VAN = 0 con estos flujos proyectados." : "No hay cambio de signo en los flujos proyectados."}
            </p>
          </div>
        </div>
        <Link href="/metodologia#VALOR_DINERO_TIEMPO" className="inline-block text-xs font-medium text-emerald-700 hover:underline">
          Ver metodología →
        </Link>
      </CardContent>
    </Card>
  );
}

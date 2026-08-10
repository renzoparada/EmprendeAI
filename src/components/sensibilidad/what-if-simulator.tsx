"use client";

import { useMemo, useState } from "react";
import { buildCompanySnapshot, computeRoi, type EngineFixedCost, type EngineProduct, type EngineVariableCost } from "@/lib/engine/financial";
import { applyScenario } from "@/lib/engine/scenarios";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className={value === 0 ? "text-slate-400" : value > 0 ? "text-emerald-700" : "text-red-600"}>
          {value > 0 ? "+" : ""}
          {value}%
        </span>
      </div>
      <input type="range" min={-50} max={50} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-emerald-600" />
    </div>
  );
}

export function WhatIfSimulator({
  products,
  fixedCosts,
  variableCosts,
  taxRatePct,
  currency,
  inversionTotal,
}: {
  products: EngineProduct[];
  fixedCosts: EngineFixedCost[];
  variableCosts: EngineVariableCost[];
  taxRatePct: number;
  currency: string;
  inversionTotal: number;
}) {
  const [priceDeltaPct, setPriceDeltaPct] = useState(0);
  const [salesDeltaPct, setSalesDeltaPct] = useState(0);
  const [costDeltaPct, setCostDeltaPct] = useState(0);

  const baseSnapshot = useMemo(() => buildCompanySnapshot(products, variableCosts, fixedCosts, taxRatePct), [products, variableCosts, fixedCosts, taxRatePct]);

  const simulatedSnapshot = useMemo(() => {
    const adjusted = applyScenario({ products, fixedCosts, variableCosts }, { type: "BASE", priceDeltaPct, salesDeltaPct, costDeltaPct });
    return buildCompanySnapshot(adjusted.products, adjusted.variableCosts, adjusted.fixedCosts, taxRatePct);
  }, [products, fixedCosts, variableCosts, taxRatePct, priceDeltaPct, salesDeltaPct, costDeltaPct]);

  const baseRoi = computeRoi(baseSnapshot.statement.utilidadNeta, inversionTotal);
  const simulatedRoi = computeRoi(simulatedSnapshot.statement.utilidadNeta, inversionTotal);

  const reset = () => {
    setPriceDeltaPct(0);
    setSalesDeltaPct(0);
    setCostDeltaPct(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-900">Simulador What-If</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Slider label="Precio" value={priceDeltaPct} onChange={setPriceDeltaPct} />
          <Slider label="Ventas (unidades)" value={salesDeltaPct} onChange={setSalesDeltaPct} />
          <Slider label="Costos (fijos y variables)" value={costDeltaPct} onChange={setCostDeltaPct} />
        </div>
        <button type="button" onClick={reset} className="self-start text-xs font-medium text-emerald-700 hover:underline">
          Restablecer
        </button>

        <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Utilidad Neta</p>
            <p className="text-lg font-semibold text-slate-900">{formatCurrency(simulatedSnapshot.statement.utilidadNeta, currency)}</p>
            <p className="text-xs text-slate-400">antes: {formatCurrency(baseSnapshot.statement.utilidadNeta, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">ROI</p>
            <p className="text-lg font-semibold text-slate-900">{formatPercent(simulatedRoi)}</p>
            <p className="text-xs text-slate-400">antes: {formatPercent(baseRoi)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Flujo de Caja (mes)</p>
            <p className={`text-lg font-semibold ${simulatedSnapshot.cashFlow.flujoNeto < 0 ? "text-red-600" : "text-slate-900"}`}>
              {formatCurrency(simulatedSnapshot.cashFlow.flujoNeto, currency)}
            </p>
            <p className="text-xs text-slate-400">antes: {formatCurrency(baseSnapshot.cashFlow.flujoNeto, currency)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

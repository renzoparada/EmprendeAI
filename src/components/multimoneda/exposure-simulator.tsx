"use client";

import { useCallback, useMemo, useState } from "react";
import type { CostOrigin } from "@prisma/client";
import { buildCompanySnapshot, type EngineFixedCost, type EngineProduct, type EngineVariableCost } from "@/lib/engine/financial";
import { applyImportCosts } from "@/lib/mappers";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const SHOCK_STEPS = [-30, -20, -10, 0, 10, 20, 30];

export function ExposureSimulator({
  engineProducts,
  productsMeta,
  importCosts,
  ratesByCurrency,
  fixedCosts,
  variableCosts,
  taxRatePct,
  currency,
}: {
  engineProducts: EngineProduct[];
  productsMeta: { id: string; costOrigin: CostOrigin }[];
  importCosts: {
    productId: string;
    originCurrency: string;
    fobCost: number;
    freight: number;
    insurance: number;
    tariffPct: number;
    nationalizationFees: number;
    bankFee: number;
    quantity: number;
    createdAt: string;
  }[];
  ratesByCurrency: Record<string, number>;
  fixedCosts: EngineFixedCost[];
  variableCosts: EngineVariableCost[];
  taxRatePct: number;
  currency: string;
}) {
  const [shockPct, setShockPct] = useState(0);

  const importCostRecords = useMemo(() => importCosts.map((ic) => ({ ...ic, createdAt: new Date(ic.createdAt) })), [importCosts]);

  const buildSnapshot = useCallback(
    (shock: number) => {
      const adjustedProducts = applyImportCosts(engineProducts, productsMeta, importCostRecords, ratesByCurrency, shock);
      return buildCompanySnapshot(adjustedProducts, variableCosts, fixedCosts, taxRatePct);
    },
    [engineProducts, productsMeta, importCostRecords, ratesByCurrency, variableCosts, fixedCosts, taxRatePct]
  );

  const baseSnapshot = useMemo(() => buildSnapshot(0), [buildSnapshot]);
  const simulatedSnapshot = useMemo(() => buildSnapshot(shockPct), [buildSnapshot, shockPct]);

  const strip = useMemo(
    () =>
      SHOCK_STEPS.map((s) => ({
        shockPct: s,
        utilidadNeta: buildSnapshot(s).statement.utilidadNeta,
      })),
    [buildSnapshot]
  );
  const maxAbs = Math.max(1, ...strip.map((s) => Math.abs(s.utilidadNeta)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-900">Simulador de riesgo cambiario</CardTitle>
        <CardDescription>¿Qué pasa si el tipo de cambio sube o baja? Impacto inmediato en costo variable y utilidad (spec §15.3).</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">Variación del tipo de cambio</span>
            <span className={shockPct === 0 ? "text-slate-400" : shockPct > 0 ? "text-red-600" : "text-emerald-700"}>
              {shockPct > 0 ? "+" : ""}
              {shockPct}%
            </span>
          </div>
          <input type="range" min={-30} max={30} step={1} value={shockPct} onChange={(e) => setShockPct(Number(e.target.value))} className="w-full accent-emerald-600" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">Utilidad Neta simulada</p>
            <p className="text-lg font-semibold text-slate-900">{formatCurrency(simulatedSnapshot.statement.utilidadNeta, currency)}</p>
            <p className="text-xs text-slate-400">antes: {formatCurrency(baseSnapshot.statement.utilidadNeta, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Margen Neto simulado</p>
            <p className="text-lg font-semibold text-slate-900">{formatPercent(simulatedSnapshot.statement.margenNetoPct)}</p>
            <p className="text-xs text-slate-400">antes: {formatPercent(baseSnapshot.statement.margenNetoPct)}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-slate-600">Mapa de calor: Tipo de Cambio × Utilidad</p>
          <div className="grid grid-cols-7 gap-1">
            {strip.map((s) => {
              const ratio = Math.min(1, Math.abs(s.utilidadNeta) / maxAbs);
              const bg = s.utilidadNeta >= 0 ? `rgba(16,185,129,${0.15 + ratio * 0.6})` : `rgba(239,68,68,${0.15 + ratio * 0.6})`;
              return (
                <div key={s.shockPct} className="rounded p-2 text-center text-[10px]" style={{ backgroundColor: bg }}>
                  <p className="font-medium text-slate-700">
                    {s.shockPct > 0 ? "+" : ""}
                    {s.shockPct}%
                  </p>
                  <p className="mt-1 text-slate-800">{formatCurrency(s.utilidadNeta, currency)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

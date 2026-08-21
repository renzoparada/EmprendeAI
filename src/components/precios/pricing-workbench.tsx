"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PricePoint, Product } from "@prisma/client";
import {
  breakEvenPrice,
  buildPriceCurveSeries,
  computeElasticity,
  fitLinearDemandCurve,
  minPrice,
  profitMaximizingPrice,
  psychologicalPrice,
  revenueMaximizingPrice,
  targetPrice,
} from "@/lib/engine/pricing";
import { computeProductEconomics } from "@/lib/engine/financial";
import { KpiCard } from "@/components/shared/kpi-card";
import { PriceCurveCharts } from "@/components/precios/price-curve-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/utils";

export function PricingWorkbench({
  product,
  pricePoints,
  unitVariableCost,
  totalFixedCostsMonthly,
  currency,
}: {
  product: Product;
  pricePoints: PricePoint[];
  unitVariableCost: number;
  totalFixedCostsMonthly: number;
  currency: string;
}) {
  const [targetMarginPct, setTargetMarginPct] = useState(30);
  const [competitorPrice, setCompetitorPrice] = useState<number | "">("");

  const curve = useMemo(
    () => fitLinearDemandCurve(pricePoints.map((p) => ({ price: p.price, quantity: p.quantity }))),
    [pricePoints]
  );

  const elasticity = useMemo(
    () => (curve ? computeElasticity(curve, product.price, product.unitsSoldMonthly || 1) : null),
    [curve, product.price, product.unitsSoldMonthly]
  );

  const pMin = minPrice(unitVariableCost);
  const pBreakEven = breakEvenPrice(unitVariableCost, totalFixedCostsMonthly, product.unitsSoldMonthly);
  const pTarget = targetPrice(unitVariableCost, targetMarginPct);
  const pRevenueOpt = curve ? revenueMaximizingPrice(curve) : null;
  const pProfitOpt = curve ? profitMaximizingPrice(curve, unitVariableCost) : null;
  const pPsychological = psychologicalPrice(pProfitOpt ?? product.price);

  const currentEconomics = computeProductEconomics(product, []);

  const series = useMemo(() => {
    if (!curve) return [];
    const prices = [pMin, pBreakEven, product.price, pRevenueOpt ?? product.price, pProfitOpt ?? product.price].filter(
      (p) => Number.isFinite(p) && p > 0
    );
    const min = Math.max(0, Math.min(...prices) * 0.5);
    const max = Math.max(...prices) * 1.5;
    return buildPriceCurveSeries(curve, unitVariableCost, { min, max, steps: 40 });
  }, [curve, pMin, pBreakEven, pRevenueOpt, pProfitOpt, product.price, unitVariableCost]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">{product.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Precio actual</p>
            <p className="text-lg font-semibold text-slate-900">{formatCurrency(product.price, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Margen actual</p>
            <p className="text-lg font-semibold text-slate-900">{formatPercent(currentEconomics.unitMarginPct)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Elasticidad</p>
            {elasticity ? (
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-slate-900">{elasticity.value.toFixed(2)}</p>
                <Badge variant={elasticity.classification === "elastica" ? "warning" : "secondary"}>
                  {elasticity.classification === "elastica" ? "Elástica" : elasticity.classification === "unitaria" ? "Unitaria" : "Inelástica"}
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Carga ≥2 datos históricos para calcularla</p>
            )}
            <Link href="/metodologia#ELASTICIDAD_PRECIO" className="mt-1 inline-block text-xs font-medium text-emerald-700 hover:underline">
              Ver metodología →
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Precio mínimo"
          value={formatCurrency(pMin, currency)}
          explanation={{
            meaning: "El precio más bajo que puedes cobrar sin perder dinero por unidad.",
            why: "Es tu límite absoluto — por debajo de este precio, cada venta te cuesta dinero.",
            howCalculated: "Precio Mínimo = Costo Variable Unitario (spec §6).",
            isGoodOrBad: "No aplica bien/mal — es un piso de referencia.",
            whatToDo: "Úsalo solo en promociones puntuales, nunca como precio de lista sostenido.",
          }}
        />
        <KpiCard
          label="Precio de equilibrio"
          value={Number.isFinite(pBreakEven) ? formatCurrency(pBreakEven, currency) : "—"}
          explanation={{
            meaning: "El precio que, al volumen actual de ventas, cubre costo variable y costos fijos sin utilidad.",
            why: "Te dice el piso realista considerando también tus gastos fijos, no solo el costo del producto.",
            howCalculated: "Precio de Equilibrio = Costo Variable Unitario + (Costos Fijos / Unidades vendidas al mes).",
            isGoodOrBad: "Tu precio de lista debería estar claramente por encima de este valor.",
            whatToDo: "Si tu precio actual está cerca de este número, tu margen de maniobra es bajo.",
          }}
        />
        <div className="flex flex-col gap-2">
          <Label htmlFor="target-margin" className="text-xs text-slate-500">
            Margen objetivo (%)
          </Label>
          <Input
            id="target-margin"
            type="number"
            min={0}
            max={99}
            value={targetMarginPct}
            onChange={(e) => setTargetMarginPct(Number(e.target.value))}
            className="h-9 w-28"
          />
          <KpiCard
            label="Precio objetivo"
            value={Number.isFinite(pTarget) ? formatCurrency(pTarget, currency) : "—"}
            explanation={{
              meaning: "El precio necesario para alcanzar el margen % que definiste arriba.",
              why: "Traduce una meta de rentabilidad en un precio de venta concreto.",
              howCalculated: "Precio Objetivo = Costo Variable Unitario / (1 − Margen Objetivo %).",
              isGoodOrBad: "Compáralo con lo que el mercado está dispuesto a pagar.",
              whatToDo: "Si es mucho más alto que tu precio actual o el de la competencia, revisa costos o el margen objetivo.",
            }}
          />
        </div>
        <KpiCard
          label="Precio óptimo (ingresos)"
          value={pRevenueOpt ? formatCurrency(pRevenueOpt, currency) : "—"}
          helperText={!curve ? "Requiere curva de demanda" : undefined}
          explanation={{
            meaning: "El precio que maximiza tus ingresos totales (Precio × Cantidad), según tu curva de demanda.",
            why: "Útil si tu objetivo es maximizar facturación (por ejemplo, para ganar participación de mercado).",
            howCalculated: "Máximo de Ingresos(P) = P × (a + b×P), con (a,b) de la curva de demanda ajustada.",
            isGoodOrBad: "No siempre coincide con el precio que maximiza utilidad — revisa ambos.",
            whatToDo: "Compáralo con el precio óptimo de utilidad antes de decidir.",
          }}
        />
        <KpiCard
          label="Precio óptimo (utilidad)"
          value={pProfitOpt ? formatCurrency(pProfitOpt, currency) : "—"}
          status={pProfitOpt && pProfitOpt > product.price ? "verde" : "amarillo"}
          helperText={!curve ? "Requiere curva de demanda" : undefined}
          explanation={{
            meaning: "El precio que maximiza tu utilidad total, considerando cómo cambia la demanda con el precio.",
            why: "Es, en general, el precio más importante de este panel: maximiza lo que realmente te queda.",
            howCalculated: "Máximo de Utilidad(P) = (P − Costo Variable) × (a + b×P).",
            isGoodOrBad: pProfitOpt && pProfitOpt > product.price ? "Está por encima de tu precio actual: podrías tener espacio para subir precio." : "Tu precio actual ya está cerca del óptimo.",
            whatToDo: "Prueba ajustar tu precio de lista hacia este valor de forma gradual y mide el impacto real en ventas.",
          }}
        />
        <KpiCard
          label="Precio psicológico"
          value={formatCurrency(pPsychological, currency)}
          explanation={{
            meaning: "Una versión del precio óptimo de utilidad terminada en .90, más fácil de comunicar.",
            why: "Los precios terminados en .90/.99 suelen percibirse como más bajos de lo que son.",
            howCalculated: "Redondeo al entero más cercano del precio óptimo, ajustado a terminación .90.",
            isGoodOrBad: "No aplica bien/mal — es una decisión de presentación comercial.",
            whatToDo: "Úsalo como precio de lista final una vez definido el precio óptimo.",
          }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-700">Precio competitivo (referencia manual)</CardTitle>
        </CardHeader>
        <CardContent className="flex items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="competitor-price" className="text-xs text-slate-500">
              Precio promedio de la competencia ({currency})
            </Label>
            <Input
              id="competitor-price"
              type="number"
              min={0}
              step="0.01"
              value={competitorPrice}
              onChange={(e) => setCompetitorPrice(e.target.value === "" ? "" : Number(e.target.value))}
              className="h-9 w-40"
            />
          </div>
          {competitorPrice !== "" && (
            <p className="text-sm text-slate-600">
              Tu precio actual está{" "}
              <span className={product.price > competitorPrice ? "font-medium text-amber-600" : "font-medium text-emerald-700"}>
                {formatPercent(((product.price - competitorPrice) / competitorPrice) * 100)}
              </span>{" "}
              {product.price > competitorPrice ? "por encima" : "por debajo"} de la competencia.
            </p>
          )}
        </CardContent>
      </Card>

      {curve && series.length > 0 && <PriceCurveCharts data={series} currency={currency} currentPrice={product.price} />}
    </div>
  );
}

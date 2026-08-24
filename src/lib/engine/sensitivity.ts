/**
 * SENSITIVITY ENGINE — análisis de sensibilidad (spec §9, §17.1). Determinístico
 * y puro: reutiliza `buildCompanySnapshot` del Financial Engine para medir el
 * impacto de cada variable, nunca inventa un número.
 */
import {
  buildCompanySnapshot,
  type EngineFixedCost,
  type EngineProduct,
  type EngineVariableCost,
} from "@/lib/engine/financial";

export interface SensitivityInputs {
  products: EngineProduct[];
  fixedCosts: EngineFixedCost[];
  variableCosts: EngineVariableCost[];
}

function shockPrice(products: EngineProduct[], pct: number): EngineProduct[] {
  return products.map((p) => ({ ...p, price: p.price * (1 + pct / 100) }));
}

function shockSales(products: EngineProduct[], pct: number): EngineProduct[] {
  return products.map((p) => ({ ...p, unitsSoldMonthly: p.unitsSoldMonthly * (1 + pct / 100) }));
}

function shockFixedCosts(fixedCosts: EngineFixedCost[], pct: number): EngineFixedCost[] {
  return fixedCosts.map((c) => ({ ...c, amountMonthly: c.amountMonthly * (1 + pct / 100) }));
}

function shockVariableCosts(variableCosts: EngineVariableCost[], pct: number): EngineVariableCost[] {
  return variableCosts.map((c) => ({
    ...c,
    amountPerUnit: c.amountPerUnit != null ? c.amountPerUnit * (1 + pct / 100) : c.amountPerUnit,
  }));
}

export interface SensitivityImpact {
  variable: string;
  label: string;
  /** % de cambio en la Utilidad Neta cuando esta variable se mueve `shockPct`. */
  impactPctOnUtilidad: number;
}

/**
 * Top variables de mayor impacto (spec §17.1: "Top 5 variables de mayor
 * impacto (desde sensibilidad)"). Mueve cada variable de a una, dejando las
 * demás constantes ("ceteris paribus"), y ordena por impacto absoluto sobre
 * la Utilidad Neta. `extra` permite que otros motores (ej. Currency Engine)
 * agreguen su propia variable (tipo de cambio) al ranking sin acoplar este
 * archivo a la lógica de monedas.
 */
export function computeSensitivityRanking(
  base: SensitivityInputs,
  taxRatePct: number,
  shockPct: number = 10,
  extra: SensitivityImpact[] = []
): SensitivityImpact[] {
  const baseSnapshot = buildCompanySnapshot(base.products, base.variableCosts, base.fixedCosts, taxRatePct);
  const baseUtilidad = baseSnapshot.statement.utilidadNeta;

  const impactOf = (products: EngineProduct[], fixedCosts: EngineFixedCost[], variableCosts: EngineVariableCost[]) => {
    const snap = buildCompanySnapshot(products, variableCosts, fixedCosts, taxRatePct);
    return baseUtilidad !== 0 ? ((snap.statement.utilidadNeta - baseUtilidad) / Math.abs(baseUtilidad)) * 100 : 0;
  };

  const impacts: SensitivityImpact[] = [
    {
      variable: "precio",
      label: "Precio",
      impactPctOnUtilidad: impactOf(shockPrice(base.products, shockPct), base.fixedCosts, base.variableCosts),
    },
    {
      variable: "ventas",
      label: "Ventas (unidades)",
      impactPctOnUtilidad: impactOf(shockSales(base.products, shockPct), base.fixedCosts, base.variableCosts),
    },
    {
      variable: "costos_fijos",
      label: "Costos Fijos",
      impactPctOnUtilidad: impactOf(base.products, shockFixedCosts(base.fixedCosts, shockPct), base.variableCosts),
    },
    {
      variable: "costos_variables",
      label: "Costos Variables",
      impactPctOnUtilidad: impactOf(base.products, base.fixedCosts, shockVariableCosts(base.variableCosts, shockPct)),
    },
    ...extra,
  ];

  return impacts.sort((a, b) => Math.abs(b.impactPctOnUtilidad) - Math.abs(a.impactPctOnUtilidad));
}

export interface HeatmapCell {
  priceDeltaPct: number;
  salesDeltaPct: number;
  utilidadNeta: number;
}

/**
 * Mapa de calor Precio × Ventas → Utilidad Neta (spec §9/§23.6: "matrices/
 * mapas de calor sobre precio, ventas, costos... impacto en utilidad").
 */
export function buildPriceSalesHeatmap(
  base: SensitivityInputs,
  taxRatePct: number,
  priceDeltas: number[],
  salesDeltas: number[]
): HeatmapCell[][] {
  return priceDeltas.map((priceDeltaPct) =>
    salesDeltas.map((salesDeltaPct) => {
      const products = shockSales(shockPrice(base.products, priceDeltaPct), salesDeltaPct);
      const snap = buildCompanySnapshot(products, base.variableCosts, base.fixedCosts, taxRatePct);
      return { priceDeltaPct, salesDeltaPct, utilidadNeta: snap.statement.utilidadNeta };
    })
  );
}

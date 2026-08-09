/**
 * Aplica los deltas de un escenario (spec §9) sobre los inputs base del
 * Financial Engine, sin duplicar ninguna fórmula: Pesimista/Base/Optimista
 * reusan exactamente `computeProductEconomics` / `buildIncomeStatement` /
 * `buildCashFlow` con inputs ajustados.
 */
import type { EngineFixedCost, EngineProduct, EngineVariableCost } from "./financial";

export type ScenarioType = "PESIMISTA" | "BASE" | "OPTIMISTA";

export interface ScenarioDeltas {
  type: ScenarioType;
  salesDeltaPct: number;
  priceDeltaPct: number;
  costDeltaPct: number;
}

/** Deltas por defecto sugeridos al crear una empresa — spec §9, editables por el usuario. */
export const DEFAULT_SCENARIO_DELTAS: Record<ScenarioType, Omit<ScenarioDeltas, "type">> = {
  PESIMISTA: { salesDeltaPct: -20, priceDeltaPct: 0, costDeltaPct: 10 },
  BASE: { salesDeltaPct: 0, priceDeltaPct: 0, costDeltaPct: 0 },
  OPTIMISTA: { salesDeltaPct: 20, priceDeltaPct: 5, costDeltaPct: -5 },
};

export interface ScenarioInputs {
  products: EngineProduct[];
  fixedCosts: EngineFixedCost[];
  variableCosts: EngineVariableCost[];
}

export function applyScenario(base: ScenarioInputs, deltas: ScenarioDeltas): ScenarioInputs {
  const products = base.products.map((p) => ({
    ...p,
    price: p.price * (1 + deltas.priceDeltaPct / 100),
    unitsSoldMonthly: p.unitsSoldMonthly * (1 + deltas.salesDeltaPct / 100),
  }));

  const fixedCosts = base.fixedCosts.map((c) => ({
    ...c,
    amountMonthly: c.amountMonthly * (1 + deltas.costDeltaPct / 100),
  }));

  const variableCosts = base.variableCosts.map((c) => ({
    ...c,
    // pctOfSales ya escala naturalmente con el cambio de ventas/precio; solo
    // ajustamos los montos fijos por unidad ante un shock de costos.
    amountPerUnit: c.amountPerUnit != null ? c.amountPerUnit * (1 + deltas.costDeltaPct / 100) : c.amountPerUnit,
  }));

  return { products, fixedCosts, variableCosts };
}

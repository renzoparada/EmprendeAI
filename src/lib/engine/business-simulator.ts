/**
 * BUSINESS SIMULATOR (spec §20: "simula 12, 24, 36, 60 meses sobre clientes,
 * precio, ventas, costos, marketing, personal, inversión, financiamiento,
 * inflación, tipo de cambio"). Proyección hacia ADELANTE, mes a mes, sobre
 * los datos reales actuales de la empresa — distinto de Escenarios (un solo
 * período, sin línea de tiempo) y de Benchmarking Temporal (mira hacia
 * atrás, con datos reales capturados).
 *
 * Determinístico y puro (spec §0.3/§27): cada mes se recalcula con
 * `buildCompanySnapshot`, el mismo pipeline que usa el resto de la
 * plataforma — nunca una fórmula paralela. Todos los supuestos de
 * crecimiento son explícitos e ingresados por el usuario, nunca inferidos.
 *
 * Variables de la spec y cómo se resuelven aquí:
 *  - Clientes/Ventas -> `monthlySalesGrowthPct` compuesto sobre unidades vendidas.
 *  - Precio -> `priceAdjustmentPct`, un ajuste aplicado desde el mes 1 (constante después).
 *  - Costos/Inflación -> `annualInflationPct` compuesto mensualmente sobre costos fijos.
 *  - Personal -> `staffCount` × `avgSalary`, creciendo a `monthlyStaffGrowthPct`,
 *    se agrega como una línea de costo fijo SOLO de la simulación (nunca toca los
 *    `FixedCost` reales de la empresa).
 *  - Inversión -> `investmentEvents`: egresos de caja puntuales en meses específicos.
 *  - Financiamiento -> `monthlyDebtService`, ya calculado por el Financing Engine
 *    (`summarizeLoan`) sobre los `FinancingPlan` reales de la empresa — este motor
 *    solo lo resta del flujo, no recalcula amortización.
 *  - Tipo de cambio -> se resuelve ANTES de llamar a este motor: la página aplica
 *    `applyImportCosts` (Currency Engine) sobre los productos con costo de
 *    importación y pasa el resultado ya ajustado como `baseProducts`. Este motor
 *    no conoce monedas — mantiene una sola responsabilidad.
 *  - Marketing -> `projectMarketing` es informativo (gasto y clientes nuevos
 *    proyectados vía CAC/conversión actuales); NO alimenta `monthlySalesGrowthPct`
 *    para evitar que dos mecanismos de crecimiento se superpongan y produzcan un
 *    número que nadie pueda explicar.
 */

import { buildCompanySnapshot, type EngineFixedCost, type EngineProduct, type EngineVariableCost } from "@/lib/engine/financial";

export interface InvestmentEvent {
  month: number; // 1-based, dentro del horizonte
  name: string;
  amount: number;
}

export interface SimulationAssumptions {
  horizonMonths: number;
  monthlySalesGrowthPct: number;
  priceAdjustmentPct: number;
  annualInflationPct: number;
  staffCount: number;
  avgSalary: number;
  monthlyStaffGrowthPct: number;
  investmentEvents: InvestmentEvent[];
  /** Ya calculado por el Financing Engine sobre los FinancingPlan reales — 0 si no se incluyen. */
  monthlyDebtService: number;
}

export interface SimulationMonthResult {
  month: number;
  ventas: number;
  costoVentas: number;
  utilidadBruta: number;
  gastosOperativos: number;
  ebitda: number;
  utilidadNeta: number;
  flujoNeto: number;
  capex: number;
  servicioDeuda: number;
  flujoNetoConDeudaYCapex: number;
  flujoAcumulado: number;
}

/** Convierte una tasa anual a su equivalente mensual compuesto: (1+anual)^(1/12) − 1. */
export function computeMonthlyRateFromAnnual(annualPct: number): number {
  return (Math.pow(1 + annualPct / 100, 1 / 12) - 1) * 100;
}

export function runBusinessSimulation(
  baseProducts: EngineProduct[],
  baseVariableCosts: EngineVariableCost[],
  baseFixedCosts: EngineFixedCost[],
  taxRatePct: number,
  assumptions: SimulationAssumptions
): SimulationMonthResult[] {
  const monthlyInflationPct = computeMonthlyRateFromAnnual(assumptions.annualInflationPct);
  const priceFactor = 1 + assumptions.priceAdjustmentPct / 100;
  const results: SimulationMonthResult[] = [];
  let flujoAcumulado = 0;

  for (let month = 1; month <= assumptions.horizonMonths; month++) {
    const salesGrowthFactor = Math.pow(1 + assumptions.monthlySalesGrowthPct / 100, month);
    const inflationFactor = Math.pow(1 + monthlyInflationPct / 100, month);
    const staffFactor = Math.pow(1 + assumptions.monthlyStaffGrowthPct / 100, month);

    const products: EngineProduct[] = baseProducts.map((p) => ({
      ...p,
      price: p.price * priceFactor,
      unitsSoldMonthly: p.unitsSoldMonthly * salesGrowthFactor,
    }));

    const fixedCosts: EngineFixedCost[] = baseFixedCosts.map((c) => ({ ...c, amountMonthly: c.amountMonthly * inflationFactor }));
    const staffCostMonthly = assumptions.staffCount * assumptions.avgSalary * staffFactor;
    if (staffCostMonthly > 0) {
      fixedCosts.push({ id: "simulador-personal", amountMonthly: staffCostMonthly });
    }

    const snapshot = buildCompanySnapshot(products, baseVariableCosts, fixedCosts, taxRatePct);

    const capex = assumptions.investmentEvents.filter((e) => e.month === month).reduce((sum, e) => sum + e.amount, 0);
    const servicioDeuda = assumptions.monthlyDebtService;
    const flujoNetoConDeudaYCapex = snapshot.cashFlow.flujoNeto - servicioDeuda - capex;
    flujoAcumulado += flujoNetoConDeudaYCapex;

    results.push({
      month,
      ventas: snapshot.statement.ventas,
      costoVentas: snapshot.statement.costoVentas,
      utilidadBruta: snapshot.statement.utilidadBruta,
      gastosOperativos: snapshot.statement.gastosOperativos,
      ebitda: snapshot.statement.ebitda,
      utilidadNeta: snapshot.statement.utilidadNeta,
      flujoNeto: snapshot.cashFlow.flujoNeto,
      capex,
      servicioDeuda,
      flujoNetoConDeudaYCapex,
      flujoAcumulado,
    });
  }

  return results;
}

export interface MarketingProjectionMonth {
  month: number;
  marketingSpend: number;
  projectedLeads: number;
  projectedNewCustomers: number;
}

/**
 * Proyección informativa de marketing (spec §20) — gasto y clientes nuevos
 * esperados manteniendo el costo por lead y la conversión actuales
 * constantes. No alimenta `runBusinessSimulation`: es una vista de
 * referencia, no un segundo motor de crecimiento.
 */
export function projectMarketing(
  baseMarketingSpend: number,
  costPerLead: number,
  overallConversionPct: number,
  monthlyMarketingGrowthPct: number,
  horizonMonths: number
): MarketingProjectionMonth[] {
  const results: MarketingProjectionMonth[] = [];
  for (let month = 1; month <= horizonMonths; month++) {
    const marketingSpend = baseMarketingSpend * Math.pow(1 + monthlyMarketingGrowthPct / 100, month);
    const projectedLeads = costPerLead > 0 ? marketingSpend / costPerLead : 0;
    const projectedNewCustomers = projectedLeads * (overallConversionPct / 100);
    results.push({ month, marketingSpend, projectedLeads, projectedNewCustomers });
  }
  return results;
}

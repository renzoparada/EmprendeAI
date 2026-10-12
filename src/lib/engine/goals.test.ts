import { describe, expect, it } from "vitest";
import { computeGoalPlan, computeGoalProgressPct } from "./goals";

describe("computeGoalPlan (§11)", () => {
  it("calcula ventas necesarias para una meta de utilidad neta", () => {
    const result = computeGoalPlan({
      targetType: "UTILIDAD_NETA",
      targetAmount: 30000,
      contributionMarginRatio: 0.6,
      fixedCostsMonthly: 8000,
      taxRatePct: 25,
      avgTicket: 100,
      unitsPerCustomer: 1,
      targetConversionPct: 20,
      leadsPerVendedor: 50,
    });

    expect(result).not.toBeNull();
    // EBIT necesario = 30000/0.75 = 40000; ventas = (40000+8000)/0.6 = 80000
    expect(result!.ventasNecesarias).toBeCloseTo(80000);
    expect(result!.unidadesNecesarias).toBeCloseTo(800);
    expect(result!.clientesNecesarios).toBeCloseTo(800);
    expect(result!.leadsNecesarios).toBeCloseTo(4000);
    expect(result!.vendedoresNecesarios).toBeCloseTo(80);
  });

  it("usa el monto directo cuando la meta es de ventas", () => {
    const result = computeGoalPlan({
      targetType: "VENTAS",
      targetAmount: 50000,
      contributionMarginRatio: 0.5,
      fixedCostsMonthly: 5000,
      taxRatePct: 25,
      avgTicket: 250,
      unitsPerCustomer: 1,
      targetConversionPct: 25,
      leadsPerVendedor: 50,
    });

    expect(result!.ventasNecesarias).toBe(50000);
    expect(result!.unidadesNecesarias).toBeCloseTo(200);
  });

  it("devuelve null si no hay margen de contribución", () => {
    expect(
      computeGoalPlan({
        targetType: "UTILIDAD_NETA",
        targetAmount: 1000,
        contributionMarginRatio: 0,
        fixedCostsMonthly: 1000,
        taxRatePct: 25,
        avgTicket: 100,
        unitsPerCustomer: 1,
        targetConversionPct: 20,
        leadsPerVendedor: 50,
      })
    ).toBeNull();
  });
});

describe("computeGoalProgressPct", () => {
  it("calcula el % de avance hacia la meta", () => {
    expect(computeGoalProgressPct(30000, 100000)).toBeCloseTo(30);
  });

  it("devuelve 0 si la meta es 0", () => {
    expect(computeGoalProgressPct(500, 0)).toBe(0);
  });
});

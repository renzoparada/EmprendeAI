import { describe, expect, it } from "vitest";
import {
  computeAllValuationMethods,
  computeBerkusValue,
  computeCAPM,
  computeDCFValue,
  computeFreeCashFlow,
  computeScorecardValue,
  computeVCMethod,
  computeValuationRange,
  computeWACC,
  selectValuationMethods,
  valuationByCapitalizedEarnings,
  valuationByEvEbitda,
  valuationByEvSales,
  valuationByPE,
  SCORECARD_STANDARD_FACTORS,
  type ValuationAssumptionsInput,
} from "./valuation";

const baseAssumptions: ValuationAssumptionsInput = {
  riskFreeRatePct: 5,
  beta: 1,
  marketReturnPct: 10,
  costOfDebtPct: 8,
  debtRatioPct: 0,
  fclGrowthPct: 5,
  terminalGrowthPct: 3,
  projectionYears: 5,
  evEbitdaMultiple: null,
  evSalesMultiple: null,
  peMultiple: null,
  berkusFactorCap: 500000,
  berkusIdea: 0,
  berkusPrototype: 0,
  berkusTeam: 0,
  berkusRelationships: 0,
  berkusInitialSales: 0,
  scorecardComparableAvg: null,
  scorecardManagementScorePct: 100,
  scorecardOpportunityScorePct: 100,
  scorecardProductScorePct: 100,
  scorecardCompetitionScorePct: 100,
  scorecardMarketingScorePct: 100,
  scorecardNeedInvestmentScorePct: 100,
  vcExitValueProjected: null,
  vcRequiredReturnMultiple: 10,
  vcInvestmentAmount: null,
};

describe("computeCAPM y computeWACC (21.5)", () => {
  it("calcula Ke con CAPM", () => {
    // Ke = 5 + 1.2*(10-5) = 11
    expect(computeCAPM(5, 1.2, 10)).toBeCloseTo(11);
  });

  it("calcula WACC combinando costo de equity y deuda", () => {
    // Ke=11, Kd=8, D/V=30%, T=25% -> WACC = 0.7*11 + 0.3*8*0.75 = 7.7+1.8=9.5
    expect(computeWACC(11, 8, 30, 25)).toBeCloseTo(9.5);
  });
});

describe("computeFreeCashFlow (21.6)", () => {
  it("calcula el FCL a partir del EBIT", () => {
    // EBIT=1000, T=25% -> 750 + dep 100 - capex 200 - ΔKT 50 = 600
    expect(computeFreeCashFlow(1000, 25, 100, 200, 50)).toBeCloseTo(600);
  });
});

describe("computeDCFValue (21.6)", () => {
  it("calcula el valor de empresa como PV de flujos + PV del valor terminal", () => {
    const result = computeDCFValue(1000, 12, 5, 3, 5);
    expect(result).not.toBeNull();
    expect(result!.projectedFCL).toHaveLength(5);
    expect(result!.enterpriseValue).toBeGreaterThan(result!.presentValueOfFCL);
    expect(result!.enterpriseValue).toBeCloseTo(result!.presentValueOfFCL + result!.presentValueOfTerminalValue);
  });

  it("devuelve null si WACC <= g (el valor terminal diverge)", () => {
    expect(computeDCFValue(1000, 5, 5, 6, 5)).toBeNull();
  });
});

describe("Múltiplos y capitalización de utilidades (21.7)", () => {
  it("calcula valor por EV/EBITDA, EV/Ventas y P/E", () => {
    expect(valuationByEvEbitda(50000, 6)).toBe(300000);
    expect(valuationByEvSales(200000, 1.5)).toBe(300000);
    expect(valuationByPE(30000, 10)).toBe(300000);
  });

  it("capitaliza la utilidad neta a la tasa dada", () => {
    // 30000 / 15% = 200000
    expect(valuationByCapitalizedEarnings(30000, 15)).toBeCloseTo(200000);
    expect(valuationByCapitalizedEarnings(30000, 0)).toBeNull();
  });
});

describe("Berkus, Scorecard, VC Method (21.8)", () => {
  it("Berkus suma los factores respetando el tope", () => {
    const value = computeBerkusValue({ idea: 400000, prototype: 600000, team: 300000, strategicRelationships: 100000, initialSales: 0 }, 500000);
    // prototype se recorta a 500000
    expect(value).toBe(400000 + 500000 + 300000 + 100000 + 0);
  });

  it("los factores estándar de Scorecard suman 100% de peso", () => {
    const totalWeight = SCORECARD_STANDARD_FACTORS.reduce((sum, f) => sum + f.weightPct, 0);
    expect(totalWeight).toBe(100);
  });

  it("Scorecard iguala al comparable cuando todos los puntajes son 100", () => {
    const factors = SCORECARD_STANDARD_FACTORS.map((f) => ({ ...f, scorePct: 100 }));
    expect(computeScorecardValue(1000000, factors)).toBeCloseTo(1000000);
  });

  it("VC Method calcula post-money, pre-money y % a ceder", () => {
    const result = computeVCMethod(5000000, 10, 200000);
    expect(result).not.toBeNull();
    expect(result!.postMoneyValuation).toBeCloseTo(500000);
    expect(result!.preMoneyValuation).toBeCloseTo(300000);
    expect(result!.percentToCede).toBeCloseTo(40);
  });
});

describe("selectValuationMethods (16.1)", () => {
  it("elige DCF/Múltiplos/Capitalización para negocios operando con ingresos", () => {
    expect(selectValuationMethods(true, "OPERANDO")).toEqual(["DCF", "MULTIPLOS", "CAPITALIZACION_UTILIDADES"]);
  });

  it("elige Berkus/Scorecard/VC Method para startups pre-ingresos", () => {
    expect(selectValuationMethods(false, "ETAPA_IDEA")).toEqual(["BERKUS", "SCORECARD", "VC_METHOD"]);
  });
});

describe("computeValuationRange", () => {
  it("calcula min/probable/max ignorando valores inválidos", () => {
    const range = computeValuationRange([
      { method: "DCF", value: 300000 },
      { method: "MULTIPLOS", value: 400000 },
      { method: "CAPITALIZACION_UTILIDADES", value: NaN },
    ]);
    expect(range).not.toBeNull();
    expect(range!.min).toBe(300000);
    expect(range!.max).toBe(400000);
    expect(range!.probable).toBeCloseTo(350000);
    expect(range!.methodResults).toHaveLength(2);
  });

  it("devuelve null si no hay resultados válidos", () => {
    expect(computeValuationRange([{ method: "DCF", value: 0 }])).toBeNull();
  });
});

describe("computeAllValuationMethods (orquestador)", () => {
  it("para un negocio operando con ingresos, corre DCF/Múltiplos/Capitalización y marca Múltiplos como no disponible sin comparables", () => {
    const result = computeAllValuationMethods({
      hasRevenue: true,
      operatingStage: "OPERANDO",
      ebitAnnual: 120000,
      ebitdaAnnual: 150000,
      salesAnnual: 600000,
      netIncomeAnnual: 90000,
      taxRatePct: 25,
      assumptions: baseAssumptions,
    });

    expect(result.selectedMethods).toEqual(["DCF", "MULTIPLOS", "CAPITALIZACION_UTILIDADES"]);
    expect(result.methodDetails.DCF?.value).toBeGreaterThan(0);
    expect(result.methodDetails.MULTIPLOS?.value).toBeNull();
    expect(result.methodDetails.MULTIPLOS?.unavailableReason).toBeDefined();
    expect(result.methodDetails.CAPITALIZACION_UTILIDADES?.value).toBeGreaterThan(0);
    expect(result.range).not.toBeNull();
  });

  it("incluye Múltiplos cuando el usuario carga un múltiplo comparable", () => {
    const result = computeAllValuationMethods({
      hasRevenue: true,
      operatingStage: "OPERANDO",
      ebitAnnual: 120000,
      ebitdaAnnual: 150000,
      salesAnnual: 600000,
      netIncomeAnnual: 90000,
      taxRatePct: 25,
      assumptions: { ...baseAssumptions, evEbitdaMultiple: 6 },
    });
    expect(result.methodDetails.MULTIPLOS?.value).toBeCloseTo(900000);
  });

  it("para una startup pre-ingresos, corre Berkus/Scorecard/VC Method", () => {
    const result = computeAllValuationMethods({
      hasRevenue: false,
      operatingStage: "ETAPA_IDEA",
      ebitAnnual: 0,
      ebitdaAnnual: 0,
      salesAnnual: 0,
      netIncomeAnnual: 0,
      taxRatePct: 25,
      assumptions: {
        ...baseAssumptions,
        berkusIdea: 100000,
        berkusPrototype: 100000,
        berkusTeam: 100000,
        berkusRelationships: 50000,
        berkusInitialSales: 0,
        vcExitValueProjected: 5000000,
        vcRequiredReturnMultiple: 10,
        vcInvestmentAmount: 200000,
      },
    });

    expect(result.selectedMethods).toEqual(["BERKUS", "SCORECARD", "VC_METHOD"]);
    expect(result.methodDetails.BERKUS?.value).toBeCloseTo(350000);
    expect(result.methodDetails.SCORECARD?.value).toBeNull(); // sin comparableAvg
    expect(result.methodDetails.VC_METHOD?.value).toBeCloseTo(500000);
    expect(result.range).not.toBeNull();
  });
});

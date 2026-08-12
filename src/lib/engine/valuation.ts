/**
 * VALUATION ENGINE — valoración de empresas (spec §16, fórmulas 21.5-21.9).
 * Determinístico y puro, mismas reglas que los demás motores (spec §27): sin
 * I/O, sin IA. Cuando no hay datos de mercado confiables (beta, múltiplos
 * comparables), el llamador debe pasar una tasa/múltiplo manual — este
 * motor nunca "adivina" uno (spec §21.5: "permitir tasa manual justificada,
 * marcada como supuesto del usuario").
 */
import { computeNPV } from "@/lib/engine/financial";
import { projectWithGrowth } from "@/lib/engine/projection";

// ---------------------------------------------------------------------------
// 21.5 — CAPM / WACC
// ---------------------------------------------------------------------------

/** CAPM: Ke = Rf + β × (Rm − Rf). Todas las tasas en %. */
export function computeCAPM(riskFreeRatePct: number, beta: number, marketReturnPct: number): number {
  return riskFreeRatePct + beta * (marketReturnPct - riskFreeRatePct);
}

/** WACC = (E/V × Ke) + (D/V × Kd × (1 − T)). `debtRatioPct` = D/V en %. */
export function computeWACC(ke: number, kd: number, debtRatioPct: number, taxRatePct: number): number {
  const debtRatio = debtRatioPct / 100;
  const equityRatio = 1 - debtRatio;
  return equityRatio * ke + debtRatio * kd * (1 - taxRatePct / 100);
}

// ---------------------------------------------------------------------------
// 21.6 — DCF
// ---------------------------------------------------------------------------

/** FCL = EBIT × (1−T) + Depreciación − CAPEX − Δ Capital de Trabajo. */
export function computeFreeCashFlow(ebit: number, taxRatePct: number, depreciation: number, capex: number, deltaWorkingCapital: number): number {
  return ebit * (1 - taxRatePct / 100) + depreciation - capex - deltaWorkingCapital;
}

export interface DCFResult {
  projectedFCL: number[];
  presentValueOfFCL: number;
  terminalValue: number;
  presentValueOfTerminalValue: number;
  enterpriseValue: number;
}

/**
 * Valor de la Empresa = Σ [FCLt / (1+WACC)^t] + Valor Terminal / (1+WACC)^n
 * Valor Terminal = FCLn × (1+g) / (WACC − g)
 * `baseFCL` se proyecta `years` períodos con `fclGrowthPct` (supuesto
 * explícito, spec §0.3); requiere WACC > g o no hay valor terminal finito.
 */
export function computeDCFValue(baseFCL: number, wacc: number, fclGrowthPct: number, terminalGrowthPct: number, years: number): DCFResult | null {
  if (wacc <= terminalGrowthPct) return null; // el valor terminal diverge — no se puede calcular de forma confiable

  const projectedFCL = projectWithGrowth(baseFCL, fclGrowthPct, years);
  const waccDecimal = wacc / 100;

  const presentValueOfFCL = projectedFCL.reduce((sum, fcl, i) => sum + fcl / Math.pow(1 + waccDecimal, i + 1), 0);

  const lastFCL = projectedFCL[projectedFCL.length - 1];
  const terminalValue = (lastFCL * (1 + terminalGrowthPct / 100)) / (waccDecimal - terminalGrowthPct / 100);
  const presentValueOfTerminalValue = terminalValue / Math.pow(1 + waccDecimal, years);

  return {
    projectedFCL,
    presentValueOfFCL,
    terminalValue,
    presentValueOfTerminalValue,
    enterpriseValue: presentValueOfFCL + presentValueOfTerminalValue,
  };
}

// ---------------------------------------------------------------------------
// 21.7 — Múltiplos y capitalización de utilidades
// ---------------------------------------------------------------------------

export function valuationByEvEbitda(ebitdaAnnual: number, multiple: number): number {
  return ebitdaAnnual * multiple;
}

export function valuationByEvSales(salesAnnual: number, multiple: number): number {
  return salesAnnual * multiple;
}

export function valuationByPE(netIncomeAnnual: number, multiple: number): number {
  return netIncomeAnnual * multiple;
}

/**
 * Capitalización de utilidades (spec §16.1, negocios con ingresos activos):
 * Valor = Utilidad Neta Anual / Tasa de Capitalización. No tiene una
 * fórmula propia en §21 — se usa la misma tasa de descuento (WACC) como
 * tasa de capitalización, equivalente a un DCF de crecimiento 0 a
 * perpetuidad.
 */
export function valuationByCapitalizedEarnings(netIncomeAnnual: number, capitalizationRatePct: number): number | null {
  return capitalizationRatePct > 0 ? netIncomeAnnual / (capitalizationRatePct / 100) : null;
}

// ---------------------------------------------------------------------------
// 21.8 — Startups: Berkus, Scorecard, VC Method
// ---------------------------------------------------------------------------

export interface BerkusInputs {
  idea: number;
  prototype: number;
  team: number;
  strategicRelationships: number;
  initialSales: number;
}

/**
 * Berkus: Valor = Σ factores, cada uno con tope monetario definido
 * (`factorCap`, editable por el usuario — spec §21.8: "cada factor con tope
 * monetario definido"). El motor nunca deja que un factor exceda el tope.
 */
export function computeBerkusValue(inputs: BerkusInputs, factorCap: number): number {
  const clamp = (v: number) => Math.max(0, Math.min(v, factorCap));
  return clamp(inputs.idea) + clamp(inputs.prototype) + clamp(inputs.team) + clamp(inputs.strategicRelationships) + clamp(inputs.initialSales);
}

export interface ScorecardFactor {
  label: string;
  /** Peso del factor, 0-100, todos los factores deben sumar 100. */
  weightPct: number;
  /** 100 = igual al promedio comparable; >100 mejor, <100 peor. */
  scorePct: number;
}

/** Factores y pesos estándar del método Scorecard (Bill Payne). */
export const SCORECARD_STANDARD_FACTORS: Omit<ScorecardFactor, "scorePct">[] = [
  { label: "Equipo de gestión", weightPct: 30 },
  { label: "Tamaño de la oportunidad", weightPct: 25 },
  { label: "Producto / Tecnología", weightPct: 15 },
  { label: "Entorno competitivo", weightPct: 10 },
  { label: "Marketing / Canales de venta", weightPct: 10 },
  { label: "Necesidad de inversión adicional", weightPct: 5 },
  { label: "Otros", weightPct: 5 },
];

/** Scorecard: Valor = Valoración promedio comparables × Σ(peso × puntaje relativo). */
export function computeScorecardValue(comparableAvgValuation: number, factors: ScorecardFactor[]): number {
  const factorSum = factors.reduce((sum, f) => sum + (f.weightPct / 100) * (f.scorePct / 100), 0);
  return comparableAvgValuation * factorSum;
}

export interface VCMethodResult {
  postMoneyValuation: number;
  preMoneyValuation: number;
  percentToCede: number;
}

/**
 * VC Method:
 *   Post-Money = Valor de Salida Proyectado / Múltiplo de Retorno Exigido
 *   Pre-Money  = Post-Money − Monto a Invertir
 *   % a ceder  = Monto a Invertir / Post-Money
 */
export function computeVCMethod(exitValueProjected: number, requiredReturnMultiple: number, investmentAmount: number): VCMethodResult | null {
  if (requiredReturnMultiple <= 0) return null;
  const postMoneyValuation = exitValueProjected / requiredReturnMultiple;
  const preMoneyValuation = postMoneyValuation - investmentAmount;
  const percentToCede = postMoneyValuation > 0 ? (investmentAmount / postMoneyValuation) * 100 : 0;
  return { postMoneyValuation, preMoneyValuation, percentToCede };
}

// ---------------------------------------------------------------------------
// Selección automática de métodos por etapa (spec §16.1)
// ---------------------------------------------------------------------------

export type ValuationMethod = "DCF" | "MULTIPLOS" | "CAPITALIZACION_UTILIDADES" | "BERKUS" | "SCORECARD" | "VC_METHOD";

export const VALUATION_METHOD_LABELS: Record<ValuationMethod, string> = {
  DCF: "Flujo de Caja Descontado (DCF)",
  MULTIPLOS: "Múltiplos comparables",
  CAPITALIZACION_UTILIDADES: "Capitalización de utilidades",
  BERKUS: "Método Berkus",
  SCORECARD: "Scorecard Method",
  VC_METHOD: "Venture Capital Method",
};

/**
 * La plataforma selecciona automáticamente los 2-3 métodos más relevantes
 * según la etapa del negocio (spec §16.1): negocios con ingresos activos →
 * DCF + Múltiplos (+ Capitalización si el negocio ya está operando de forma
 * estable); startups pre-ingresos → Berkus + Scorecard + VC Method.
 */
export function selectValuationMethods(hasRevenue: boolean, operatingStage: "OPERANDO" | "NO_OPERANDO" | "ETAPA_IDEA"): ValuationMethod[] {
  if (hasRevenue && operatingStage === "OPERANDO") {
    return ["DCF", "MULTIPLOS", "CAPITALIZACION_UTILIDADES"];
  }
  return ["BERKUS", "SCORECARD", "VC_METHOD"];
}

// ---------------------------------------------------------------------------
// Rango de valoración (spec §16.1: "siempre muestra un rango, nunca una única cifra")
// ---------------------------------------------------------------------------

export interface ValuationMethodResult {
  method: ValuationMethod;
  value: number;
}

export interface ValuationRange {
  min: number;
  probable: number;
  max: number;
  methodResults: ValuationMethodResult[];
}

export function computeValuationRange(results: ValuationMethodResult[]): ValuationRange | null {
  const valid = results.filter((r) => Number.isFinite(r.value) && r.value > 0);
  if (valid.length === 0) return null;

  const values = valid.map((r) => r.value).sort((a, b) => a - b);
  const probable = values.reduce((sum, v) => sum + v, 0) / values.length;

  return { min: values[0], probable, max: values[values.length - 1], methodResults: valid };
}

// re-exportado por conveniencia para quien construya flujos DCF con VAN estándar
export { computeNPV };

// ---------------------------------------------------------------------------
// Orquestador: corre los métodos seleccionados y arma el rango final
// ---------------------------------------------------------------------------

export interface ValuationAssumptionsInput {
  riskFreeRatePct: number;
  beta: number;
  marketReturnPct: number;
  costOfDebtPct: number;
  debtRatioPct: number;
  fclGrowthPct: number;
  terminalGrowthPct: number;
  projectionYears: number;
  evEbitdaMultiple: number | null;
  evSalesMultiple: number | null;
  peMultiple: number | null;
  berkusFactorCap: number;
  berkusIdea: number;
  berkusPrototype: number;
  berkusTeam: number;
  berkusRelationships: number;
  berkusInitialSales: number;
  scorecardComparableAvg: number | null;
  scorecardManagementScorePct: number;
  scorecardOpportunityScorePct: number;
  scorecardProductScorePct: number;
  scorecardCompetitionScorePct: number;
  scorecardMarketingScorePct: number;
  scorecardNeedInvestmentScorePct: number;
  vcExitValueProjected: number | null;
  vcRequiredReturnMultiple: number;
  vcInvestmentAmount: number | null;
}

export interface ValuationComputationInputs {
  hasRevenue: boolean;
  operatingStage: "OPERANDO" | "NO_OPERANDO" | "ETAPA_IDEA";
  ebitAnnual: number;
  ebitdaAnnual: number;
  salesAnnual: number;
  netIncomeAnnual: number;
  taxRatePct: number;
  assumptions: ValuationAssumptionsInput;
}

export interface ValuationMethodDetail {
  value: number | null;
  unavailableReason?: string;
  dcf?: DCFResult;
  vc?: VCMethodResult;
}

export interface ValuationComputationOutput {
  wacc: number;
  ke: number;
  selectedMethods: ValuationMethod[];
  methodDetails: Partial<Record<ValuationMethod, ValuationMethodDetail>>;
  range: ValuationRange | null;
}

function scorecardFactorsFromAssumptions(a: ValuationAssumptionsInput): ScorecardFactor[] {
  const scoreByLabel: Record<string, number> = {
    "Equipo de gestión": a.scorecardManagementScorePct,
    "Tamaño de la oportunidad": a.scorecardOpportunityScorePct,
    "Producto / Tecnología": a.scorecardProductScorePct,
    "Entorno competitivo": a.scorecardCompetitionScorePct,
    "Marketing / Canales de venta": a.scorecardMarketingScorePct,
    "Necesidad de inversión adicional": a.scorecardNeedInvestmentScorePct,
  };
  return SCORECARD_STANDARD_FACTORS.map((f) => ({ ...f, scorePct: scoreByLabel[f.label] ?? 100 }));
}

/**
 * Corre los 2-3 métodos que la plataforma selecciona automáticamente según
 * la etapa (spec §16.1) y arma el rango final. Un método que no tiene los
 * datos/supuestos necesarios queda marcado con `unavailableReason` — nunca
 * se rellena con un valor inventado.
 */
export function computeAllValuationMethods(inputs: ValuationComputationInputs): ValuationComputationOutput {
  const selectedMethods = selectValuationMethods(inputs.hasRevenue, inputs.operatingStage);
  const a = inputs.assumptions;
  const ke = computeCAPM(a.riskFreeRatePct, a.beta, a.marketReturnPct);
  const wacc = computeWACC(ke, a.costOfDebtPct, a.debtRatioPct, inputs.taxRatePct);

  const methodDetails: ValuationComputationOutput["methodDetails"] = {};

  if (selectedMethods.includes("DCF")) {
    const baseFCL = computeFreeCashFlow(inputs.ebitAnnual, inputs.taxRatePct, 0, 0, 0);
    const dcf = computeDCFValue(baseFCL, wacc, a.fclGrowthPct, a.terminalGrowthPct, a.projectionYears);
    methodDetails.DCF = dcf
      ? { value: dcf.enterpriseValue, dcf }
      : { value: null, unavailableReason: "El WACC debe ser mayor a la tasa de crecimiento terminal para calcular el valor terminal." };
  }

  if (selectedMethods.includes("MULTIPLOS")) {
    const values: number[] = [];
    if (a.evEbitdaMultiple) values.push(valuationByEvEbitda(inputs.ebitdaAnnual, a.evEbitdaMultiple));
    if (a.evSalesMultiple) values.push(valuationByEvSales(inputs.salesAnnual, a.evSalesMultiple));
    if (a.peMultiple) values.push(valuationByPE(inputs.netIncomeAnnual, a.peMultiple));
    methodDetails.MULTIPLOS =
      values.length > 0
        ? { value: values.reduce((sum, v) => sum + v, 0) / values.length }
        : { value: null, unavailableReason: "Carga al menos un múltiplo comparable confiable (EV/EBITDA, EV/Ventas o P/E)." };
  }

  if (selectedMethods.includes("CAPITALIZACION_UTILIDADES")) {
    const value = valuationByCapitalizedEarnings(inputs.netIncomeAnnual, wacc);
    methodDetails.CAPITALIZACION_UTILIDADES = { value };
  }

  if (selectedMethods.includes("BERKUS")) {
    const value = computeBerkusValue(
      { idea: a.berkusIdea, prototype: a.berkusPrototype, team: a.berkusTeam, strategicRelationships: a.berkusRelationships, initialSales: a.berkusInitialSales },
      a.berkusFactorCap
    );
    methodDetails.BERKUS = { value };
  }

  if (selectedMethods.includes("SCORECARD")) {
    methodDetails.SCORECARD = a.scorecardComparableAvg
      ? { value: computeScorecardValue(a.scorecardComparableAvg, scorecardFactorsFromAssumptions(a)) }
      : { value: null, unavailableReason: "Carga una valoración promedio de comparables de tu sector/etapa." };
  }

  if (selectedMethods.includes("VC_METHOD")) {
    if (a.vcExitValueProjected && a.vcInvestmentAmount) {
      const vc = computeVCMethod(a.vcExitValueProjected, a.vcRequiredReturnMultiple, a.vcInvestmentAmount);
      methodDetails.VC_METHOD = vc ? { value: vc.postMoneyValuation, vc } : { value: null, unavailableReason: "El múltiplo de retorno exigido debe ser mayor a 0." };
    } else {
      methodDetails.VC_METHOD = { value: null, unavailableReason: "Carga el valor de salida proyectado y el monto a invertir." };
    }
  }

  const range = computeValuationRange(
    selectedMethods.map((m) => ({ method: m, value: methodDetails[m]?.value ?? NaN })).filter((r) => Number.isFinite(r.value))
  );

  return { wacc, ke, selectedMethods, methodDetails, range };
}

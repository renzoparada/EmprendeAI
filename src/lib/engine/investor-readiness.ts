/**
 * INVESTOR READINESS SCORE (spec §16.5) — puntaje 0-100 desde señales
 * objetivas ya calculadas por los demás motores. Determinístico (spec §27).
 *
 * El MVP+v2.0 no tiene todavía datos históricos multi-mes ni documentos
 * cargados (esas señales se mencionan en la spec §16.5 y se sumarán cuando
 * existan esos módulos) — este score usa las señales disponibles hoy:
 * completitud de datos, margen vs. objetivo, flujo de caja, concentración
 * de producto y riesgos activos (del Risk Engine).
 */

export interface InvestorReadinessSignals {
  hasProducts: boolean;
  hasCosts: boolean;
  hasInvestment: boolean;
  marginNetoPct: number | null;
  cashFlowPositive: boolean | null;
  hasProductConcentrationRisk: boolean;
  activeRiskCount: number;
}

export interface InvestorReadinessBreakdownItem {
  label: string;
  points: number;
  maxPoints: number;
}

export interface InvestorReadinessResult {
  score: number;
  breakdown: InvestorReadinessBreakdownItem[];
}

const TARGET_MARGIN_PCT = 20;

export function computeInvestorReadinessScore(signals: InvestorReadinessSignals): InvestorReadinessResult {
  const dataCompletenessPoints = (signals.hasProducts ? 10 : 0) + (signals.hasCosts ? 10 : 0) + (signals.hasInvestment ? 5 : 0);

  const marginPoints = signals.marginNetoPct != null ? Math.max(0, Math.min(25, (signals.marginNetoPct / TARGET_MARGIN_PCT) * 25)) : 0;

  const cashFlowPoints = signals.cashFlowPositive === true ? 25 : 0;

  const diversificationPoints = signals.hasProducts && !signals.hasProductConcentrationRisk ? 15 : 0;

  // Sin datos cargados no hay riesgos que evaluar — "ausencia de riesgo" solo
  // cuenta como señal positiva cuando el Risk Engine realmente pudo correr.
  const riskPoints = signals.hasProducts ? Math.max(0, 10 - signals.activeRiskCount * 2.5) : 0;

  const breakdown: InvestorReadinessBreakdownItem[] = [
    { label: "Completitud de datos cargados", points: Math.round(dataCompletenessPoints), maxPoints: 25 },
    { label: "Margen vs. objetivo (20%)", points: Math.round(marginPoints), maxPoints: 25 },
    { label: "Flujo de caja positivo", points: Math.round(cashFlowPoints), maxPoints: 25 },
    { label: "Diversificación de producto", points: Math.round(diversificationPoints), maxPoints: 15 },
    { label: "Ausencia de riesgos activos", points: Math.round(riskPoints), maxPoints: 10 },
  ];

  const score = Math.max(0, Math.min(100, Math.round(breakdown.reduce((sum, b) => sum + b.points, 0))));

  return { score, breakdown };
}

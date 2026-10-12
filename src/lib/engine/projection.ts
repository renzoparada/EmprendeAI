/**
 * Proyección financiera simple: crece un valor base a una tasa anual
 * compuesta durante N períodos. La usan VAN/TIR (§5, fórmula 21.4) e
 * Inversión Inicial, y el Valuation Engine para proyectar flujos futuros
 * (DCF, §21.6) sin pedirle al usuario que cargue año por año. Es un
 * supuesto explícito de crecimiento — se marca como tal en la UI (spec §0.3),
 * nunca se presenta como dato real.
 */
export function projectWithGrowth(baseValue: number, growthPct: number, periods: number): number[] {
  const values: number[] = [];
  for (let t = 1; t <= periods; t++) {
    values.push(baseValue * Math.pow(1 + growthPct / 100, t));
  }
  return values;
}

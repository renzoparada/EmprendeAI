/**
 * FINANCING ENGINE — motor determinístico de financiamiento (spec §14).
 *
 * "Financiamiento: simula préstamo, socios, inversionistas, capital propio,
 * crowdfunding. Variables: monto, interés, plazo, cuotas, período de gracia.
 * Calcula cuota, intereses, costo financiero, flujo de deuda, impacto sobre
 * ROI." Todas las fuentes de capital modeladas aquí (préstamo bancario,
 * aporte de socios con retorno pactado, crowdfunding con intereses, etc.)
 * comparten la misma matemática de amortización — la diferencia es solo la
 * etiqueta (`FinancingType`) que el usuario elige.
 *
 * Reglas de diseño (spec §0.3/§27): funciones puras, sin I/O, sin llamadas a
 * IA. La deuda NO se conecta todavía a `buildIncomeStatement`/`buildCashFlow`
 * del Financial Engine (que no modela gastos financieros como línea propia,
 * ver README "Notas de diseño") — este motor expone su propio impacto
 * derivado (flujo con servicio de deuda, ROI apalancado) para que la página
 * de Financiamiento lo muestre sin alterar el resto de la plataforma.
 */

export type GraceType = "NINGUNA" | "SOLO_INTERES" | "TOTAL";

export interface LoanInputs {
  principal: number;
  annualInterestRatePct: number;
  termMonths: number;
  gracePeriodMonths: number;
  graceType: GraceType;
}

export interface AmortizationRow {
  month: number;
  saldoInicial: number;
  interes: number;
  capital: number;
  cuota: number;
  saldoFinal: number;
}

export function computeMonthlyRate(annualInterestRatePct: number): number {
  return annualInterestRatePct / 100 / 12;
}

/**
 * Cuota fija del sistema francés de amortización:
 *   Cuota = Principal × r / (1 − (1+r)^−n),  r = tasa mensual, n = períodos.
 * Si la tasa es 0 (ej. capital propio o socios sin interés pactado), la
 * cuota es simplemente el principal dividido en partes iguales.
 */
export function computeFixedInstallment(principal: number, monthlyRate: number, periods: number): number {
  if (periods <= 0) return 0;
  if (monthlyRate === 0) return principal / periods;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -periods));
}

/**
 * Construye la tabla de amortización completa, mes a mes, incluyendo el
 * período de gracia si existe:
 *   - `SOLO_INTERES`: solo se paga el interés del mes, el saldo no baja.
 *   - `TOTAL`: no se paga nada, el interés se capitaliza (se suma al saldo).
 * Terminada la gracia, la cuota fija se recalcula sobre el saldo restante y
 * los períodos restantes, con ajuste de redondeo en la última cuota para
 * que el saldo final quede exactamente en 0.
 */
export function buildAmortizationSchedule(inputs: LoanInputs): AmortizationRow[] {
  const { principal, annualInterestRatePct, termMonths, gracePeriodMonths, graceType } = inputs;
  const monthlyRate = computeMonthlyRate(annualInterestRatePct);
  const grace = graceType === "NINGUNA" ? 0 : Math.min(Math.max(gracePeriodMonths, 0), Math.max(termMonths - 1, 0));
  const rows: AmortizationRow[] = [];
  let saldo = principal;

  for (let month = 1; month <= grace; month++) {
    const interes = saldo * monthlyRate;
    if (graceType === "TOTAL") {
      const saldoFinal = saldo + interes;
      rows.push({ month, saldoInicial: saldo, interes, capital: -interes, cuota: 0, saldoFinal });
      saldo = saldoFinal;
    } else {
      rows.push({ month, saldoInicial: saldo, interes, capital: 0, cuota: interes, saldoFinal: saldo });
    }
  }

  const remainingPeriods = termMonths - grace;
  const cuota = computeFixedInstallment(saldo, monthlyRate, remainingPeriods);

  for (let i = 1; i <= remainingPeriods; i++) {
    const month = grace + i;
    const interes = saldo * monthlyRate;
    const isLast = i === remainingPeriods;
    const capital = isLast ? saldo : cuota - interes;
    const cuotaThisMonth = isLast ? capital + interes : cuota;
    const saldoFinal = isLast ? 0 : Math.max(0, saldo - capital);
    rows.push({ month, saldoInicial: saldo, interes, capital, cuota: cuotaThisMonth, saldoFinal });
    saldo = saldoFinal;
  }

  return rows;
}

export interface LoanSummary {
  /** Cuota mensual una vez terminado el período de gracia — la cifra representativa del compromiso mensual. */
  cuotaMensual: number;
  totalPagado: number;
  totalIntereses: number;
  /** Costo financiero total = intereses pagados (no se modelan comisiones/seguros adicionales — se documenta como simplificación). */
  costoFinancieroTotal: number;
}

export function summarizeLoan(schedule: AmortizationRow[]): LoanSummary {
  const totalPagado = schedule.reduce((sum, r) => sum + r.cuota, 0);
  const totalIntereses = schedule.reduce((sum, r) => sum + r.interes, 0);
  const firstAmortizingRow = schedule.find((r) => r.capital > 0);
  const cuotaMensual = firstAmortizingRow?.cuota ?? schedule[schedule.length - 1]?.cuota ?? 0;

  return { cuotaMensual, totalPagado, totalIntereses, costoFinancieroTotal: totalIntereses };
}

/**
 * ROI apalancado (spec §14: "impacto sobre ROI") — mide el retorno sobre el
 * capital propio efectivamente puesto por el emprendedor, descontando lo
 * cubierto con deuda/financiamiento externo del total de la inversión:
 *   ROI apalancado (%) = Utilidad Neta / (Inversión Total − Total Financiado) × 100
 * Si lo financiado cubre o supera la inversión total no hay capital propio
 * sobre el cual calcular un retorno — devuelve `null` en vez de inventar una
 * cifra (spec §0.3).
 */
export function computeLeveragedRoi(utilidadNeta: number, inversionTotal: number, totalFinanced: number): number | null {
  const capitalPropio = inversionTotal - totalFinanced;
  if (capitalPropio <= 0) return null;
  return (utilidadNeta / capitalPropio) * 100;
}

/** Flujo de caja con financiamiento = flujo operativo actual − servicio de deuda mensual (spec §14: "flujo de deuda"). */
export function computeCashFlowWithDebtService(operatingCashFlow: number, monthlyDebtService: number): number {
  return operatingCashFlow - monthlyDebtService;
}

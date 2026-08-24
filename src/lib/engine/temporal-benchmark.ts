/**
 * BENCHMARKING TEMPORAL (spec §20/§13: "promedio histórico del propio
 * negocio"; spec §2: "ninguna cifra sin contexto comparativo... vs. período
 * anterior"). Compara el negocio contra su propio historial — nunca contra
 * datos sectoriales externos (eso es §13, bloqueado por falta de una fuente
 * de benchmarks real).
 *
 * Determinístico y puro (spec §0.3/§27): opera solo sobre fotos mensuales ya
 * capturadas (`MonthlySnapshot`, nunca tipeadas a mano — ver
 * src/lib/actions/snapshot-actions.ts). Si hay menos de 2 meses de
 * historia, no hay comparación posible — se devuelve una lista vacía, nunca
 * un delta inventado.
 */

export interface SnapshotLike {
  periodYear: number;
  periodMonth: number; // 1-12
  ventas: number;
  costoVentas: number;
  utilidadBruta: number;
  gastosOperativos: number;
  ebitda: number;
  utilidadNeta: number;
  margenNetoPct: number;
  flujoNeto: number;
  /** `null` cuando el punto de equilibrio no era calculable ese mes (margen de contribución 0). */
  breakEvenAmount: number | null;
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export interface PeriodChange {
  deltaAbs: number;
  /** `null` cuando el período anterior es 0 — no hay una variación porcentual significativa que reportar. */
  deltaPct: number | null;
}

export function computePeriodChange(current: number, previous: number): PeriodChange {
  const deltaAbs = current - previous;
  const deltaPct = previous !== 0 ? (deltaAbs / Math.abs(previous)) * 100 : null;
  return { deltaAbs, deltaPct };
}

export function sortSnapshots<T extends { periodYear: number; periodMonth: number }>(snapshots: T[]): T[] {
  return [...snapshots].sort((a, b) => a.periodYear - b.periodYear || a.periodMonth - b.periodMonth);
}

export function findPreviousMonth<T extends SnapshotLike>(snapshots: T[], year: number, month: number): T | null {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return snapshots.find((s) => s.periodYear === prevYear && s.periodMonth === prevMonth) ?? null;
}

export function findSameMonthLastYear<T extends SnapshotLike>(snapshots: T[], year: number, month: number): T | null {
  return snapshots.find((s) => s.periodYear === year - 1 && s.periodMonth === month) ?? null;
}

export type TemporalMetricKey = "ventas" | "margenNetoPct" | "ebitda" | "utilidadNeta" | "flujoNeto";

export interface TemporalPoint {
  year: number;
  month: number;
  value: number;
}

/** Serie ordenada cronológicamente para graficar una métrica a lo largo del tiempo. */
export function buildTemporalSeries(snapshots: SnapshotLike[], metric: TemporalMetricKey): TemporalPoint[] {
  return sortSnapshots(snapshots).map((s) => ({ year: s.periodYear, month: s.periodMonth, value: s[metric] }));
}

export type TrendAlertSeverity = "info" | "warning" | "danger";

export interface TrendAlert {
  id: string;
  severity: TrendAlertSeverity;
  message: string;
  recommendation: string;
}

const COST_INCREASE_THRESHOLD_PCT = 18;
const MARGIN_DROP_THRESHOLD_PTS = 7;

/**
 * Alertas de tendencia mes-a-mes que el Alert Engine no podía evaluar sin
 * historia (documentado como pendiente hasta ahora): costos que suben
 * fuerte, margen que cae, flujo de caja negativo dos meses seguidos, y
 * punto de equilibrio que sube. Compara solo los dos meses más recientes
 * capturados — no asume que sean consecutivos en el calendario (si hay un
 * hueco, ver 5c del diseño: nunca se interpola, se compara contra la última
 * foto real disponible).
 */
export function detectTrendAlerts(snapshots: SnapshotLike[]): TrendAlert[] {
  const sorted = sortSnapshots(snapshots);
  if (sorted.length < 2) return [];

  const current = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];
  const alerts: TrendAlert[] = [];

  const costoTotalActual = current.costoVentas + current.gastosOperativos;
  const costoTotalAnterior = previous.costoVentas + previous.gastosOperativos;
  const costChange = computePeriodChange(costoTotalActual, costoTotalAnterior);
  if (costChange.deltaPct != null && costChange.deltaPct >= COST_INCREASE_THRESHOLD_PCT) {
    alerts.push({
      id: "costos_suben",
      severity: "warning",
      message: `Tus costos totales subieron ${costChange.deltaPct.toFixed(0)}% respecto al mes anterior capturado.`,
      recommendation: "Revisa qué costo fijo o variable creció y si es sostenible.",
    });
  }

  const marginDrop = previous.margenNetoPct - current.margenNetoPct;
  if (marginDrop >= MARGIN_DROP_THRESHOLD_PTS) {
    alerts.push({
      id: "margen_cae",
      severity: "warning",
      message: `Tu margen neto cayó ${marginDrop.toFixed(1)} puntos respecto al mes anterior capturado.`,
      recommendation: "Compara precios y costo variable de este mes contra el anterior en Mi Negocio.",
    });
  }

  if (current.flujoNeto < 0 && previous.flujoNeto < 0) {
    alerts.push({
      id: "flujo_negativo_consecutivo",
      severity: "danger",
      message: "Tu flujo de caja lleva 2 meses consecutivos en negativo.",
      recommendation: "Revisa costos fijos, cobros pendientes o una línea de crédito de corto plazo.",
    });
  }

  if (isFiniteNumber(current.breakEvenAmount) && isFiniteNumber(previous.breakEvenAmount)) {
    const beChange = computePeriodChange(current.breakEvenAmount, previous.breakEvenAmount);
    if (beChange.deltaPct != null && beChange.deltaPct > 0) {
      alerts.push({
        id: "punto_equilibrio_subio",
        severity: "info",
        message: `Tu punto de equilibrio subió ${beChange.deltaPct.toFixed(0)}% respecto al mes anterior capturado — necesitas vender más para no perder dinero.`,
        recommendation: "Revisa si subieron tus costos fijos o bajó tu margen de contribución.",
      });
    }
  }

  return alerts;
}

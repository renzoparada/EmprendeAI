/**
 * ALERT ENGINE — alertas automáticas deterministas (spec §12: "Alertas
 * automáticas... cada alerta incluye explicación IA y recomendación de
 * acción"). El motor detecta el hecho y arma una recomendación base con
 * reglas fijas — nunca con IA (spec §0.3/§27). La capa de IA (ver
 * `src/lib/ai/alert-narrative.ts`) solo puede REDACTAR una explicación más
 * conversacional sobre una alerta que este motor ya detectó: nunca decide
 * si una alerta existe, nunca cambia su severidad, nunca agrega una cifra
 * que no esté aquí.
 *
 * Las alertas de tendencia que la spec §12 menciona ("costos +18%", "margen
 * −7%", "flujo de caja negativo en 2 meses") necesitan comparar contra un
 * período anterior — vienen del Temporal Benchmark Engine
 * (`src/lib/engine/temporal-benchmark.ts`), que opera sobre fotos mensuales
 * reales (`MonthlySnapshot`, spec §20). Sin al menos 2 meses de historia
 * capturada, esas alertas simplemente no aparecen — nunca se inventa una
 * tendencia con un solo punto de datos.
 */

import type { CompanySnapshot } from "@/lib/engine/financial";
import type { LtvCacResult } from "@/lib/engine/funnel";
import type { GoalTargetType } from "@/lib/engine/goals";
import { detectTrendAlerts, type SnapshotLike } from "@/lib/engine/temporal-benchmark";

export type AlertSeverity = "info" | "warning" | "danger";
export type AlertCategory = "financiero" | "comercial" | "financiamiento" | "metas" | "tendencia";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  message: string;
  recommendation: string;
}

export interface ProductProfitability {
  productId: string;
  name: string;
  unitMarginPct: number;
}

export interface AlertContext {
  hasData: boolean;
  snapshot: CompanySnapshot | null;
  products: ProductProfitability[];
  funnel?: { ltvCac: LtvCacResult } | null;
  financing?: { monthlyDebtService: number } | null;
  goal?: { progressPct: number; targetType: GoalTargetType } | null;
  /** Fotos mensuales reales (spec §20) — sin esto, no hay alertas de tendencia. */
  history?: SnapshotLike[];
}

/** Diferencia mínima de margen (puntos porcentuales) entre el mejor y el peor producto para que valga la pena señalarla. */
const PROFITABILITY_SPREAD_THRESHOLD_PCT = 15;

export function buildAlerts(ctx: AlertContext): Alert[] {
  if (!ctx.hasData || !ctx.snapshot) {
    return [
      {
        id: "sin_datos",
        severity: "info",
        category: "financiero",
        message: "Todavía no cargaste productos ni costos.",
        recommendation: "Ve a Mi Negocio y Estructura de Costos para activar el resto de las alertas.",
      },
    ];
  }

  const { snapshot } = ctx;
  const alerts: Alert[] = [];

  if (snapshot.cashFlow.alertaFlujoNegativo) {
    alerts.push({
      id: "flujo_negativo",
      severity: "danger",
      category: "financiero",
      message: "Tu flujo de caja del mes es negativo.",
      recommendation: "Revisa costos fijos o el ritmo de ventas, o negocia plazos con proveedores.",
    });
  }

  if (snapshot.statement.margenNetoPct < 10) {
    alerts.push({
      id: "margen_bajo",
      severity: "warning",
      category: "financiero",
      message: `Tu margen neto (${snapshot.statement.margenNetoPct.toFixed(1)}%) está por debajo del 10%.`,
      recommendation: "Revisa precios y costo variable por producto en Mi Negocio y Precificación.",
    });
  }

  if (Number.isFinite(snapshot.breakEven.amount) && snapshot.statement.ventas < snapshot.breakEven.amount) {
    alerts.push({
      id: "bajo_punto_equilibrio",
      severity: "warning",
      category: "financiero",
      message: "Tus ventas están por debajo del punto de equilibrio.",
      recommendation: "Prioriza aumentar ventas o reducir costos fijos.",
    });
  }

  if (ctx.products.length >= 2) {
    const sorted = [...ctx.products].sort((a, b) => b.unitMarginPct - a.unitMarginPct);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    if (worst.unitMarginPct < 0) {
      alerts.push({
        id: "producto_margen_negativo",
        severity: "danger",
        category: "financiero",
        message: `"${worst.name}" tiene margen unitario negativo (${worst.unitMarginPct.toFixed(1)}%) — pierdes dinero en cada venta.`,
        recommendation: "Sube el precio, reduce su costo variable, o evalúa descontinuarlo.",
      });
    } else if (best.unitMarginPct - worst.unitMarginPct >= PROFITABILITY_SPREAD_THRESHOLD_PCT) {
      alerts.push({
        id: "producto_mas_rentable",
        severity: "info",
        category: "financiero",
        message: `"${best.name}" es tu producto más rentable (${best.unitMarginPct.toFixed(1)}% de margen); "${worst.name}" es el menos rentable (${worst.unitMarginPct.toFixed(1)}%).`,
        recommendation: "Prioriza vender más del producto de mayor margen en tus campañas y promociones.",
      });
    }
  }

  if (ctx.funnel && ctx.funnel.ltvCac.cac > 0 && !ctx.funnel.ltvCac.healthy) {
    alerts.push({
      id: "ltv_cac_bajo",
      severity: "warning",
      category: "comercial",
      message: `Tu relación LTV/CAC (${ctx.funnel.ltvCac.ratio.toFixed(1)}x) está por debajo del mínimo saludable de 3x.`,
      recommendation: "Reduce el costo de adquisición en tu embudo o aumenta la frecuencia/vida útil del cliente.",
    });
  }

  if (ctx.financing && ctx.financing.monthlyDebtService > 0 && ctx.financing.monthlyDebtService > snapshot.cashFlow.flujoNeto) {
    alerts.push({
      id: "servicio_deuda_alto",
      severity: "danger",
      category: "financiamiento",
      message: "El servicio de deuda mensual supera tu flujo de caja operativo.",
      recommendation: "Revisa tus fuentes de financiamiento — negocia un período de gracia o un plazo mayor.",
    });
  }

  if (ctx.goal && ctx.goal.progressPct < 50) {
    alerts.push({
      id: "meta_lejos",
      severity: "info",
      category: "metas",
      message: `Vas al ${Math.max(0, ctx.goal.progressPct).toFixed(0)}% de tu meta de ${ctx.goal.targetType === "VENTAS" ? "ventas" : "utilidad neta"}.`,
      recommendation: "Revisa el plan de acción en Mis Metas para saber qué necesitas mejorar.",
    });
  }

  if (ctx.history && ctx.history.length >= 2) {
    for (const trend of detectTrendAlerts(ctx.history)) {
      alerts.push({ id: trend.id, severity: trend.severity, category: "tendencia", message: trend.message, recommendation: trend.recommendation });
    }
  }

  return alerts;
}

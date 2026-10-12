/**
 * RISK ENGINE — matriz de riesgos determinística (spec §17.1: "filtrada al
 * negocio, no genérica"). En vez de pedirle a la IA que "invente" una matriz
 * de riesgos (spec §0.3 lo prohíbe), este motor evalúa reglas objetivas
 * sobre los resultados del Financial Engine y solo devuelve los riesgos que
 * realmente se activan con los datos del negocio — nunca una lista genérica.
 */
import { computePaybackMonths, type CompanySnapshot } from "@/lib/engine/financial";

export type RiskProbability = "baja" | "media" | "alta";
export type RiskLevel = "bajo" | "medio" | "alto";

export interface RiskRow {
  id: string;
  risk: string;
  probability: RiskProbability;
  impact: RiskLevel;
  level: RiskLevel;
  mitigation: string;
}

const PROBABILITY_SCORE: Record<RiskProbability, number> = { baja: 1, media: 2, alta: 3 };
const LEVEL_SCORE: Record<RiskLevel, number> = { bajo: 1, medio: 2, alto: 3 };

/** Matriz de riesgo estándar 3×3 (probabilidad × impacto → nivel). */
export function deriveRiskLevel(probability: RiskProbability, impact: RiskLevel): RiskLevel {
  const score = PROBABILITY_SCORE[probability] * LEVEL_SCORE[impact];
  if (score >= 6) return "alto";
  if (score >= 3) return "medio";
  return "bajo";
}

function row(id: string, risk: string, probability: RiskProbability, impact: RiskLevel, mitigation: string): RiskRow {
  return { id, risk, probability, impact, level: deriveRiskLevel(probability, impact), mitigation };
}

export interface RiskMatrixInput {
  hasData: boolean;
  snapshot: CompanySnapshot | null;
  inversionTotal: number;
}

export function computeRiskMatrix({ hasData, snapshot, inversionTotal }: RiskMatrixInput): RiskRow[] {
  if (!hasData || !snapshot) return [];

  const risks: RiskRow[] = [];
  const { statement, cashFlow, breakEven, economics } = snapshot;

  if (cashFlow.alertaFlujoNegativo) {
    risks.push(
      row(
        "flujo_negativo",
        "Flujo de caja negativo en el mes",
        "alta",
        "alto",
        "Reduce costos fijos, negocia plazos con proveedores o gestiona una línea de crédito de corto plazo."
      )
    );
  }

  if (Number.isFinite(breakEven.amount) && statement.ventas < breakEven.amount) {
    const muyPorDebajo = statement.ventas < breakEven.amount * 0.8;
    risks.push(
      row(
        "bajo_punto_equilibrio",
        "Ventas por debajo del punto de equilibrio",
        muyPorDebajo ? "alta" : "media",
        "alto",
        "Prioriza acciones para aumentar ventas (marketing, canales, precios) o reduce costos fijos para bajar el punto de equilibrio."
      )
    );
  }

  if (statement.margenNetoPct < 10) {
    risks.push(
      row(
        "margen_bajo",
        "Margen neto por debajo del 10%",
        "media",
        statement.margenNetoPct < 0 ? "alto" : "medio",
        "Revisa precios y costo variable por producto en Mi Negocio y en Precificación Inteligente."
      )
    );
  }

  const totalContribution = economics.reduce((sum, e) => sum + e.marginalContribution, 0);
  if (economics.length > 1 && totalContribution > 0) {
    const maxShare = Math.max(...economics.map((e) => e.marginalContribution / totalContribution));
    if (maxShare > 0.6) {
      risks.push(
        row(
          "concentracion_producto",
          "Alta concentración de la utilidad en un solo producto/servicio",
          "media",
          "medio",
          "Diversifica tu oferta o fortalece la venta de otros productos para reducir la dependencia de uno solo."
        )
      );
    }
  }

  const paybackMonths = computePaybackMonths(inversionTotal, cashFlow.flujoNeto);
  if (inversionTotal > 0 && (!Number.isFinite(paybackMonths) || paybackMonths > 36)) {
    risks.push(
      row(
        "payback_largo",
        "Período de recuperación de la inversión muy largo (>36 meses)",
        "media",
        "medio",
        "Revisa el monto de inversión inicial o mejora el flujo de caja mensual para acortar el período de recuperación."
      )
    );
  }

  return risks;
}

/**
 * Ensambla el componente estándar "Riesgos y Escenarios" (spec §17) en el
 * formato JSON exacto de la spec §17.4. El motor financiero calcula primero
 * `results`, `assumptions` y `sensitivity_ranking` (contexto de solo
 * lectura); la IA solo redacta `narrative.*` por escenario
 * (scenario-narrative.ts). Este módulo valida el objeto final contra el
 * esquema Zod antes de devolverlo — "un JSON inválido no se publica".
 */
import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { buildCompanySnapshot, computeRoi, totalInvestment } from "@/lib/engine/financial";
import { applyScenario, DEFAULT_SCENARIO_DELTAS, type ScenarioType } from "@/lib/engine/scenarios";
import { computeSensitivityRanking } from "@/lib/engine/sensitivity";
import { computeSolidityIndicator } from "@/lib/engine/solidity";
import { toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";
import { generateScenarioNarrative, ScenarioNarrativeSchema } from "@/lib/ai/scenario-narrative";

const SCENARIO_TYPES: ScenarioType[] = ["PESIMISTA", "BASE", "OPTIMISTA"];
const SCENARIO_TYPE_TO_SPEC = { PESIMISTA: "pesimista", BASE: "base", OPTIMISTA: "optimista" } as const;

export const RiskAndScenarioReportSchema = z.object({
  report_id: z.string(),
  company_id: z.string(),
  generated_at: z.string(),
  currency: z.string(),
  language: z.literal("es"),
  scenarios: z.array(
    z.object({
      scenario_type: z.enum(["pesimista", "base", "optimista"]),
      is_manual_override: z.boolean(),
      override_date: z.string().nullable(),
      assumptions: z.array(z.object({ variable: z.string(), change_pct: z.number(), unit: z.string() })),
      results: z.object({
        ingresos: z.number(),
        costos: z.number(),
        utilidad_neta: z.number(),
        utilidad_neta_vs_base_pct: z.number().nullable(),
        flujo_caja_mes_negativo_desde: z.number().nullable(),
        roi_pct: z.number(),
        payback_meses: z.number().nullable(),
      }),
      probability: z.object({ defined_by_user: z.boolean(), value_pct: z.number().nullable() }),
      narrative: ScenarioNarrativeSchema.nullable(),
      missing_data: z.array(z.string()).optional(),
      data_confidence: z.enum(["real", "proyectado", "supuesto", "mixto"]),
    })
  ),
  sensitivity_ranking: z.array(z.object({ variable: z.string(), impact_pct_on_utilidad: z.number() })),
  solidity_indicator: z.enum(["verde", "amarillo", "rojo"]),
});

export type RiskAndScenarioReport = z.infer<typeof RiskAndScenarioReportSchema>;

export async function buildRiskAndScenarioReport(companyId: string): Promise<RiskAndScenarioReport | null> {
  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
  const [products, fixedCosts, variableCosts, investments, scenarios] = await Promise.all([
    prisma.product.findMany({ where: { companyId } }),
    prisma.fixedCost.findMany({ where: { companyId } }),
    prisma.variableCost.findMany({ where: { companyId } }),
    prisma.investment.findMany({ where: { companyId } }),
    prisma.scenario.findMany({ where: { companyId } }),
  ]);

  if (products.length === 0) return null; // sin datos reales no hay nada que narrar (spec §0.3)

  const engineProducts = toEngineProducts(products);
  const engineFixedCosts = toEngineFixedCosts(fixedCosts);
  const engineVariableCosts = toEngineVariableCosts(variableCosts);
  const inversionTotal = totalInvestment(investments.map((i) => i.amount));

  const baseSnapshot = buildCompanySnapshot(engineProducts, engineVariableCosts, engineFixedCosts, company.taxRatePct);
  const baseUtilidad = baseSnapshot.statement.utilidadNeta;

  const sensitivityRanking = computeSensitivityRanking(
    { products: engineProducts, fixedCosts: engineFixedCosts, variableCosts: engineVariableCosts },
    company.taxRatePct
  )
    .slice(0, 5)
    .map((s) => ({ variable: s.variable, impact_pct_on_utilidad: Number(s.impactPctOnUtilidad.toFixed(1)) }));

  const scenarioEntries = await Promise.all(
    SCENARIO_TYPES.map(async (type) => {
      const stored = scenarios.find((s) => s.type === type);
      const deltas = stored
        ? { type, salesDeltaPct: stored.salesDeltaPct, priceDeltaPct: stored.priceDeltaPct, costDeltaPct: stored.costDeltaPct }
        : { type, ...DEFAULT_SCENARIO_DELTAS[type] };
      const adjusted = applyScenario({ products: engineProducts, fixedCosts: engineFixedCosts, variableCosts: engineVariableCosts }, deltas);
      const snapshot = buildCompanySnapshot(adjusted.products, adjusted.variableCosts, adjusted.fixedCosts, company.taxRatePct);

      const utilidadNetaVsBasePct = type === "BASE" || baseUtilidad === 0 ? null : ((snapshot.statement.utilidadNeta - baseUtilidad) / Math.abs(baseUtilidad)) * 100;
      const roiPct = computeRoi(snapshot.statement.utilidadNeta, inversionTotal);

      const assumptions = [
        { variable: "ventas", change_pct: deltas.salesDeltaPct, unit: "%" },
        { variable: "precio", change_pct: deltas.priceDeltaPct, unit: "%" },
        { variable: "costos", change_pct: deltas.costDeltaPct, unit: "%" },
      ].filter((a) => a.change_pct !== 0);

      const results = {
        ingresos: Math.round(snapshot.statement.ventas),
        costos: Math.round(snapshot.statement.costoVentas + snapshot.statement.gastosOperativos),
        utilidad_neta: Math.round(snapshot.statement.utilidadNeta),
        utilidad_neta_vs_base_pct: utilidadNetaVsBasePct != null ? Number(utilidadNetaVsBasePct.toFixed(1)) : null,
        flujo_caja_mes_negativo_desde: snapshot.cashFlow.alertaFlujoNegativo ? 1 : null,
        roi_pct: Number(roiPct.toFixed(1)),
        payback_meses: null,
      };

      const { narrative, missingData } = await generateScenarioNarrative({
        companyName: company.name,
        currency: company.currency,
        scenarioType: SCENARIO_TYPE_TO_SPEC[type],
        assumptions,
        results,
        resultsVsBasePct: utilidadNetaVsBasePct,
      });

      return {
        scenario_type: SCENARIO_TYPE_TO_SPEC[type],
        is_manual_override: !!stored,
        override_date: stored ? stored.updatedAt.toISOString() : null,
        assumptions,
        results,
        probability: { defined_by_user: false, value_pct: null },
        narrative,
        missing_data: missingData.length > 0 ? missingData : undefined,
        data_confidence: type === "BASE" ? ("real" as const) : ("supuesto" as const),
      };
    })
  );

  const report = {
    report_id: `rpt_${companyId}_${Date.now()}`,
    company_id: companyId,
    generated_at: new Date().toISOString(),
    currency: company.currency,
    language: "es" as const,
    scenarios: scenarioEntries,
    sensitivity_ranking: sensitivityRanking,
    solidity_indicator: (() => {
      const level = computeSolidityIndicator(true, baseSnapshot);
      return level === "neutral" ? "verde" : level;
    })(),
  };

  const validated = RiskAndScenarioReportSchema.safeParse(report);
  if (!validated.success) {
    console.error("RiskAndScenarioReport inválido, no se publica:", validated.error.flatten());
    return null;
  }
  return validated.data;
}

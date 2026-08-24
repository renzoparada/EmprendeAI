"use server";

import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { buildCompanySnapshot, totalInvestment } from "@/lib/engine/financial";
import { computeRiskMatrix, type RiskRow } from "@/lib/engine/risk";
import { toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";
import { buildRiskAndScenarioReport, type RiskAndScenarioReport } from "@/lib/ai/risk-and-scenario-report";

export interface RiskAndScenarioResult {
  report: RiskAndScenarioReport | null;
  risks: RiskRow[];
  error?: string;
}

/**
 * Genera el componente "Riesgos y Escenarios" completo (spec §17): la parte
 * determinística (matriz de riesgos, sensibilidad, resultados por escenario)
 * siempre se calcula; la narrativa por escenario solo se agrega si la IA
 * está configurada y devuelve un JSON válido (spec §17.4).
 */
export async function generateRiskAndScenarioReport(): Promise<RiskAndScenarioResult> {
  const { company } = await requireCompany();

  const [products, fixedCosts, variableCosts, investments] = await Promise.all([
    prisma.product.findMany({ where: { companyId: company.id } }),
    prisma.fixedCost.findMany({ where: { companyId: company.id } }),
    prisma.variableCost.findMany({ where: { companyId: company.id } }),
    prisma.investment.findMany({ where: { companyId: company.id } }),
  ]);

  const hasData = products.length > 0;
  const snapshot = hasData
    ? buildCompanySnapshot(toEngineProducts(products), toEngineVariableCosts(variableCosts), toEngineFixedCosts(fixedCosts), company.taxRatePct)
    : null;
  const inversionTotal = totalInvestment(investments.map((i) => i.amount));
  const risks = computeRiskMatrix({ hasData, snapshot, inversionTotal });

  if (!hasData) {
    return { report: null, risks, error: "Carga productos y costos para generar este análisis." };
  }

  const report = await buildRiskAndScenarioReport(company.id);
  if (!report) {
    return { report: null, risks, error: "No se pudo generar la narrativa (revisa que ANTHROPIC_API_KEY esté configurada)." };
  }

  return { report, risks };
}

/**
 * Construye el contexto de solo lectura que se le pasa al chat EMPRENDE AI
 * (spec §10/§27): siempre los mismos motores determinísticos que alimentan
 * el Dashboard y Escenarios, nunca cifras calculadas "a mano" por la IA.
 */
import { prisma } from "@/lib/db";
import {
  buildCompanySnapshot,
  computeProductEconomics,
  computeRoi,
  totalInvestment,
  type CompanySnapshot,
} from "@/lib/engine/financial";
import { applyScenario, DEFAULT_SCENARIO_DELTAS, type ScenarioType } from "@/lib/engine/scenarios";
import { toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";

const SCENARIO_TYPES: ScenarioType[] = ["PESIMISTA", "BASE", "OPTIMISTA"];

export interface AIScenarioSummary {
  ventas: number;
  utilidadNeta: number;
  margenNetoPct: number;
  salesDeltaPct: number;
  priceDeltaPct: number;
  costDeltaPct: number;
}

export interface AIProductSummary {
  name: string;
  price: number;
  unitVariableCost: number;
  unitMarginPct: number;
  unitsSoldMonthly: number;
}

export interface AIContext {
  company: {
    name: string;
    currency: string;
    sector: string | null;
    businessType: string;
    operatingStage: string;
    taxRatePct: number;
  };
  hasData: boolean;
  base: CompanySnapshot | null;
  scenarios: Partial<Record<ScenarioType, AIScenarioSummary>>;
  products: AIProductSummary[];
  inversionTotal: number;
  roiBase: number;
  /** Módulos de la spec que la IA puede mencionar como "todavía no disponibles" si el usuario pregunta por ellos. */
  unavailableModules: string[];
  missingData: string[];
}

export async function buildAIContext(companyId: string): Promise<AIContext> {
  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
  const [products, fixedCosts, variableCosts, investments, scenarios] = await Promise.all([
    prisma.product.findMany({ where: { companyId } }),
    prisma.fixedCost.findMany({ where: { companyId } }),
    prisma.variableCost.findMany({ where: { companyId } }),
    prisma.investment.findMany({ where: { companyId } }),
    prisma.scenario.findMany({ where: { companyId } }),
  ]);

  const engineProducts = toEngineProducts(products);
  const engineFixedCosts = toEngineFixedCosts(fixedCosts);
  const engineVariableCosts = toEngineVariableCosts(variableCosts);
  const hasData = products.length > 0;

  const base = hasData ? buildCompanySnapshot(engineProducts, engineVariableCosts, engineFixedCosts, company.taxRatePct) : null;
  const inversionTotal = totalInvestment(investments.map((i) => i.amount));
  const roiBase = base ? computeRoi(base.statement.utilidadNeta, inversionTotal) : 0;

  const scenarioSummaries: Partial<Record<ScenarioType, AIScenarioSummary>> = {};
  if (hasData) {
    for (const type of SCENARIO_TYPES) {
      const stored = scenarios.find((s) => s.type === type);
      const deltas = stored
        ? { type, salesDeltaPct: stored.salesDeltaPct, priceDeltaPct: stored.priceDeltaPct, costDeltaPct: stored.costDeltaPct }
        : { type, ...DEFAULT_SCENARIO_DELTAS[type] };
      const adjusted = applyScenario({ products: engineProducts, fixedCosts: engineFixedCosts, variableCosts: engineVariableCosts }, deltas);
      const snap = buildCompanySnapshot(adjusted.products, adjusted.variableCosts, adjusted.fixedCosts, company.taxRatePct);
      scenarioSummaries[type] = {
        ventas: snap.statement.ventas,
        utilidadNeta: snap.statement.utilidadNeta,
        margenNetoPct: snap.statement.margenNetoPct,
        salesDeltaPct: deltas.salesDeltaPct,
        priceDeltaPct: deltas.priceDeltaPct,
        costDeltaPct: deltas.costDeltaPct,
      };
    }
  }

  const companyWidePctOfSales = variableCosts.filter((c) => !c.productId).reduce((sum, c) => sum + (c.pctOfSales ?? 0), 0);
  const productSummaries: AIProductSummary[] = products.map((p) => {
    const eco = computeProductEconomics(p, variableCosts, companyWidePctOfSales);
    return {
      name: p.name,
      price: p.price,
      unitVariableCost: eco.unitVariableCost,
      unitMarginPct: eco.unitMarginPct,
      unitsSoldMonthly: p.unitsSoldMonthly,
    };
  });

  const missingData: string[] = [];
  if (products.length === 0) missingData.push("productos o servicios (módulo Mi Negocio)");
  if (fixedCosts.length === 0 && variableCosts.length === 0) missingData.push("costos fijos y variables (módulo Estructura de Costos)");
  if (investments.length === 0) missingData.push("inversión inicial (módulo Inversión Inicial)");

  return {
    company: {
      name: company.name,
      currency: company.currency,
      sector: company.sector,
      businessType: company.businessType,
      operatingStage: company.operatingStage,
      taxRatePct: company.taxRatePct,
    },
    hasData,
    base,
    scenarios: scenarioSummaries,
    products: productSummaries,
    inversionTotal,
    roiBase,
    unavailableModules: [
      "Multimoneda / exposición cambiaria",
      "Sensibilidad y matriz de riesgos",
      "Valoración de empresa y Cap Table",
      "Reportes exportables (PDF/Excel)",
      "Mis Metas",
      "Sales Forecast / embudo comercial",
    ],
    missingData,
  };
}

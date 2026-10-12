/**
 * Agrega los datos que consumen los generadores de PDF/Excel (spec §23.7).
 * Igual que el resto de la plataforma: solo lee resultados ya calculados por
 * el Financial Engine — el generador de reportes nunca calcula nada por su
 * cuenta (spec §0.3/§27).
 */
import { prisma } from "@/lib/db";
import {
  buildCompanySnapshot,
  computeProductEconomics,
  computeRoi,
  totalInvestment,
  type CashFlow,
  type IncomeStatement,
} from "@/lib/engine/financial";
import { applyScenario, DEFAULT_SCENARIO_DELTAS, type ScenarioType } from "@/lib/engine/scenarios";
import { computeSolidityIndicator, type SolidityIndicator } from "@/lib/engine/solidity";
import { toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";
import { FIXED_COST_CATEGORY_LABELS, SCENARIO_TYPE_LABELS, VARIABLE_COST_CATEGORY_LABELS } from "@/lib/constants";

const SCENARIO_TYPES: ScenarioType[] = ["PESIMISTA", "BASE", "OPTIMISTA"];

export interface ReportProductRow {
  name: string;
  price: number;
  unitVariableCost: number;
  unitMarginPct: number;
  unitsSoldMonthly: number;
  marginalContribution: number;
}

export interface ReportCostRow {
  name: string;
  category: string;
  amountMonthly: number;
}

export interface ReportScenarioRow {
  type: ScenarioType;
  label: string;
  ventas: number;
  costos: number;
  utilidadNeta: number;
  margenNetoPct: number;
  roiPct: number;
}

export interface ReportData {
  generatedAt: Date;
  company: {
    name: string;
    currency: string;
    country: string;
    city: string;
    sector: string | null;
    businessType: string;
  };
  hasData: boolean;
  solidity: SolidityIndicator;
  statement: IncomeStatement | null;
  cashFlow: CashFlow | null;
  breakEvenAmount: number | null;
  inversionTotal: number;
  roiPct: number;
  products: ReportProductRow[];
  fixedCosts: ReportCostRow[];
  variableCosts: { name: string; category: string; description: string }[];
  scenarios: ReportScenarioRow[];
}

export async function buildReportData(companyId: string): Promise<ReportData> {
  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
  const [products, fixedCosts, variableCosts, investments, scenarios] = await Promise.all([
    prisma.product.findMany({ where: { companyId }, orderBy: { createdAt: "asc" } }),
    prisma.fixedCost.findMany({ where: { companyId }, orderBy: { createdAt: "asc" } }),
    prisma.variableCost.findMany({ where: { companyId } }),
    prisma.investment.findMany({ where: { companyId } }),
    prisma.scenario.findMany({ where: { companyId } }),
  ]);

  const engineProducts = toEngineProducts(products);
  const engineFixedCosts = toEngineFixedCosts(fixedCosts);
  const engineVariableCosts = toEngineVariableCosts(variableCosts);
  const hasData = products.length > 0;

  const snapshot = hasData ? buildCompanySnapshot(engineProducts, engineVariableCosts, engineFixedCosts, company.taxRatePct) : null;
  const inversionTotal = totalInvestment(investments.map((i) => i.amount));
  const roiPct = snapshot ? computeRoi(snapshot.statement.utilidadNeta, inversionTotal) : 0;

  const companyWidePctOfSales = variableCosts.filter((c) => !c.productId).reduce((sum, c) => sum + (c.pctOfSales ?? 0), 0);
  const productRows: ReportProductRow[] = products.map((p) => {
    const eco = computeProductEconomics(p, variableCosts, companyWidePctOfSales);
    return {
      name: p.name,
      price: p.price,
      unitVariableCost: eco.unitVariableCost,
      unitMarginPct: eco.unitMarginPct,
      unitsSoldMonthly: p.unitsSoldMonthly,
      marginalContribution: eco.marginalContribution,
    };
  });

  const fixedCostRows: ReportCostRow[] = fixedCosts.map((c) => ({
    name: c.name,
    category: FIXED_COST_CATEGORY_LABELS[c.category] ?? c.category,
    amountMonthly: c.periodicity === "ANUAL" ? c.amount / 12 : c.amount,
  }));

  const variableCostRows = variableCosts.map((c) => ({
    name: c.name,
    category: VARIABLE_COST_CATEGORY_LABELS[c.category] ?? c.category,
    description: c.amountPerUnit != null ? `${c.amountPerUnit}/unidad` : c.pctOfSales != null ? `${c.pctOfSales}% de ventas` : "—",
  }));

  const scenarioRows: ReportScenarioRow[] = hasData
    ? SCENARIO_TYPES.map((type) => {
        const stored = scenarios.find((s) => s.type === type);
        const deltas = stored
          ? { type, salesDeltaPct: stored.salesDeltaPct, priceDeltaPct: stored.priceDeltaPct, costDeltaPct: stored.costDeltaPct }
          : { type, ...DEFAULT_SCENARIO_DELTAS[type] };
        const adjusted = applyScenario({ products: engineProducts, fixedCosts: engineFixedCosts, variableCosts: engineVariableCosts }, deltas);
        const scenarioSnapshot = buildCompanySnapshot(adjusted.products, adjusted.variableCosts, adjusted.fixedCosts, company.taxRatePct);
        return {
          type,
          label: SCENARIO_TYPE_LABELS[type],
          ventas: scenarioSnapshot.statement.ventas,
          costos: scenarioSnapshot.statement.costoVentas + scenarioSnapshot.statement.gastosOperativos,
          utilidadNeta: scenarioSnapshot.statement.utilidadNeta,
          margenNetoPct: scenarioSnapshot.statement.margenNetoPct,
          roiPct: computeRoi(scenarioSnapshot.statement.utilidadNeta, inversionTotal),
        };
      })
    : [];

  return {
    generatedAt: new Date(),
    company: {
      name: company.name,
      currency: company.currency,
      country: company.country,
      city: company.city,
      sector: company.sector,
      businessType: company.businessType,
    },
    hasData,
    solidity: computeSolidityIndicator(hasData, snapshot),
    statement: snapshot?.statement ?? null,
    cashFlow: snapshot?.cashFlow ?? null,
    breakEvenAmount: snapshot ? snapshot.breakEven.amount : null,
    inversionTotal,
    roiPct,
    products: productRows,
    fixedCosts: fixedCostRows,
    variableCosts: variableCostRows,
    scenarios: scenarioRows,
  };
}

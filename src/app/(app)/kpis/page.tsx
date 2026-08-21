import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { buildCompanySnapshot, computeRoi, totalInvestment } from "@/lib/engine/financial";
import { computeCAC, computeCostPerLead, computeLTV, computeLtvCacRatio, computeOverallConversionPct } from "@/lib/engine/funnel";
import { computeLeveragedRoi } from "@/lib/engine/financing";
import { buildKpiLibrary, type KpiLibraryFunnelContext } from "@/lib/engine/kpi-library";
import { toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";
import { KpiLibraryGrid } from "@/components/kpis/kpi-library-grid";

export default async function KpisPage() {
  const { company } = await requireCompany();

  const [products, fixedCosts, variableCosts, investments, funnel, financingPlans] = await Promise.all([
    prisma.product.findMany({ where: { companyId: company.id } }),
    prisma.fixedCost.findMany({ where: { companyId: company.id } }),
    prisma.variableCost.findMany({ where: { companyId: company.id } }),
    prisma.investment.findMany({ where: { companyId: company.id } }),
    prisma.salesFunnel.findUnique({ where: { companyId: company.id } }),
    prisma.financingPlan.findMany({ where: { companyId: company.id } }),
  ]);

  const engineProducts = toEngineProducts(products);
  const engineFixedCosts = toEngineFixedCosts(fixedCosts);
  const engineVariableCosts = toEngineVariableCosts(variableCosts);
  const hasData = products.length > 0;

  const snapshot = buildCompanySnapshot(engineProducts, engineVariableCosts, engineFixedCosts, company.taxRatePct);
  const inversionTotal = totalInvestment(investments.map((i) => i.amount));
  const roi = computeRoi(snapshot.statement.utilidadNeta, inversionTotal);

  const totalFinanced = financingPlans.reduce((sum, p) => sum + p.principal, 0);
  const roe = computeLeveragedRoi(snapshot.statement.utilidadNeta, inversionTotal, totalFinanced);

  const funnelContext: KpiLibraryFunnelContext | null = funnel
    ? {
        stages: {
          leads: funnel.leads,
          contactos: funnel.contactos,
          prospectos: funnel.prospectos,
          reuniones: funnel.reuniones,
          cotizaciones: funnel.cotizaciones,
          negociaciones: funnel.negociaciones,
          ventas: funnel.ventas,
        },
        avgTicket: funnel.avgTicket,
        purchaseFrequencyPerYear: funnel.purchaseFrequencyPerYear,
        ltvCac: computeLtvCacRatio(
          computeLTV(funnel.avgTicket, funnel.purchaseFrequencyPerYear, funnel.customerLifetimeYears),
          computeCAC(funnel.marketingSpend, funnel.ventas)
        ),
        costPerLead: computeCostPerLead(funnel.marketingSpend, funnel.leads),
        overallConversionPct: computeOverallConversionPct({
          leads: funnel.leads,
          contactos: funnel.contactos,
          prospectos: funnel.prospectos,
          reuniones: funnel.reuniones,
          cotizaciones: funnel.cotizaciones,
          negociaciones: funnel.negociaciones,
          ventas: funnel.ventas,
        }),
      }
    : null;

  const items = buildKpiLibrary({
    hasData,
    snapshot: hasData ? snapshot : null,
    inversionTotal,
    roi,
    roe,
    funnel: funnelContext,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Biblioteca de KPIs</h1>
        <p className="text-sm text-slate-500">
          Todos los indicadores de la spec §12, agrupados por categoría — cada uno calculado por su motor
          determinístico, o marcado explícitamente como no disponible cuando falta el dato que necesita.
        </p>
      </div>

      <KpiLibraryGrid items={items} currency={company.currency} />
    </div>
  );
}

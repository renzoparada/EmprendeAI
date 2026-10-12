import Link from "next/link";
import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { buildCompanySnapshot, totalInvestment } from "@/lib/engine/financial";
import { computeAllValuationMethods, type ValuationMethod } from "@/lib/engine/valuation";
import { computeRiskMatrix } from "@/lib/engine/risk";
import { computeInvestorReadinessScore } from "@/lib/engine/investor-readiness";
import { toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ValuationRangeDisplay } from "@/components/valoracion/valuation-range-display";
import { MethodResultCard } from "@/components/valoracion/method-result-card";
import { InvestorReadinessCard } from "@/components/valoracion/investor-readiness-card";
import { ValuationAssumptionsForm } from "@/components/valoracion/valuation-assumptions-form";

export default async function ValoracionPage() {
  const { company } = await requireCompany();

  const [products, fixedCosts, variableCosts, investments, assumptions] = await Promise.all([
    prisma.product.findMany({ where: { companyId: company.id } }),
    prisma.fixedCost.findMany({ where: { companyId: company.id } }),
    prisma.variableCost.findMany({ where: { companyId: company.id } }),
    prisma.investment.findMany({ where: { companyId: company.id } }),
    prisma.valuationAssumptions.findUnique({ where: { companyId: company.id } }),
  ]);

  const engineProducts = toEngineProducts(products);
  const engineFixedCosts = toEngineFixedCosts(fixedCosts);
  const engineVariableCosts = toEngineVariableCosts(variableCosts);
  const hasData = products.length > 0;

  const snapshot = buildCompanySnapshot(engineProducts, engineVariableCosts, engineFixedCosts, company.taxRatePct);
  const inversionTotal = totalInvestment(investments.map((i) => i.amount));
  const hasRevenue = snapshot.statement.ventas > 0;

  const defaultAssumptions = {
    riskFreeRatePct: 5,
    beta: 1,
    marketReturnPct: 10,
    costOfDebtPct: 8,
    debtRatioPct: 0,
    fclGrowthPct: 5,
    terminalGrowthPct: 3,
    projectionYears: 5,
    evEbitdaMultiple: null,
    evSalesMultiple: null,
    peMultiple: null,
    berkusFactorCap: 500000,
    berkusIdea: 0,
    berkusPrototype: 0,
    berkusTeam: 0,
    berkusRelationships: 0,
    berkusInitialSales: 0,
    scorecardComparableAvg: null,
    scorecardManagementScorePct: 100,
    scorecardOpportunityScorePct: 100,
    scorecardProductScorePct: 100,
    scorecardCompetitionScorePct: 100,
    scorecardMarketingScorePct: 100,
    scorecardNeedInvestmentScorePct: 100,
    vcExitValueProjected: null,
    vcRequiredReturnMultiple: 10,
    vcInvestmentAmount: null,
  };

  const valuation = computeAllValuationMethods({
    hasRevenue,
    operatingStage: company.operatingStage,
    ebitAnnual: snapshot.statement.ebit * 12,
    ebitdaAnnual: snapshot.statement.ebitda * 12,
    salesAnnual: snapshot.statement.ventas * 12,
    netIncomeAnnual: snapshot.statement.utilidadNeta * 12,
    taxRatePct: company.taxRatePct,
    assumptions: assumptions ?? defaultAssumptions,
  });

  const risks = computeRiskMatrix({ hasData, snapshot, inversionTotal });
  const readiness = computeInvestorReadinessScore({
    hasProducts: products.length > 0,
    hasCosts: fixedCosts.length > 0 || variableCosts.length > 0,
    hasInvestment: investments.length > 0,
    marginNetoPct: hasData ? snapshot.statement.margenNetoPct : null,
    cashFlowPositive: hasData ? !snapshot.cashFlow.alertaFlujoNegativo : null,
    hasProductConcentrationRisk: risks.some((r) => r.id === "concentracion_producto"),
    activeRiskCount: risks.length,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Valoración</h1>
          <p className="text-sm text-slate-500">
            {hasRevenue && company.operatingStage === "OPERANDO"
              ? "Negocio con ingresos activos: DCF, Múltiplos y Capitalización de utilidades (spec §16.1)."
              : "Etapa temprana: Berkus, Scorecard y VC Method (spec §16.1)."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/socios">Socios / Cap Table →</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Rango de valoración</CardTitle>
          <CardDescription>Mínimo — probable — máximo, nunca una cifra única (spec §16.1).</CardDescription>
        </CardHeader>
        <CardContent>
          <ValuationRangeDisplay range={valuation.range} currency={company.currency} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {valuation.selectedMethods.map((method: ValuationMethod) => (
          <MethodResultCard key={method} method={method} detail={valuation.methodDetails[method]} currency={company.currency} />
        ))}
      </div>

      <InvestorReadinessCard result={readiness} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Supuestos de valoración</CardTitle>
          <CardDescription>Editables en línea — todos marcados como supuesto del usuario (spec §0.3/§21.5).</CardDescription>
        </CardHeader>
        <CardContent>
          <ValuationAssumptionsForm assumptions={assumptions} methods={valuation.selectedMethods} />
        </CardContent>
      </Card>
    </div>
  );
}

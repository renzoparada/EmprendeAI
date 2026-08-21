import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { buildCompanySnapshot, computePaybackMonths, computeRoi, totalInvestment } from "@/lib/engine/financial";
import { projectWithGrowth } from "@/lib/engine/projection";
import { computeAllValuationMethods } from "@/lib/engine/valuation";
import { computeRiskMatrix } from "@/lib/engine/risk";
import { computeInvestorReadinessScore } from "@/lib/engine/investor-readiness";
import { toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KpiCard } from "@/components/shared/kpi-card";
import { VanTirCalculator } from "@/components/inversion/van-tir-calculator";
import { ValuationRangeDisplay } from "@/components/valoracion/valuation-range-display";
import { InvestorReadinessCard } from "@/components/valoracion/investor-readiness-card";
import { CapTableView } from "@/components/socios/cap-table-view";
import { ProjectionChart, type ProjectionPoint } from "@/components/inversionistas/projection-chart";
import { formatCurrency } from "@/lib/utils";

const PROJECTION_YEARS = 5;
const DEFAULT_ANNUAL_GROWTH_PCT = 5;

export default async function InversionistasPage() {
  const { company } = await requireCompany();

  const [products, fixedCosts, variableCosts, investments, shareholders, capTableEntries, assumptions] = await Promise.all([
    prisma.product.findMany({ where: { companyId: company.id } }),
    prisma.fixedCost.findMany({ where: { companyId: company.id } }),
    prisma.variableCost.findMany({ where: { companyId: company.id } }),
    prisma.investment.findMany({ where: { companyId: company.id } }),
    prisma.shareholder.findMany({ where: { companyId: company.id }, orderBy: { createdAt: "asc" } }),
    prisma.capTableEntry.findMany({ where: { companyId: company.id }, orderBy: { createdAt: "asc" } }),
    prisma.valuationAssumptions.findUnique({ where: { companyId: company.id } }),
  ]);

  const engineProducts = toEngineProducts(products);
  const engineFixedCosts = toEngineFixedCosts(fixedCosts);
  const engineVariableCosts = toEngineVariableCosts(variableCosts);
  const hasData = products.length > 0;

  const snapshot = buildCompanySnapshot(engineProducts, engineVariableCosts, engineFixedCosts, company.taxRatePct);
  const inversionTotal = totalInvestment(investments.map((i) => i.amount));
  const hasRevenue = snapshot.statement.ventas > 0;
  const roi = computeRoi(snapshot.statement.utilidadNeta, inversionTotal);
  const payback = computePaybackMonths(inversionTotal, snapshot.cashFlow.flujoNeto);

  const projectedVentas = projectWithGrowth(snapshot.statement.ventas * 12, DEFAULT_ANNUAL_GROWTH_PCT, PROJECTION_YEARS);
  const projectedUtilidad = projectWithGrowth(snapshot.statement.utilidadNeta * 12, DEFAULT_ANNUAL_GROWTH_PCT, PROJECTION_YEARS);
  const projectionData: ProjectionPoint[] = projectedVentas.map((ventas, i) => ({
    year: `Año ${i + 1}`,
    ventas,
    utilidadNeta: projectedUtilidad[i],
  }));

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
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard para Inversores</h1>
        <p className="text-sm text-slate-500">
          La vista que le mostrarías a un inversionista: capital, retorno, proyección, valoración y cap table (spec §19).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Capital invertido"
          value={formatCurrency(inversionTotal, company.currency)}
          helperText="Suma de Inversión Inicial"
          explanation={{
            meaning: "El capital total ya registrado como inversión inicial del negocio.",
            why: "Es la base para calcular ROI, payback y el rango de valoración.",
            howCalculated: "Capital Invertido = Σ montos de todos los ítems de Inversión Inicial (spec §5).",
            isGoodOrBad: "No aplica bien/mal — es un dato de referencia para el inversionista.",
            whatToDo: "Mantenlo actualizado en Inversión Inicial a medida que cargues nuevos ítems.",
          }}
        />
        <KpiCard
          label="Ventas (mes)"
          value={formatCurrency(snapshot.statement.ventas, company.currency)}
          helperText="Dato real, según lo cargado en Mi Negocio"
          explanation={{
            meaning: "El total de ingresos por ventas del mes, calculado por el Financial Engine.",
            why: "Es la métrica de tracción que un inversionista revisa primero.",
            howCalculated: "Ventas = Σ (Precio neto × Unidades vendidas) de cada producto/servicio (fórmula 21.1).",
            isGoodOrBad: "Compárala contra el punto de equilibrio y la proyección de 5 años de abajo.",
            whatToDo: "Si es baja o nula, carga tus productos/servicios en Mi Negocio.",
          }}
        />
        <KpiCard
          label="ROI"
          value={`${roi.toFixed(1)}%`}
          status={roi >= 15 ? "verde" : roi >= 0 ? "amarillo" : "rojo"}
          explanation={{
            meaning: "El retorno que genera la utilidad neta actual sobre el capital invertido.",
            why: "Le dice al inversionista si el negocio, con su rentabilidad actual, justifica el capital ya puesto.",
            howCalculated: "ROI (%) = (Utilidad Neta / Inversión Total) × 100 — fórmula 21.3.",
            isGoodOrBad: roi >= 15 ? "Saludable para la mayoría de negocios." : roi >= 0 ? "Positivo pero ajustado." : "Negativo: la inversión no se recupera al ritmo actual.",
            whatToDo: "Mejora precios, costos o mix de productos en Mi Negocio para elevarlo.",
          }}
        />
        <KpiCard
          label="Payback"
          value={Number.isFinite(payback) ? `${payback.toFixed(1)} meses` : "—"}
          explanation={{
            meaning: "El tiempo estimado para recuperar el capital invertido con el flujo de caja actual.",
            why: "Cuanto más corto, más rápido un inversionista recupera su exposición al riesgo.",
            howCalculated: "Payback (meses) = Inversión Inicial / Flujo de Caja Promedio Mensual — fórmula 21.3.",
            isGoodOrBad: Number.isFinite(payback) && payback <= 24 ? "Razonable para un negocio en marcha." : "Largo — revisa el flujo de caja en el Dashboard.",
            whatToDo: "Mejora el flujo de caja mensual para acortar este plazo.",
          }}
        />
        <KpiCard
          label="EBITDA (mes)"
          value={formatCurrency(snapshot.statement.ebitda, company.currency)}
          explanation={{
            meaning: "La utilidad operativa del mes, antes de depreciación, intereses e impuestos.",
            why: "Es la métrica de rentabilidad operativa que más usan los inversionistas para comparar negocios.",
            howCalculated: "EBITDA = Utilidad Bruta − Gastos Operativos (spec §8).",
            isGoodOrBad: "Debe ser positivo de forma sostenida.",
            whatToDo: "Si es negativo, revisa Estructura de Costos.",
          }}
        />
        <KpiCard
          label="Utilidad Neta (mes)"
          value={formatCurrency(snapshot.statement.utilidadNeta, company.currency)}
          status={snapshot.statement.utilidadNeta > 0 ? "verde" : "rojo"}
          explanation={{
            meaning: "Lo que queda del negocio después de todos los costos, gastos e impuestos.",
            why: "Es la cifra final de rentabilidad — la que sostiene el negocio en el largo plazo.",
            howCalculated: "Utilidad Neta = EBIT − Impuestos (spec §8).",
            isGoodOrBad: snapshot.statement.utilidadNeta > 0 ? "Positiva: el negocio genera utilidad." : "Negativa o nula.",
            whatToDo: "Revisa márgenes por producto en Mi Negocio y costos fijos.",
          }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Proyección a {PROJECTION_YEARS} años</CardTitle>
          <CardDescription>
            Ventas y utilidad neta anualizadas (mes actual × 12), proyectadas con un crecimiento anual supuesto del{" "}
            {DEFAULT_ANNUAL_GROWTH_PCT}% — ajustable en el simulador VAN/TIR de abajo (spec §0.3/§19).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectionChart data={projectionData} currency={company.currency} />
        </CardContent>
      </Card>

      <VanTirCalculator baseAnnualCashFlow={snapshot.cashFlow.flujoNeto * 12} inversionTotal={inversionTotal} currency={company.currency} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Rango de valoración</CardTitle>
          <CardDescription>Mínimo — probable — máximo, nunca una cifra única (spec §16.1).</CardDescription>
        </CardHeader>
        <CardContent>
          <ValuationRangeDisplay range={valuation.range} currency={company.currency} />
        </CardContent>
      </Card>

      <InvestorReadinessCard result={readiness} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Cap Table actual</CardTitle>
          <CardDescription>Participación accionaria vigente — gestiónala en Socios / Cap Table.</CardDescription>
        </CardHeader>
        <CardContent>
          <CapTableView entries={capTableEntries} shareholders={shareholders} currency={company.currency} />
        </CardContent>
      </Card>
    </div>
  );
}

import { CheckCircle2, AlertTriangle } from "lucide-react";
import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { KpiCard, type KpiStatus } from "@/components/shared/kpi-card";
import { ScenarioComparisonChart, type ScenarioChartPoint } from "@/components/dashboard/scenario-comparison-chart";
import { AlertsList } from "@/components/dashboard/alerts-list";
import { buildCompanySnapshot, totalInvestment } from "@/lib/engine/financial";
import { applyScenario, DEFAULT_SCENARIO_DELTAS, type ScenarioType } from "@/lib/engine/scenarios";
import { computeSolidityIndicator } from "@/lib/engine/solidity";
import { buildAlerts, type ProductProfitability } from "@/lib/engine/alerts";
import { computeCAC, computeLTV, computeLtvCacRatio } from "@/lib/engine/funnel";
import { buildAmortizationSchedule, summarizeLoan } from "@/lib/engine/financing";
import { computeGoalPlan, computeGoalProgressPct } from "@/lib/engine/goals";
import { ensureCurrentMonthSnapshot } from "@/lib/actions/snapshot-actions";
import { computePeriodChange, findPreviousMonth, sortSnapshots, type SnapshotLike } from "@/lib/engine/temporal-benchmark";
import { toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { SCENARIO_TYPE_LABELS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";

function deltaText(current: number | null | undefined, previous: number | null | undefined) {
  if (current == null || previous == null) return undefined;
  const { deltaPct } = computePeriodChange(current, previous);
  if (deltaPct == null) return undefined;
  return `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}% vs. mes anterior`;
}

export default async function DashboardPage() {
  const { company } = await requireCompany();

  const [products, fixedCosts, variableCosts, investments, scenarios, funnel, financingPlans, goal, snapshotRows] = await Promise.all([
    prisma.product.findMany({ where: { companyId: company.id } }),
    prisma.fixedCost.findMany({ where: { companyId: company.id } }),
    prisma.variableCost.findMany({ where: { companyId: company.id } }),
    prisma.investment.findMany({ where: { companyId: company.id } }),
    prisma.scenario.findMany({ where: { companyId: company.id } }),
    prisma.salesFunnel.findUnique({ where: { companyId: company.id } }),
    prisma.financingPlan.findMany({ where: { companyId: company.id } }),
    prisma.goal.findUnique({ where: { companyId: company.id } }),
    prisma.monthlySnapshot.findMany({ where: { companyId: company.id } }),
  ]);

  const engineProducts = toEngineProducts(products);
  const engineFixedCosts = toEngineFixedCosts(fixedCosts);
  const engineVariableCosts = toEngineVariableCosts(variableCosts);

  const snapshot = buildCompanySnapshot(engineProducts, engineVariableCosts, engineFixedCosts, company.taxRatePct);
  const inversionTotal = totalInvestment(investments.map((i) => i.amount));

  const hasData = products.length > 0;
  if (hasData) {
    await ensureCurrentMonthSnapshot(company.id, hasData, snapshot);
  }

  const history: SnapshotLike[] = sortSnapshots(
    snapshotRows.map((r) => ({
      periodYear: r.periodYear,
      periodMonth: r.periodMonth,
      ventas: r.ventas,
      costoVentas: r.costoVentas,
      utilidadBruta: r.utilidadBruta,
      gastosOperativos: r.gastosOperativos,
      ebitda: r.ebitda,
      utilidadNeta: r.utilidadNeta,
      margenNetoPct: r.margenNetoPct,
      flujoNeto: r.flujoNeto,
      breakEvenAmount: r.breakEvenAmount,
    }))
  );
  const now = new Date();
  const previousSnapshot = findPreviousMonth(history, now.getFullYear(), now.getMonth() + 1);

  const chartData: ScenarioChartPoint[] = (["PESIMISTA", "BASE", "OPTIMISTA"] as ScenarioType[]).map((type) => {
    const scenario = scenarios.find((s) => s.type === type);
    const deltas = scenario
      ? { type, salesDeltaPct: scenario.salesDeltaPct, priceDeltaPct: scenario.priceDeltaPct, costDeltaPct: scenario.costDeltaPct }
      : { type, ...DEFAULT_SCENARIO_DELTAS[type] };
    const adjusted = applyScenario({ products: engineProducts, fixedCosts: engineFixedCosts, variableCosts: engineVariableCosts }, deltas);
    const scenarioSnapshot = buildCompanySnapshot(adjusted.products, adjusted.variableCosts, adjusted.fixedCosts, company.taxRatePct);
    return { name: SCENARIO_TYPE_LABELS[type], ventas: scenarioSnapshot.statement.ventas, utilidadNeta: scenarioSnapshot.statement.utilidadNeta };
  });

  const margenStatus: KpiStatus = !hasData ? "neutral" : snapshot.statement.margenNetoPct >= 20 ? "verde" : snapshot.statement.margenNetoPct >= 10 ? "amarillo" : "rojo";
  const utilidadStatus: KpiStatus = !hasData ? "neutral" : snapshot.statement.utilidadNeta > 0 ? "verde" : "rojo";
  const flujoStatus: KpiStatus = !hasData ? "neutral" : snapshot.cashFlow.alertaFlujoNegativo ? "rojo" : "verde";
  const breakEvenStatus: KpiStatus =
    !hasData || !Number.isFinite(snapshot.breakEven.amount)
      ? "neutral"
      : snapshot.statement.ventas >= snapshot.breakEven.amount
        ? "verde"
        : snapshot.statement.ventas >= snapshot.breakEven.amount * 0.8
          ? "amarillo"
          : "rojo";

  const solidity = computeSolidityIndicator(hasData, snapshot);

  const productProfitability: ProductProfitability[] = snapshot.economics.map((e) => ({
    productId: e.productId,
    name: engineProducts.find((p) => p.id === e.productId)?.name ?? "—",
    unitMarginPct: e.unitMarginPct,
  }));

  const funnelAlertInput =
    funnel && funnel.leads > 0
      ? {
          ltvCac: computeLtvCacRatio(
            computeLTV(funnel.avgTicket, funnel.purchaseFrequencyPerYear, funnel.customerLifetimeYears),
            computeCAC(funnel.marketingSpend, funnel.ventas)
          ),
        }
      : null;

  const monthlyDebtService = financingPlans.reduce((sum, plan) => {
    const schedule = buildAmortizationSchedule({
      principal: plan.principal,
      annualInterestRatePct: plan.annualInterestRatePct,
      termMonths: plan.termMonths,
      gracePeriodMonths: plan.gracePeriodMonths,
      graceType: plan.graceType,
    });
    return sum + summarizeLoan(schedule).cuotaMensual;
  }, 0);

  const totalUnits = engineProducts.reduce((sum, p) => sum + p.unitsSoldMonthly, 0);
  const goalAvgTicket = totalUnits > 0 ? snapshot.aggregate.ventas / totalUnits : (funnel?.avgTicket ?? 0);
  const goalPlan = goal
    ? computeGoalPlan({
        targetType: goal.targetType,
        targetAmount: goal.targetAmount,
        contributionMarginRatio: snapshot.aggregate.contributionMarginRatio,
        fixedCostsMonthly: engineFixedCosts.reduce((sum, c) => sum + c.amountMonthly, 0),
        taxRatePct: company.taxRatePct,
        avgTicket: goalAvgTicket,
        unitsPerCustomer: goal.unitsPerCustomer,
        targetConversionPct: goal.targetConversionPct,
        leadsPerVendedor: goal.leadsPerVendedor,
      })
    : null;
  const goalAlertInput =
    goal && goalPlan
      ? {
          progressPct: computeGoalProgressPct(goal.targetType === "VENTAS" ? snapshot.statement.ventas : snapshot.statement.utilidadNeta, goal.targetAmount),
          targetType: goal.targetType,
        }
      : null;

  const alerts = buildAlerts({
    hasData,
    snapshot: hasData ? snapshot : null,
    products: productProfitability,
    funnel: funnelAlertInput,
    financing: monthlyDebtService > 0 ? { monthlyDebtService } : null,
    goal: goalAlertInput,
    history,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Vista ejecutiva de tu negocio, calculada por el Financial Engine.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm">
          {solidity === "verde" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertTriangle className={`h-4 w-4 ${solidity === "rojo" ? "text-red-600" : "text-amber-500"}`} />
          )}
          <span className="font-medium text-slate-700">
            Solidez del negocio: {solidity === "verde" ? "Buena" : solidity === "amarillo" ? "A vigilar" : solidity === "rojo" ? "Atención" : "Sin datos"}
          </span>
        </div>
      </div>

      <AlertsList alerts={alerts} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Ventas (mes)"
          value={formatCurrency(snapshot.statement.ventas, company.currency)}
          helperText={deltaText(snapshot.statement.ventas, previousSnapshot?.ventas) ?? "Dato real, según lo cargado en Mi Negocio"}
          explanation={{
            meaning: "El total de ingresos por ventas de tus productos/servicios en el mes.",
            why: "Es el punto de partida de toda la salud financiera del negocio.",
            howCalculated: "Ventas = Σ (Precio neto × Unidades vendidas) de cada producto/servicio.",
            isGoodOrBad: "Compárala contra tu punto de equilibrio y tus metas.",
            whatToDo: "Si es baja, revisa Proyección de Ventas y Precificación (próximamente) o ajusta tu mix de productos.",
          }}
        />
        <KpiCard
          label="Utilidad Neta"
          value={formatCurrency(snapshot.statement.utilidadNeta, company.currency)}
          status={utilidadStatus}
          helperText={deltaText(snapshot.statement.utilidadNeta, previousSnapshot?.utilidadNeta)}
          explanation={{
            meaning: "Lo que realmente te queda después de todos los costos, gastos e impuestos.",
            why: "Es la cifra que determina si el negocio es rentable.",
            howCalculated: "Utilidad Neta = EBIT − Impuestos (spec §8). Impuestos = EBIT × tasa configurada en Perfil.",
            isGoodOrBad: utilidadStatus === "verde" ? "Positiva: el negocio genera utilidad." : "Negativa o nula: el negocio está perdiendo dinero en el período.",
            whatToDo: "Revisa el detalle en Estructura de Costos y el margen por producto en Mi Negocio.",
          }}
        />
        <KpiCard
          label="Margen Neto"
          value={formatPercent(snapshot.statement.margenNetoPct)}
          status={margenStatus}
          helperText={previousSnapshot ? `${snapshot.statement.margenNetoPct >= previousSnapshot.margenNetoPct ? "+" : ""}${(snapshot.statement.margenNetoPct - previousSnapshot.margenNetoPct).toFixed(1)} pts vs. mes anterior` : undefined}
          explanation={{
            meaning: "El % de cada boliviano/dólar de venta que se convierte en utilidad neta.",
            why: "Mide la eficiencia global de tu negocio, no solo el volumen de ventas.",
            howCalculated: "Margen Neto (%) = Utilidad Neta / Ventas × 100 (fórmula 21.1).",
            isGoodOrBad: margenStatus === "verde" ? "Saludable (≥20%)." : margenStatus === "amarillo" ? "Ajustado (10-20%)." : "Bajo (<10%) — revisa precios y costos.",
            whatToDo: "Sube precios, reduce costos variables, o mejora el mix hacia productos de mayor margen.",
          }}
        />
        <KpiCard
          label="Punto de Equilibrio"
          value={Number.isFinite(snapshot.breakEven.amount) ? formatCurrency(snapshot.breakEven.amount, company.currency) : "—"}
          status={breakEvenStatus}
          methodologyTopic="COSTO_VOLUMEN_UTILIDAD"
          explanation={{
            meaning: "El nivel de ventas mínimo para no perder ni ganar dinero.",
            why: "Te dice cuánto necesitas vender antes de empezar a generar utilidad real.",
            howCalculated: "PE (monetario) = Costos Fijos / Margen de Contribución (%) (fórmula 21.2).",
            isGoodOrBad: breakEvenStatus === "verde" ? "Tus ventas ya superan el punto de equilibrio." : "Tus ventas están cerca o por debajo del punto de equilibrio.",
            whatToDo: "Si estás por debajo, prioriza aumentar ventas o reducir costos fijos.",
          }}
        />
        <KpiCard
          label="Flujo de Caja (mes)"
          value={formatCurrency(snapshot.cashFlow.flujoNeto, company.currency)}
          status={flujoStatus}
          helperText={deltaText(snapshot.cashFlow.flujoNeto, previousSnapshot?.flujoNeto)}
          explanation={{
            meaning: "La diferencia entre lo que entra y sale de caja en el mes.",
            why: "Un negocio puede ser rentable en papel y aun así quedarse sin efectivo.",
            howCalculated: "Flujo Neto = Ingresos (ventas) − Egresos (costo de ventas + gastos operativos + impuestos), spec §8.",
            isGoodOrBad: flujoStatus === "verde" ? "Positivo." : "Negativo — riesgo de falta de liquidez.",
            whatToDo: "Revisa tus costos fijos y el calendario de cobros/pagos.",
          }}
        />
        <KpiCard
          label="Utilidad Bruta"
          value={formatCurrency(snapshot.statement.utilidadBruta, company.currency)}
          explanation={{
            meaning: "Lo que queda de las ventas tras descontar el costo variable/costo de ventas.",
            why: "Muestra la rentabilidad directa de lo que vendes, antes de gastos operativos.",
            howCalculated: "Utilidad Bruta = Ventas − Costo de Ventas (spec §8).",
            isGoodOrBad: "Debe ser suficiente para cubrir tus costos fijos (gastos operativos).",
            whatToDo: "Si es baja, el problema está en precio o costo variable, no en gastos fijos.",
          }}
        />
        <KpiCard
          label="EBITDA"
          value={formatCurrency(snapshot.statement.ebitda, company.currency)}
          helperText={deltaText(snapshot.statement.ebitda, previousSnapshot?.ebitda)}
          explanation={{
            meaning: "La utilidad operativa antes de depreciación, intereses e impuestos.",
            why: "Mide la rentabilidad del negocio en su operación pura, sin efectos financieros/contables.",
            howCalculated: "EBITDA = Utilidad Bruta − Gastos Operativos (spec §8).",
            isGoodOrBad: "Debe ser positivo de forma sostenida.",
            whatToDo: "Si es negativo, tus costos fijos superan tu utilidad bruta — revisa Estructura de Costos.",
          }}
        />
        <KpiCard
          label="Capital Necesario"
          value={formatCurrency(inversionTotal, company.currency)}
          helperText="Suma de Inversión Inicial"
          explanation={{
            meaning: "El capital total que registraste como necesario para operar o escalar el negocio.",
            why: "Es la base para calcular ROI y payback, y para conversar con inversionistas.",
            howCalculated: "Capital Necesario = Σ montos de todos los ítems de Inversión Inicial (spec §5).",
            isGoodOrBad: "No aplica bien/mal — es un dato de referencia.",
            whatToDo: "Ve a Inversión Inicial para ver ROI y payback estimado con este monto.",
          }}
        />
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Ventas y utilidad por escenario</h2>
          </div>
          <p className="mb-4 text-xs text-slate-500">
            Comparación Pesimista / Base / Optimista, calculada en vivo con el Financial Engine (spec §9). Ajusta los
            escenarios en el módulo Escenarios.
          </p>
          <ScenarioComparisonChart data={chartData} currency={company.currency} />
        </CardContent>
      </Card>
    </div>
  );
}

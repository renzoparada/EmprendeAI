import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { KpiCard, type KpiStatus } from "@/components/shared/kpi-card";
import { ScenarioComparisonChart, type ScenarioChartPoint } from "@/components/dashboard/scenario-comparison-chart";
import { buildCompanySnapshot, totalInvestment } from "@/lib/engine/financial";
import { applyScenario, DEFAULT_SCENARIO_DELTAS, type ScenarioType } from "@/lib/engine/scenarios";
import { toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { SCENARIO_TYPE_LABELS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";

export default async function DashboardPage() {
  const { company } = await requireCompany();

  const [products, fixedCosts, variableCosts, investments, scenarios] = await Promise.all([
    prisma.product.findMany({ where: { companyId: company.id } }),
    prisma.fixedCost.findMany({ where: { companyId: company.id } }),
    prisma.variableCost.findMany({ where: { companyId: company.id } }),
    prisma.investment.findMany({ where: { companyId: company.id } }),
    prisma.scenario.findMany({ where: { companyId: company.id } }),
  ]);

  const engineProducts = toEngineProducts(products);
  const engineFixedCosts = toEngineFixedCosts(fixedCosts);
  const engineVariableCosts = toEngineVariableCosts(variableCosts);

  const snapshot = buildCompanySnapshot(engineProducts, engineVariableCosts, engineFixedCosts, company.taxRatePct);
  const inversionTotal = totalInvestment(investments.map((i) => i.amount));

  const chartData: ScenarioChartPoint[] = (["PESIMISTA", "BASE", "OPTIMISTA"] as ScenarioType[]).map((type) => {
    const scenario = scenarios.find((s) => s.type === type);
    const deltas = scenario
      ? { type, salesDeltaPct: scenario.salesDeltaPct, priceDeltaPct: scenario.priceDeltaPct, costDeltaPct: scenario.costDeltaPct }
      : { type, ...DEFAULT_SCENARIO_DELTAS[type] };
    const adjusted = applyScenario({ products: engineProducts, fixedCosts: engineFixedCosts, variableCosts: engineVariableCosts }, deltas);
    const scenarioSnapshot = buildCompanySnapshot(adjusted.products, adjusted.variableCosts, adjusted.fixedCosts, company.taxRatePct);
    return { name: SCENARIO_TYPE_LABELS[type], ventas: scenarioSnapshot.statement.ventas, utilidadNeta: scenarioSnapshot.statement.utilidadNeta };
  });

  const hasData = products.length > 0;

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

  const soliditySignals = [margenStatus, utilidadStatus, flujoStatus, breakEvenStatus];
  const solidity: KpiStatus = !hasData
    ? "neutral"
    : soliditySignals.includes("rojo")
      ? "rojo"
      : soliditySignals.includes("amarillo")
        ? "amarillo"
        : "verde";

  const alerts: { severity: "warning" | "danger"; message: string }[] = [];
  if (hasData) {
    if (snapshot.cashFlow.alertaFlujoNegativo) {
      alerts.push({ severity: "danger", message: "Tu flujo de caja del mes es negativo. Revisa costos fijos o el ritmo de ventas." });
    }
    if (snapshot.statement.margenNetoPct < 10) {
      alerts.push({ severity: "warning", message: `Tu margen neto (${formatPercent(snapshot.statement.margenNetoPct)}) está por debajo del 10%.` });
    }
    if (Number.isFinite(snapshot.breakEven.amount) && snapshot.statement.ventas < snapshot.breakEven.amount) {
      alerts.push({
        severity: "warning",
        message: `Tus ventas (${formatCurrency(snapshot.statement.ventas, company.currency)}) están por debajo del punto de equilibrio (${formatCurrency(snapshot.breakEven.amount, company.currency)}).`,
      });
    }
  } else {
    alerts.push({ severity: "warning", message: "Todavía no cargaste productos ni costos. Ve a Mi Negocio y Estructura de Costos para activar el dashboard." });
  }

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

      {alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
                alert.severity === "danger" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Ventas (mes)"
          value={formatCurrency(snapshot.statement.ventas, company.currency)}
          helperText="Dato real, según lo cargado en Mi Negocio"
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

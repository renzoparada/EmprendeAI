import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { buildCompanySnapshot, computeAggregateMargins, computeProductEconomics } from "@/lib/engine/financial";
import { computeGoalPlan, computeGoalProgressPct } from "@/lib/engine/goals";
import { toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GoalForm } from "@/components/metas/goal-form";
import { GoalActionPlan } from "@/components/metas/goal-action-plan";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default async function MetasPage() {
  const { company } = await requireCompany();

  const [goal, products, fixedCosts, variableCosts, funnel] = await Promise.all([
    prisma.goal.findUnique({ where: { companyId: company.id } }),
    prisma.product.findMany({ where: { companyId: company.id } }),
    prisma.fixedCost.findMany({ where: { companyId: company.id } }),
    prisma.variableCost.findMany({ where: { companyId: company.id } }),
    prisma.salesFunnel.findUnique({ where: { companyId: company.id } }),
  ]);

  const engineProducts = toEngineProducts(products);
  const engineFixedCosts = toEngineFixedCosts(fixedCosts);
  const engineVariableCosts = toEngineVariableCosts(variableCosts);
  const snapshot = buildCompanySnapshot(engineProducts, engineVariableCosts, engineFixedCosts, company.taxRatePct);

  const economics = engineProducts.map((p) => computeProductEconomics(p, engineVariableCosts));
  const aggregate = computeAggregateMargins(economics, engineProducts);
  const totalUnits = engineProducts.reduce((sum, p) => sum + p.unitsSoldMonthly, 0);
  const avgTicket = totalUnits > 0 ? aggregate.ventas / totalUnits : funnel?.avgTicket ?? 0;

  const plan = goal
    ? computeGoalPlan({
        targetType: goal.targetType,
        targetAmount: goal.targetAmount,
        contributionMarginRatio: aggregate.contributionMarginRatio,
        fixedCostsMonthly: engineFixedCosts.reduce((sum, c) => sum + c.amountMonthly, 0),
        taxRatePct: company.taxRatePct,
        avgTicket,
        unitsPerCustomer: goal.unitsPerCustomer,
        targetConversionPct: goal.targetConversionPct,
        leadsPerVendedor: goal.leadsPerVendedor,
      })
    : null;

  const currentValue = goal?.targetType === "VENTAS" ? snapshot.statement.ventas : snapshot.statement.utilidadNeta;
  const progressPct = goal ? computeGoalProgressPct(currentValue, goal.targetAmount) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Mis Metas</h1>
        <p className="text-sm text-slate-500">Define una meta y calculamos qué necesitas para lograrla (spec §11).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Tu meta</CardTitle>
        </CardHeader>
        <CardContent>
          <GoalForm goal={goal} currency={company.currency} />
        </CardContent>
      </Card>

      {goal && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Progreso</CardTitle>
            <CardDescription>
              {formatCurrency(currentValue, company.currency)} de {formatCurrency(goal.targetAmount, company.currency)} objetivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-3 rounded-full ${progressPct >= 100 ? "bg-emerald-500" : progressPct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${Math.min(100, Math.max(2, progressPct))}%` }}
              />
            </div>
            <p className="mt-2 text-right text-sm font-medium text-slate-700">{formatPercent(progressPct)}</p>
          </CardContent>
        </Card>
      )}

      {goal && plan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Lo que necesitas cada mes</CardTitle>
            <CardDescription>Calculado con tu margen de contribución actual y los supuestos de conversión (spec §11).</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div>
              <p className="text-xs text-slate-500">Ventas necesarias</p>
              <p className="text-lg font-semibold text-slate-900">{formatCurrency(plan.ventasNecesarias, company.currency)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Unidades necesarias</p>
              <p className="text-lg font-semibold text-slate-900">{plan.unidadesNecesarias.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Clientes necesarios</p>
              <p className="text-lg font-semibold text-slate-900">{plan.clientesNecesarios.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Leads necesarios</p>
              <p className="text-lg font-semibold text-slate-900">{plan.leadsNecesarios.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Vendedores necesarios</p>
              <p className="text-lg font-semibold text-slate-900">{plan.vendedoresNecesarios.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {goal && plan && <GoalActionPlan />}

      {goal && !plan && (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          No se pudo calcular el plan — necesitas al menos un producto con margen de contribución positivo en Mi Negocio.
        </p>
      )}
    </div>
  );
}

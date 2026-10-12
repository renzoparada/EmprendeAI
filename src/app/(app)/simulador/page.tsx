import { Plus } from "lucide-react";
import { z } from "zod";
import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { buildAmortizationSchedule, summarizeLoan } from "@/lib/engine/financing";
import { computeCostPerLead, computeOverallConversionPct } from "@/lib/engine/funnel";
import { runBusinessSimulation, projectMarketing, type InvestmentEvent } from "@/lib/engine/business-simulator";
import { applyImportCosts, toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SimulationSelector } from "@/components/simulador/simulation-selector";
import { SimulationFormDialog } from "@/components/simulador/simulation-form-dialog";
import { SimulationChart } from "@/components/simulador/simulation-chart";
import { SimulationTable } from "@/components/simulador/simulation-table";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteSimulation } from "@/lib/actions/simulation-actions";
import { formatCurrency } from "@/lib/utils";

const investmentEventsArraySchema = z.array(z.object({ month: z.number().int().positive(), name: z.string(), amount: z.number() }));

export default async function SimuladorPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { company } = await requireCompany();
  const { id } = await searchParams;

  const [products, fixedCosts, variableCosts, financingPlans, exchangeRates, importCosts, funnel, simulations] = await Promise.all([
    prisma.product.findMany({ where: { companyId: company.id } }),
    prisma.fixedCost.findMany({ where: { companyId: company.id } }),
    prisma.variableCost.findMany({ where: { companyId: company.id } }),
    prisma.financingPlan.findMany({ where: { companyId: company.id } }),
    prisma.exchangeRate.findMany({ where: { companyId: company.id } }),
    prisma.importCost.findMany({ where: { product: { companyId: company.id } }, orderBy: { createdAt: "desc" } }),
    prisma.salesFunnel.findUnique({ where: { companyId: company.id } }),
    prisma.businessSimulation.findMany({ where: { companyId: company.id }, orderBy: { updatedAt: "desc" } }),
  ]);

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Business Simulator</h1>
        <p className="text-sm text-slate-500">
          Proyecta tu negocio hacia adelante sobre tus datos reales — clientes, precio, costos, personal, inversión,
          financiamiento, inflación y tipo de cambio (spec §20).
        </p>
      </div>
      <SimulationFormDialog
        trigger={
          <Button>
            <Plus className="h-4 w-4" />
            Nueva simulación
          </Button>
        }
      />
    </div>
  );

  if (products.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Business Simulator</h1>
          <p className="text-sm text-slate-500">Proyecta tu negocio 12, 24, 36 o 60 meses hacia adelante (spec §20).</p>
        </div>
        <p className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          Carga productos/servicios en Mi Negocio para poder simular.
        </p>
      </div>
    );
  }

  const selected = simulations.find((s) => s.id === id) ?? simulations[0] ?? null;

  if (!selected) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <p className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          Todavía no creaste ninguna simulación. Cada una guarda un conjunto de supuestos con nombre — los resultados
          siempre se recalculan en vivo sobre tus datos actuales.
        </p>
      </div>
    );
  }

  const engineProducts = toEngineProducts(products);
  const engineFixedCosts = toEngineFixedCosts(fixedCosts);
  const engineVariableCosts = toEngineVariableCosts(variableCosts);

  const ratesByCurrency: Record<string, number> = {};
  for (const r of exchangeRates) {
    if (!(r.fromCurrency in ratesByCurrency) || r.rateType === "OFICIAL") ratesByCurrency[r.fromCurrency] = r.rate;
  }
  const shockedProducts =
    selected.exchangeRateShockPct !== 0
      ? applyImportCosts(engineProducts, products, importCosts, ratesByCurrency, selected.exchangeRateShockPct)
      : engineProducts;

  const monthlyDebtService = selected.includeFinancing
    ? financingPlans.reduce((sum, plan) => {
        const schedule = buildAmortizationSchedule({
          principal: plan.principal,
          annualInterestRatePct: plan.annualInterestRatePct,
          termMonths: plan.termMonths,
          gracePeriodMonths: plan.gracePeriodMonths,
          graceType: plan.graceType,
        });
        return sum + summarizeLoan(schedule).cuotaMensual;
      }, 0)
    : 0;

  const investmentEventsParsed = investmentEventsArraySchema.safeParse(selected.investmentEvents);
  const investmentEvents: InvestmentEvent[] = investmentEventsParsed.success ? investmentEventsParsed.data : [];

  const results = runBusinessSimulation(shockedProducts, engineVariableCosts, engineFixedCosts, company.taxRatePct, {
    horizonMonths: selected.horizonMonths,
    monthlySalesGrowthPct: selected.monthlySalesGrowthPct,
    priceAdjustmentPct: selected.priceAdjustmentPct,
    annualInflationPct: selected.annualInflationPct,
    staffCount: selected.staffCount,
    avgSalary: selected.avgSalary,
    monthlyStaffGrowthPct: selected.monthlyStaffGrowthPct,
    investmentEvents,
    monthlyDebtService,
  });

  const last = results[results.length - 1];
  const marketingProjection =
    funnel && funnel.marketingSpend > 0
      ? projectMarketing(
          funnel.marketingSpend,
          computeCostPerLead(funnel.marketingSpend, funnel.leads),
          computeOverallConversionPct(funnel),
          selected.monthlyMarketingGrowthPct,
          selected.horizonMonths
        )
      : null;
  const lastMarketing = marketingProjection?.[marketingProjection.length - 1];

  return (
    <div className="flex flex-col gap-6">
      {header}

      <div className="flex items-end justify-between gap-4">
        <SimulationSelector simulations={simulations} selectedId={selected.id} />
        <div className="flex items-center gap-1">
          <SimulationFormDialog
            simulation={selected}
            trigger={
              <Button variant="outline" size="sm">
                Editar
              </Button>
            }
          />
          <DeleteButton id={selected.id} action={deleteSimulation} confirmMessage="¿Eliminar esta simulación?" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm font-medium text-slate-500">Ventas mes {selected.horizonMonths}</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{formatCurrency(last.ventas, company.currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm font-medium text-slate-500">Utilidad Neta mes {selected.horizonMonths}</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{formatCurrency(last.utilidadNeta, company.currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm font-medium text-slate-500">Flujo de caja acumulado</p>
            <p className={`mt-2 text-xl font-semibold ${last.flujoAcumulado >= 0 ? "text-slate-900" : "text-red-600"}`}>
              {formatCurrency(last.flujoAcumulado, company.currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Proyección a {selected.horizonMonths} meses</CardTitle>
          <CardDescription>Ventas, Utilidad Neta y Flujo de Caja Acumulado, mes a mes.</CardDescription>
        </CardHeader>
        <CardContent>
          <SimulationChart results={results} currency={company.currency} />
        </CardContent>
      </Card>

      {marketingProjection && lastMarketing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Marketing proyectado (informativo)</CardTitle>
            <CardDescription>
              Gasto de marketing y clientes nuevos esperados manteniendo el costo por lead y la conversión actuales — no
              alimenta la proyección de ventas de arriba (evita duplicar el crecimiento).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Gasto de marketing (mes {selected.horizonMonths})</p>
              <p className="text-lg font-semibold text-slate-900">{formatCurrency(lastMarketing.marketingSpend, company.currency)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Leads proyectados</p>
              <p className="text-lg font-semibold text-slate-900">{lastMarketing.projectedLeads.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Clientes nuevos proyectados</p>
              <p className="text-lg font-semibold text-slate-900">{lastMarketing.projectedNewCustomers.toFixed(0)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Detalle mes a mes</CardTitle>
        </CardHeader>
        <CardContent>
          <SimulationTable results={results} currency={company.currency} />
        </CardContent>
      </Card>
    </div>
  );
}

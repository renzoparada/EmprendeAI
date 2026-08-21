import { Plus } from "lucide-react";
import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { buildCompanySnapshot, computeRoi, totalInvestment } from "@/lib/engine/financial";
import { buildAmortizationSchedule, computeCashFlowWithDebtService, computeLeveragedRoi, summarizeLoan } from "@/lib/engine/financing";
import { toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/shared/kpi-card";
import { FinancingFormDialog } from "@/components/financiamiento/financing-form-dialog";
import { FinancingPlansTable } from "@/components/financiamiento/financing-plans-table";
import { formatCurrency } from "@/lib/utils";

export default async function FinanciamientoPage() {
  const { company } = await requireCompany();

  const [plans, products, fixedCosts, variableCosts, investments] = await Promise.all([
    prisma.financingPlan.findMany({ where: { companyId: company.id }, orderBy: { createdAt: "asc" } }),
    prisma.product.findMany({ where: { companyId: company.id } }),
    prisma.fixedCost.findMany({ where: { companyId: company.id } }),
    prisma.variableCost.findMany({ where: { companyId: company.id } }),
    prisma.investment.findMany({ where: { companyId: company.id } }),
  ]);

  const snapshot = buildCompanySnapshot(
    toEngineProducts(products),
    toEngineVariableCosts(variableCosts),
    toEngineFixedCosts(fixedCosts),
    company.taxRatePct
  );
  const inversionTotal = totalInvestment(investments.map((i) => i.amount));

  const summaries = plans.map((plan) => {
    const schedule = buildAmortizationSchedule({
      principal: plan.principal,
      annualInterestRatePct: plan.annualInterestRatePct,
      termMonths: plan.termMonths,
      gracePeriodMonths: plan.gracePeriodMonths,
      graceType: plan.graceType,
    });
    return summarizeLoan(schedule);
  });

  const totalFinanced = plans.reduce((sum, p) => sum + p.principal, 0);
  const monthlyDebtService = summaries.reduce((sum, s) => sum + s.cuotaMensual, 0);
  const totalCostoFinanciero = summaries.reduce((sum, s) => sum + s.costoFinancieroTotal, 0);

  const roi = computeRoi(snapshot.statement.utilidadNeta, inversionTotal);
  const leveragedRoi = computeLeveragedRoi(snapshot.statement.utilidadNeta, inversionTotal, totalFinanced);
  const cashFlowWithDebt = computeCashFlowWithDebtService(snapshot.cashFlow.flujoNeto, monthlyDebtService);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Financiamiento</h1>
          <p className="text-sm text-slate-500">
            Simula préstamos, aportes de socios/inversionistas o crowdfunding: cuota, intereses, costo financiero y su
            impacto en flujo de caja y ROI (spec §14).
          </p>
        </div>
        {plans.length > 0 && (
          <FinancingFormDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Nuevo financiamiento
              </Button>
            }
          />
        )}
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-slate-300 p-10 text-center">
          <p className="text-sm text-slate-500">Todavía no registraste ninguna fuente de financiamiento.</p>
          <FinancingFormDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Nuevo financiamiento
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Total financiado"
              value={formatCurrency(totalFinanced, company.currency)}
              helperText="Suma del principal de todas las fuentes"
              explanation={{
                meaning: "El capital total que planeas cubrir con deuda, socios, inversionistas o crowdfunding.",
                why: "Determina cuánto de tu inversión total no sale de tu propio bolsillo.",
                howCalculated: "Total Financiado = Σ montos (principal) de todas las fuentes registradas.",
                isGoodOrBad: "No aplica bien/mal — es la base para el resto de los indicadores de esta página.",
                whatToDo: "Compáralo contra tu Inversión Total en Inversión Inicial.",
              }}
            />
            <KpiCard
              label="Servicio de deuda mensual"
              value={formatCurrency(monthlyDebtService, company.currency)}
              helperText="Suma de cuotas mensuales (post-gracia) de todas las fuentes"
              explanation={{
                meaning: "Lo que vas a pagar cada mes por todas tus fuentes de financiamiento juntas, una vez pasado el período de gracia.",
                why: "Es el compromiso fijo que tu flujo de caja debe poder cubrir mes a mes.",
                howCalculated: "Servicio de Deuda = Σ cuota mensual de cada financiamiento (sistema francés de amortización).",
                isGoodOrBad: "Debe ser claramente menor a tu flujo de caja operativo mensual.",
                whatToDo: "Si es muy alto, negocia un plazo mayor o un período de gracia.",
              }}
            />
            <KpiCard
              label="Flujo de caja con financiamiento"
              value={formatCurrency(cashFlowWithDebt, company.currency)}
              status={cashFlowWithDebt >= 0 ? "verde" : "rojo"}
              explanation={{
                meaning: "Tu flujo de caja operativo actual, después de pagar el servicio de deuda mensual.",
                why: "El Financial Engine no modela deuda en el flujo de caja general (spec §14) — esta es la vista que sí la incluye.",
                howCalculated: "Flujo con Financiamiento = Flujo de Caja Operativo − Servicio de Deuda Mensual.",
                isGoodOrBad: cashFlowWithDebt >= 0 ? "Positivo: tu operación cubre el servicio de deuda." : "Negativo: la deuda actual supera lo que tu operación genera.",
                whatToDo: "Si es negativo, reduce el monto financiado, extiende el plazo o mejora el flujo operativo primero.",
              }}
            />
            <KpiCard
              label="ROI apalancado"
              value={leveragedRoi != null ? `${leveragedRoi.toFixed(1)}%` : "—"}
              status={leveragedRoi == null ? "neutral" : leveragedRoi >= roi ? "verde" : "amarillo"}
              helperText={`ROI sin apalancar: ${roi.toFixed(1)}%`}
              explanation={{
                meaning: "El retorno que obtienes sobre el capital que pusiste TÚ, no sobre la inversión total (que incluye lo financiado).",
                why: "Usar deuda para financiar parte de la inversión puede mejorar el retorno sobre tu propio capital si el negocio rinde más de lo que cuesta la deuda — o empeorarlo si no.",
                howCalculated: "ROI Apalancado (%) = Utilidad Neta / (Inversión Total − Total Financiado) × 100.",
                isGoodOrBad:
                  leveragedRoi == null
                    ? "No calculable: lo financiado cubre o supera tu inversión total."
                    : leveragedRoi >= roi
                      ? "El apalancamiento está mejorando tu retorno sobre capital propio."
                      : "El costo de la deuda está reduciendo tu retorno sobre capital propio.",
                whatToDo: "Compara la tasa de interés de tus fuentes contra tu ROI general para decidir si conviene financiar más o menos.",
              }}
            />
          </div>

          {totalCostoFinanciero > 0 && (
            <p className="text-sm text-slate-500">
              Costo financiero total (todas las fuentes, vida completa): <span className="font-medium text-slate-900">{formatCurrency(totalCostoFinanciero, company.currency)}</span>
            </p>
          )}

          <FinancingPlansTable plans={plans} currency={company.currency} />
        </>
      )}
    </div>
  );
}

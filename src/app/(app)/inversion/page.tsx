import { Plus } from "lucide-react";
import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { InvestmentFormDialog } from "@/components/inversion/investment-form-dialog";
import { InvestmentsTable } from "@/components/inversion/investments-table";
import { VanTirCalculator } from "@/components/inversion/van-tir-calculator";
import { KpiCard } from "@/components/shared/kpi-card";
import { buildCompanySnapshot, computePaybackMonths, computeRoi, totalInvestment } from "@/lib/engine/financial";
import { toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";
import { formatCurrency } from "@/lib/utils";

export default async function InversionPage() {
  const { company } = await requireCompany();

  const [investments, products, fixedCosts, variableCosts] = await Promise.all([
    prisma.investment.findMany({ where: { companyId: company.id }, orderBy: { createdAt: "asc" } }),
    prisma.product.findMany({ where: { companyId: company.id } }),
    prisma.fixedCost.findMany({ where: { companyId: company.id } }),
    prisma.variableCost.findMany({ where: { companyId: company.id } }),
  ]);

  const inversionTotal = totalInvestment(investments.map((i) => i.amount));
  const snapshot = buildCompanySnapshot(
    toEngineProducts(products),
    toEngineVariableCosts(variableCosts),
    toEngineFixedCosts(fixedCosts),
    company.taxRatePct
  );
  const roi = computeRoi(snapshot.statement.utilidadNeta, inversionTotal);
  const payback = computePaybackMonths(inversionTotal, snapshot.cashFlow.flujoNeto);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Inversión Inicial</h1>
          <p className="text-sm text-slate-500">
            Equipamiento, infraestructura, tecnología, capital de trabajo y gastos preoperativos (spec §5).
          </p>
        </div>
        <InvestmentFormDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              Nuevo ítem
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Inversión total"
          value={formatCurrency(inversionTotal, company.currency)}
          explanation={{
            meaning: "La suma de todos los ítems de inversión inicial que registraste.",
            why: "Define cuánto capital necesitas para arrancar o escalar tu negocio.",
            howCalculated: "Inversión Total = Σ montos de todos los ítems de inversión.",
            isGoodOrBad: "No aplica un juicio de bien/mal — es la base para calcular ROI y payback.",
            whatToDo: "Compara este monto contra tu capital disponible o el que buscas levantar.",
          }}
        />
        <KpiCard
          label="ROI"
          value={`${roi.toFixed(1)}%`}
          status={roi >= 15 ? "verde" : roi >= 0 ? "amarillo" : "rojo"}
          explanation={{
            meaning: "El retorno que genera tu utilidad neta actual sobre la inversión total.",
            why: "Te dice si el negocio, con su rentabilidad actual, justifica el capital invertido.",
            howCalculated: "ROI (%) = (Utilidad Neta / Inversión Total) × 100 — fórmula 21.3.",
            isGoodOrBad: roi >= 15 ? "Saludable para la mayoría de negocios." : roi >= 0 ? "Positivo pero ajustado." : "Negativo: la inversión no se recupera al ritmo actual.",
            whatToDo: "Si es bajo, revisa precios, costos o el mix de productos en Mi Negocio.",
          }}
        />
        <KpiCard
          label="Payback"
          value={Number.isFinite(payback) ? `${payback.toFixed(1)} meses` : "—"}
          explanation={{
            meaning: "El tiempo estimado para recuperar tu inversión inicial con el flujo de caja actual.",
            why: "Cuanto más corto, más rápido liberas el capital invertido.",
            howCalculated: "Payback (meses) = Inversión Inicial / Flujo de Caja Promedio Mensual — fórmula 21.3.",
            isGoodOrBad: Number.isFinite(payback) && payback <= 24 ? "Razonable para un negocio en marcha." : "Largo — revisa el flujo de caja del negocio.",
            whatToDo: "Mejora el flujo de caja mensual (Dashboard) para acortar este plazo.",
          }}
        />
      </div>

      <InvestmentsTable investments={investments} currency={company.currency} />

      <VanTirCalculator baseAnnualCashFlow={snapshot.cashFlow.flujoNeto * 12} inversionTotal={inversionTotal} currency={company.currency} />
    </div>
  );
}

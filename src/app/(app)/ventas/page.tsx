import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { computeCAC, computeCostPerLead, computeLTV, computeLtvCacRatio, computeOverallConversionPct } from "@/lib/engine/funnel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KpiCard } from "@/components/shared/kpi-card";
import { FunnelForm } from "@/components/ventas/funnel-form";
import { FunnelChart } from "@/components/ventas/funnel-chart";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default async function VentasPage() {
  const { company } = await requireCompany();
  const funnel = await prisma.salesFunnel.findUnique({ where: { companyId: company.id } });

  const stages = {
    leads: funnel?.leads ?? 0,
    contactos: funnel?.contactos ?? 0,
    prospectos: funnel?.prospectos ?? 0,
    reuniones: funnel?.reuniones ?? 0,
    cotizaciones: funnel?.cotizaciones ?? 0,
    negociaciones: funnel?.negociaciones ?? 0,
    ventas: funnel?.ventas ?? 0,
  };

  const overallConversionPct = computeOverallConversionPct(stages);
  const costPerLead = computeCostPerLead(funnel?.marketingSpend ?? 0, stages.leads);
  const cac = computeCAC(funnel?.marketingSpend ?? 0, stages.ventas);
  const ltv = computeLTV(funnel?.avgTicket ?? 0, funnel?.purchaseFrequencyPerYear ?? 0, funnel?.customerLifetimeYears ?? 0);
  const ltvCac = computeLtvCacRatio(ltv, cac);

  const hasData = stages.leads > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Proyección de Ventas y Embudo Comercial</h1>
        <p className="text-sm text-slate-500">Leads → Contactos → Prospectos → Reuniones → Cotizaciones → Negociaciones → Ventas (spec §7).</p>
      </div>

      {hasData && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Conversión global"
            value={formatPercent(overallConversionPct)}
            explanation={{
              meaning: "El % de leads que terminan convirtiéndose en una venta.",
              why: "Resume la eficiencia de todo tu embudo comercial en un solo número.",
              howCalculated: "Conversión global = Ventas / Leads × 100 (spec §7).",
              isGoodOrBad: "Varía mucho por industria — compárala contra tu propio histórico.",
              whatToDo: "Si baja, revisa en qué etapa del embudo estás perdiendo más prospectos.",
            }}
          />
          <KpiCard
            label="Costo por Lead"
            value={formatCurrency(costPerLead, company.currency)}
            explanation={{
              meaning: "Cuánto gastas en marketing para generar un lead nuevo.",
              why: "Es la base para calcular el CAC y decidir cuánto invertir en generar demanda.",
              howCalculated: "Costo por Lead = Gasto de marketing / N° de leads.",
              isGoodOrBad: "Debe ser bajo en relación al ticket promedio y la tasa de conversión.",
              whatToDo: "Optimiza los canales con menor costo por lead y mejor conversión.",
            }}
          />
          <KpiCard
            label="CAC"
            value={formatCurrency(cac, company.currency)}
            explanation={{
              meaning: "El costo de adquisición por cada cliente nuevo.",
              why: "Determina si tu inversión en ventas y marketing es rentable.",
              howCalculated: "CAC = Gasto total Marketing y Ventas / N° clientes nuevos (fórmula 21.12).",
              isGoodOrBad: "Debe ser claramente menor a tu LTV (idealmente LTV/CAC ≥ 3).",
              whatToDo: "Si es alto, mejora la conversión del embudo antes de subir el presupuesto de marketing.",
            }}
          />
          <KpiCard
            label="LTV / CAC"
            value={Number.isFinite(ltvCac.ratio) ? `${ltvCac.ratio.toFixed(1)}x` : "—"}
            status={ltvCac.healthy ? "verde" : "rojo"}
            explanation={{
              meaning: "Cuántas veces el valor de vida de un cliente supera lo que cuesta adquirirlo.",
              why: "Es el indicador clave de si tu modelo de adquisición de clientes es sostenible.",
              howCalculated: "LTV = Ticket promedio × Frecuencia anual × Vida útil (años). Relación saludable: LTV/CAC ≥ 3 (fórmula 21.12).",
              isGoodOrBad: ltvCac.healthy ? "Saludable (≥3x)." : "Por debajo del mínimo recomendado (3x).",
              whatToDo: "Sube el ticket promedio, la frecuencia de compra, o baja el CAC mejorando la conversión.",
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Embudo comercial</CardTitle>
            <CardDescription>Visualización de la caída entre etapas.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasData ? <FunnelChart stages={stages} /> : <p className="text-sm text-slate-500">Carga los datos del embudo para ver la visualización.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Editar embudo del mes</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelForm funnel={funnel} currency={company.currency} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import Link from "next/link";
import type { KpiCategory, KpiLibraryItem } from "@/lib/engine/kpi-library";
import type { MethodologyTopicId } from "@/lib/methodology";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";

const CATEGORY_LABELS: Record<KpiCategory, string> = {
  financiero: "Financieros",
  comercial: "Comerciales",
  operativo: "Operativos",
  marketing: "Marketing",
};

const CATEGORY_ORDER: KpiCategory[] = ["financiero", "comercial", "operativo", "marketing"];

/** Solo se mapean los KPIs con una correspondencia clara a un tema de /metodologia (spec §22) — el resto (ROI/ROIC/ROE, KPIs no disponibles) no fuerza una equivalencia que no existe en la spec. */
const ITEM_TO_TOPIC: Partial<Record<string, MethodologyTopicId>> = {
  ventas: "COSTO_VOLUMEN_UTILIDAD",
  margen_neto: "COSTO_VOLUMEN_UTILIDAD",
  ebitda: "COSTO_VOLUMEN_UTILIDAD",
  utilidad_neta: "COSTO_VOLUMEN_UTILIDAD",
  costo_unitario: "COSTO_VOLUMEN_UTILIDAD",
  cac_financiero: "CAC_LTV",
  ltv: "CAC_LTV",
  cac_marketing: "CAC_LTV",
  leads: "CAC_LTV",
  conversion_comercial: "CAC_LTV",
  conversion_marketing: "CAC_LTV",
  ticket_promedio: "CAC_LTV",
  frecuencia_compra: "CAC_LTV",
  cpl: "CAC_LTV",
};

function formatKpiValue(item: KpiLibraryItem, currency: string): string {
  if (item.value == null) return "No disponible";
  switch (item.kind) {
    case "currency":
      return formatCurrency(item.value, currency);
    case "percent":
      return formatPercent(item.value);
    case "ratio":
      return `${item.value.toFixed(2)}x`;
    case "number":
      return `${item.value.toLocaleString("es-BO", { maximumFractionDigits: 1 })}${item.suffix ?? ""}`;
  }
}

function KpiLibraryCard({ item, currency }: { item: KpiLibraryItem; currency: string }) {
  const available = item.value != null;
  const topic = ITEM_TO_TOPIC[item.id];
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm font-medium text-slate-500">{item.label}</p>
        <p className={`mt-2 text-xl font-semibold ${available ? "text-slate-900" : "text-slate-300"}`}>{formatKpiValue(item, currency)}</p>
        <p className="mt-1.5 text-xs text-slate-400">{item.formula}</p>
        {item.note && <p className="mt-1 text-xs text-slate-500">{item.note}</p>}
        {!available && item.unavailableReason && <p className="mt-1 text-xs text-amber-700">{item.unavailableReason}</p>}
        {available && (
          <Link href={topic ? `/metodologia#${topic}` : "/metodologia"} className="mt-2 inline-block text-xs font-medium text-emerald-700 hover:underline">
            Ver metodología →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export function KpiLibraryGrid({ items, currency }: { items: KpiLibraryItem[]; currency: string }) {
  return (
    <div className="flex flex-col gap-6">
      {CATEGORY_ORDER.map((category) => {
        const categoryItems = items.filter((i) => i.category === category);
        if (categoryItems.length === 0) return null;
        return (
          <div key={category} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-slate-900">{CATEGORY_LABELS[category]}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categoryItems.map((item) => (
                <KpiLibraryCard key={item.id} item={item} currency={currency} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

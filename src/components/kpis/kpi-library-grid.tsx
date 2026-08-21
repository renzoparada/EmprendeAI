import type { KpiCategory, KpiLibraryItem } from "@/lib/engine/kpi-library";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";

const CATEGORY_LABELS: Record<KpiCategory, string> = {
  financiero: "Financieros",
  comercial: "Comerciales",
  operativo: "Operativos",
  marketing: "Marketing",
};

const CATEGORY_ORDER: KpiCategory[] = ["financiero", "comercial", "operativo", "marketing"];

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
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm font-medium text-slate-500">{item.label}</p>
        <p className={`mt-2 text-xl font-semibold ${available ? "text-slate-900" : "text-slate-300"}`}>{formatKpiValue(item, currency)}</p>
        <p className="mt-1.5 text-xs text-slate-400">{item.formula}</p>
        {item.note && <p className="mt-1 text-xs text-slate-500">{item.note}</p>}
        {!available && item.unavailableReason && <p className="mt-1 text-xs text-amber-700">{item.unavailableReason}</p>}
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

import type { ValuationRange } from "@/lib/engine/valuation";
import { formatCurrency } from "@/lib/utils";

export function ValuationRangeDisplay({ range, currency }: { range: ValuationRange | null; currency: string }) {
  if (!range) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        Todavía no hay suficientes supuestos cargados para calcular un rango de valoración. Completa los supuestos de
        abajo (al menos un método).
      </div>
    );
  }

  const span = range.max - range.min || 1;
  const probablePct = ((range.probable - range.min) / span) * 100;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-500">Mínimo</p>
          <p className="text-lg font-semibold text-slate-700">{formatCurrency(range.min, currency)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-emerald-600">Probable</p>
          <p className="text-2xl font-bold text-emerald-700">{formatCurrency(range.probable, currency)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Máximo</p>
          <p className="text-lg font-semibold text-slate-700">{formatCurrency(range.max, currency)}</p>
        </div>
      </div>
      <div className="relative h-2.5 w-full rounded-full bg-gradient-to-r from-slate-200 via-emerald-200 to-slate-200">
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-600 shadow"
          style={{ left: `${Math.min(100, Math.max(0, probablePct))}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">
        Calculado con {range.methodResults.length} {range.methodResults.length === 1 ? "método" : "métodos"} —
        siempre se muestra un rango, nunca una cifra única (spec §16.1).
      </p>
    </div>
  );
}

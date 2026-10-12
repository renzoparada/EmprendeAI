import type { FunnelStages } from "@/lib/engine/funnel";
import { FUNNEL_STAGE_LABELS, computeFunnelConversions } from "@/lib/engine/funnel";
import { formatPercent } from "@/lib/utils";

const STAGE_KEYS: (keyof FunnelStages)[] = ["leads", "contactos", "prospectos", "reuniones", "cotizaciones", "negociaciones", "ventas"];

export function FunnelChart({ stages }: { stages: FunnelStages }) {
  const maxCount = Math.max(1, ...STAGE_KEYS.map((k) => stages[k]));
  const conversions = computeFunnelConversions(stages);

  return (
    <div className="flex flex-col gap-2">
      {STAGE_KEYS.map((key, i) => {
        const count = stages[key];
        const widthPct = Math.max(4, (count / maxCount) * 100);
        const conversion = i > 0 ? conversions[i - 1] : null;
        return (
          <div key={key} className="flex flex-col gap-1">
            {conversion && (
              <p className="text-center text-[10px] text-slate-400">↓ {formatPercent(conversion.conversionPct)} conversión</p>
            )}
            <div className="flex items-center gap-3">
              <div className="w-28 shrink-0 text-right text-xs font-medium text-slate-600">{FUNNEL_STAGE_LABELS[key]}</div>
              <div className="flex-1">
                <div
                  className="flex h-8 items-center justify-end rounded-md bg-emerald-500 px-2 text-xs font-semibold text-white"
                  style={{ width: `${widthPct}%` }}
                >
                  {count.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

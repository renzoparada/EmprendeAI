import type { PeriodChange } from "@/lib/engine/temporal-benchmark";
import { Badge } from "@/components/ui/badge";

/** `positiveIsGood=false` para métricas donde subir es malo (ej. costos, punto de equilibrio). */
export function PeriodDeltaBadge({ change, label, positiveIsGood = true }: { change: PeriodChange | null; label: string; positiveIsGood?: boolean }) {
  if (!change || change.deltaPct == null) return null;

  const positive = change.deltaPct >= 0;
  const isGood = positive === positiveIsGood;
  return (
    <Badge variant={isGood ? "secondary" : "warning"}>
      {positive ? "▲" : "▼"} {Math.abs(change.deltaPct).toFixed(1)}% {label}
    </Badge>
  );
}

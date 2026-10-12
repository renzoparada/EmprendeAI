import type { RiskRow } from "@/lib/engine/risk";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const LEVEL_VARIANT = { bajo: "secondary", medio: "warning", alto: "danger" } as const;
const LEVEL_LABEL = { bajo: "Bajo", medio: "Medio", alto: "Alto" } as const;
const PROBABILITY_LABEL = { baja: "Baja", media: "Media", alta: "Alta" } as const;

export function RiskMatrixTable({ risks }: { risks: RiskRow[] }) {
  if (risks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        No se detectaron riesgos activos con los datos actuales del negocio.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Riesgo</TableHead>
          <TableHead>Probabilidad</TableHead>
          <TableHead>Impacto</TableHead>
          <TableHead>Nivel</TableHead>
          <TableHead>Mitigación</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {risks.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium text-slate-900">{r.risk}</TableCell>
            <TableCell>{PROBABILITY_LABEL[r.probability]}</TableCell>
            <TableCell>{LEVEL_LABEL[r.impact]}</TableCell>
            <TableCell>
              <Badge variant={LEVEL_VARIANT[r.level]}>{LEVEL_LABEL[r.level]}</Badge>
            </TableCell>
            <TableCell className="max-w-xs text-xs text-slate-600">{r.mitigation}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

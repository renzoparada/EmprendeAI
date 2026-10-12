import type { CapTableEntry, Shareholder } from "@prisma/client";
import { computeOwnershipPct } from "@/lib/engine/captable";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CapTableEntryFormDialog } from "@/components/socios/cap-table-entry-form-dialog";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteCapTableEntry } from "@/lib/actions/captable-actions";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Pencil } from "lucide-react";

const TYPE_LABELS = { FOUNDER: "Fundador", INVERSIONISTA: "Inversionista", ESOP: "ESOP", OTRO: "Otro" } as const;

export function CapTableView({
  entries,
  shareholders,
  currency,
}: {
  entries: CapTableEntry[];
  shareholders: Shareholder[];
  currency: string;
}) {
  const shareholderById = new Map(shareholders.map((s) => [s.id, s]));
  const totalShares = entries.reduce((sum, e) => sum + e.shares, 0);

  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        Todavía no hay participaciones registradas. Agrega tus socios y sus acciones/participaciones para construir el
        cap table.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Socio</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
          <TableHead className="text-right">% Participación</TableHead>
          <TableHead>Clase</TableHead>
          <TableHead className="text-right">Invertido</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => {
          const shareholder = shareholderById.get(entry.shareholderId);
          return (
            <TableRow key={entry.id}>
              <TableCell className="font-medium text-slate-900">{shareholder?.name ?? "—"}</TableCell>
              <TableCell>
                <Badge variant="secondary">{shareholder ? TYPE_LABELS[shareholder.type] : "—"}</Badge>
              </TableCell>
              <TableCell className="text-right">{entry.shares.toLocaleString()}</TableCell>
              <TableCell className="text-right font-medium">{formatPercent(computeOwnershipPct(entry.shares, totalShares))}</TableCell>
              <TableCell>{entry.isPreferred ? <Badge variant="warning">Preferente ×{entry.liquidationPreferenceMultiple}</Badge> : <Badge variant="outline">Común</Badge>}</TableCell>
              <TableCell className="text-right">{entry.investedAmount > 0 ? formatCurrency(entry.investedAmount, currency) : "—"}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <CapTableEntryFormDialog
                    entry={entry}
                    shareholders={shareholders}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DeleteButton id={entry.id} action={deleteCapTableEntry} confirmMessage="¿Eliminar esta participación?" />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

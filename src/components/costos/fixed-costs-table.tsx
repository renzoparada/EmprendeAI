import type { FixedCost } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FixedCostFormDialog } from "@/components/costos/fixed-cost-form-dialog";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteFixedCost } from "@/lib/actions/cost-actions";
import { formatCurrency } from "@/lib/utils";
import { FIXED_COST_CATEGORY_LABELS } from "@/lib/constants";
import { Pencil } from "lucide-react";

export function FixedCostsTable({ costs, currency }: { costs: FixedCost[]; currency: string }) {
  if (costs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
        No registraste costos fijos todavía (alquiler, sueldos, servicios, software...).
      </div>
    );
  }

  const totalMonthly = costs.reduce((sum, c) => sum + (c.periodicity === "ANUAL" ? c.amount / 12 : c.amount), 0);

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Periodicidad</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead className="text-right">Equivalente mensual</TableHead>
            <TableHead className="text-right">Crecimiento</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {costs.map((cost) => (
            <TableRow key={cost.id}>
              <TableCell className="font-medium text-slate-900">{cost.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">{FIXED_COST_CATEGORY_LABELS[cost.category]}</Badge>
              </TableCell>
              <TableCell>{cost.periodicity === "ANUAL" ? "Anual" : "Mensual"}</TableCell>
              <TableCell className="text-right">{formatCurrency(cost.amount, currency)}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(cost.periodicity === "ANUAL" ? cost.amount / 12 : cost.amount, currency)}
              </TableCell>
              <TableCell className="text-right">{cost.growthPct}%</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <FixedCostFormDialog
                    cost={cost}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DeleteButton id={cost.id} action={deleteFixedCost} confirmMessage="¿Eliminar este costo fijo?" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-right text-sm text-slate-500">
        Total costos fijos mensuales: <span className="font-semibold text-slate-900">{formatCurrency(totalMonthly, currency)}</span>
      </p>
    </div>
  );
}

import type { Investment } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InvestmentFormDialog } from "@/components/inversion/investment-form-dialog";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteInvestment } from "@/lib/actions/investment-actions";
import { formatCurrency } from "@/lib/utils";
import { INVESTMENT_CATEGORY_LABELS } from "@/lib/constants";
import { Pencil } from "lucide-react";

export function InvestmentsTable({ investments, currency }: { investments: Investment[]; currency: string }) {
  if (investments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
        No registraste ítems de inversión inicial todavía.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {investments.map((inv) => (
          <TableRow key={inv.id}>
            <TableCell className="font-medium text-slate-900">{inv.name}</TableCell>
            <TableCell>
              <Badge variant="secondary">{INVESTMENT_CATEGORY_LABELS[inv.category]}</Badge>
            </TableCell>
            <TableCell className="text-right">{formatCurrency(inv.amount, currency)}</TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                <InvestmentFormDialog
                  investment={inv}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                />
                <DeleteButton id={inv.id} action={deleteInvestment} confirmMessage="¿Eliminar este ítem de inversión?" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

import type { Product, VariableCost } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VariableCostFormDialog } from "@/components/costos/variable-cost-form-dialog";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteVariableCost } from "@/lib/actions/cost-actions";
import { formatCurrency } from "@/lib/utils";
import { VARIABLE_COST_CATEGORY_LABELS } from "@/lib/constants";
import { Pencil } from "lucide-react";

export function VariableCostsTable({
  costs,
  products,
  currency,
}: {
  costs: VariableCost[];
  products: Product[];
  currency: string;
}) {
  const productName = (id: string | null) => products.find((p) => p.id === id)?.name ?? "Toda la empresa";

  if (costs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
        No registraste costos variables todavía (materia prima, comisiones, empaque, transporte...).
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Aplica a</TableHead>
          <TableHead className="text-right">Monto/unidad</TableHead>
          <TableHead className="text-right">% de ventas</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {costs.map((cost) => (
          <TableRow key={cost.id}>
            <TableCell className="font-medium text-slate-900">{cost.name}</TableCell>
            <TableCell>
              <Badge variant="secondary">{VARIABLE_COST_CATEGORY_LABELS[cost.category]}</Badge>
            </TableCell>
            <TableCell>{productName(cost.productId)}</TableCell>
            <TableCell className="text-right">
              {cost.amountPerUnit != null ? formatCurrency(cost.amountPerUnit, currency) : "—"}
            </TableCell>
            <TableCell className="text-right">{cost.pctOfSales != null ? `${cost.pctOfSales}%` : "—"}</TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                <VariableCostFormDialog
                  cost={cost}
                  products={products}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                />
                <DeleteButton id={cost.id} action={deleteVariableCost} confirmMessage="¿Eliminar este costo variable?" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

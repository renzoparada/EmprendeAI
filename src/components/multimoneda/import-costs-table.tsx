import type { ImportCost, Product } from "@prisma/client";
import { computeImportCost, importCostPerUnit } from "@/lib/engine/currency";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteImportCost } from "@/lib/actions/import-cost-actions";
import { ImportCostFormDialog } from "@/components/multimoneda/import-cost-form-dialog";
import { formatCurrency } from "@/lib/utils";
import { Pencil } from "lucide-react";

export function ImportCostsTable({
  importCosts,
  importedProducts,
  ratesByCurrency,
  currency,
}: {
  importCosts: ImportCost[];
  importedProducts: Product[];
  ratesByCurrency: Map<string, number>;
  currency: string;
}) {
  const productName = (id: string) => importedProducts.find((p) => p.id === id)?.name ?? "—";

  if (importedProducts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        No tienes productos marcados como &quot;Importado&quot; todavía. Cámbialo en Mi Negocio para habilitar este submódulo.
      </p>
    );
  }

  if (importCosts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        Registra el costo de importación de tus productos importados para que se sume a su costo variable.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Producto</TableHead>
          <TableHead>Moneda</TableHead>
          <TableHead className="text-right">FOB+Flete+Seguro</TableHead>
          <TableHead className="text-right">Total ({currency})</TableHead>
          <TableHead className="text-right">Por unidad ({currency})</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {importCosts.map((ic) => {
          const rate = ratesByCurrency.get(ic.originCurrency);
          const result = rate
            ? computeImportCost({
                fobCost: ic.fobCost,
                freight: ic.freight,
                insurance: ic.insurance,
                tariffPct: ic.tariffPct,
                exchangeRate: rate,
                nationalizationFees: ic.nationalizationFees,
                bankFee: ic.bankFee,
              })
            : null;
          return (
            <TableRow key={ic.id}>
              <TableCell className="font-medium text-slate-900">{productName(ic.productId)}</TableCell>
              <TableCell>{ic.originCurrency}</TableCell>
              <TableCell className="text-right">
                {ic.originCurrency} {(ic.fobCost + ic.freight + ic.insurance).toFixed(2)}
              </TableCell>
              <TableCell className="text-right">{result ? formatCurrency(result.totalFunctional, currency) : "Falta tipo de cambio"}</TableCell>
              <TableCell className="text-right">{result ? formatCurrency(importCostPerUnit(result, ic.quantity), currency) : "—"}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <ImportCostFormDialog
                    importCost={ic}
                    importedProducts={importedProducts}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DeleteButton id={ic.id} action={deleteImportCost} confirmMessage="¿Eliminar este costo de importación?" />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

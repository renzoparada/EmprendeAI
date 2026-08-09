import type { Product, VariableCost } from "@prisma/client";
import { computeProductEconomics } from "@/lib/engine/financial";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductFormDialog } from "@/components/mi-negocio/product-form-dialog";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteProduct } from "@/lib/actions/product-actions";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Pencil } from "lucide-react";

export function ProductsTable({
  products,
  variableCosts,
  currency,
}: {
  products: Product[];
  variableCosts: VariableCost[];
  currency: string;
}) {
  const companyWidePctOfSales = variableCosts
    .filter((c) => !c.productId)
    .reduce((sum, c) => sum + (c.pctOfSales ?? 0), 0);

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
        Todavía no registraste productos ni servicios. Agrega el primero para que el motor financiero empiece a
        calcular tus márgenes.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Precio</TableHead>
          <TableHead className="text-right">Costo variable u.</TableHead>
          <TableHead className="text-right">Unid./mes</TableHead>
          <TableHead className="text-right">Margen unitario</TableHead>
          <TableHead className="text-right">Margen %</TableHead>
          <TableHead className="text-right">Contribución marginal</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => {
          const eco = computeProductEconomics(product, variableCosts, companyWidePctOfSales);
          return (
            <TableRow key={product.id}>
              <TableCell className="font-medium text-slate-900">{product.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">{product.type === "PRODUCTO" ? "Producto" : "Servicio"}</Badge>
              </TableCell>
              <TableCell className="text-right">{formatCurrency(product.price, currency)}</TableCell>
              <TableCell className="text-right">{formatCurrency(eco.unitVariableCost, currency)}</TableCell>
              <TableCell className="text-right">{product.unitsSoldMonthly}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(eco.unitMargin, currency)}</TableCell>
              <TableCell className={`text-right font-medium ${eco.unitMarginPct < 0 ? "text-red-600" : "text-emerald-700"}`}>
                {formatPercent(eco.unitMarginPct)}
              </TableCell>
              <TableCell className="text-right">{formatCurrency(eco.marginalContribution, currency)}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <ProductFormDialog
                    product={product}
                    currency={currency}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DeleteButton id={product.id} action={deleteProduct} confirmMessage="¿Eliminar este producto?" />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

"use client";

import { useActionState } from "react";
import type { PricePoint } from "@prisma/client";
import { savePricePoint, deletePricePoint } from "@/lib/actions/price-point-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteButton } from "@/components/shared/delete-button";
import { formatCurrency } from "@/lib/utils";
import { Plus } from "lucide-react";

const initialState: ActionState = {};

function AddPricePointForm({ productId }: { productId: string }) {
  const [state, formAction, isPending] = useActionState(savePricePoint, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="productId" value={productId} />
      <div className="flex flex-col gap-1">
        <Label htmlFor="pp-price" className="text-xs">
          Precio
        </Label>
        <Input id="pp-price" name="price" type="number" step="0.01" min={0} required className="h-9 w-28" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="pp-quantity" className="text-xs">
          Cantidad vendida
        </Label>
        <Input id="pp-quantity" name="quantity" type="number" step="1" min={0} required className="h-9 w-32" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="pp-date" className="text-xs">
          Fecha
        </Label>
        <Input id="pp-date" name="recordedAt" type="date" className="h-9" />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        <Plus className="h-4 w-4" />
        Agregar
      </Button>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

export function PricePointsPanel({
  productId,
  pricePoints,
  currency,
}: {
  productId: string;
  pricePoints: PricePoint[];
  currency: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <AddPricePointForm productId={productId} />
      {pricePoints.length === 0 ? (
        <p className="text-sm text-slate-500">
          Sin datos históricos todavía. Agrega al menos 2 pares (precio, cantidad vendida) de distintos períodos para
          construir la curva de demanda.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Cantidad vendida</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pricePoints.map((pp) => (
              <TableRow key={pp.id}>
                <TableCell>{new Date(pp.recordedAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">{formatCurrency(pp.price, currency)}</TableCell>
                <TableCell className="text-right">{pp.quantity}</TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <DeleteButton id={pp.id} action={deletePricePoint} confirmMessage="¿Eliminar este dato histórico?" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

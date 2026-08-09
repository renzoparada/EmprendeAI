"use client";

import { useActionState, useEffect, useState } from "react";
import type { Product, VariableCost } from "@prisma/client";
import { saveVariableCost } from "@/lib/actions/cost-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { VARIABLE_COST_CATEGORY_LABELS } from "@/lib/constants";

const initialState: ActionState = {};

export function VariableCostFormDialog({
  trigger,
  cost,
  products,
}: {
  trigger: React.ReactNode;
  cost?: VariableCost;
  products: Product[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(saveVariableCost, initialState);

  useEffect(() => {
    // Sincroniza con el resultado de la Server Action (sistema externo) —
    // cierra el modal cuando useActionState reporta éxito.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{cost ? "Editar costo variable" : "Nuevo costo variable"}</DialogTitle>
          <DialogDescription>
            Materia prima, comisiones, empaque, transporte, etc. Define un monto por unidad o un % de ventas (spec §4).
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {cost && <input type="hidden" name="id" value={cost.id} />}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vc-name">Nombre</Label>
            <Input id="vc-name" name="name" defaultValue={cost?.name} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vc-category">Categoría</Label>
              <select
                id="vc-category"
                name="category"
                defaultValue={cost?.category ?? "OTROS"}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                {Object.entries(VARIABLE_COST_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vc-product">Producto asociado (opcional)</Label>
              <select
                id="vc-product"
                name="productId"
                defaultValue={cost?.productId ?? ""}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="">Toda la empresa</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vc-amountPerUnit">Monto por unidad (opcional)</Label>
              <Input
                id="vc-amountPerUnit"
                name="amountPerUnit"
                type="number"
                step="0.01"
                min={0}
                defaultValue={cost?.amountPerUnit ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vc-pctOfSales">% de ventas (opcional)</Label>
              <Input
                id="vc-pctOfSales"
                name="pctOfSales"
                type="number"
                step="0.1"
                min={0}
                max={100}
                defaultValue={cost?.pctOfSales ?? ""}
              />
            </div>
          </div>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

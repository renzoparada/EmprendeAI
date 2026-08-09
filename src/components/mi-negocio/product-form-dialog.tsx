"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import type { Product } from "@prisma/client";
import { saveProduct } from "@/lib/actions/product-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { computeProductEconomics } from "@/lib/engine/financial";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { formatCurrency, formatPercent } from "@/lib/utils";

const initialState: ActionState = {};

export function ProductFormDialog({
  trigger,
  product,
  currency,
}: {
  trigger: React.ReactNode;
  product?: Product;
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(saveProduct, initialState);

  const [price, setPrice] = useState(product?.price ?? 0);
  const [variableCost, setVariableCost] = useState(product?.variableCost ?? 0);
  const [commissionPct, setCommissionPct] = useState(product?.commissionPct ?? 0);
  const [taxPct, setTaxPct] = useState(product?.taxPct ?? 0);
  const [discountPct, setDiscountPct] = useState(product?.discountPct ?? 0);
  const [unitsSoldMonthly, setUnitsSoldMonthly] = useState(product?.unitsSoldMonthly ?? 0);

  useEffect(() => {
    // Sincroniza con el resultado de la Server Action (sistema externo) —
    // cierra el modal cuando useActionState reporta éxito.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.success) setOpen(false);
  }, [state.success]);

  const economics = useMemo(
    () =>
      computeProductEconomics(
        {
          id: "preview",
          name: "",
          price,
          variableCost,
          unitsSoldMonthly,
          commissionPct,
          taxPct,
          discountPct,
        },
        []
      ),
    [price, variableCost, unitsSoldMonthly, commissionPct, taxPct, discountPct]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Editar producto/servicio" : "Nuevo producto/servicio"}</DialogTitle>
          <DialogDescription>El margen se calcula automáticamente con el Financial Engine.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {product && <input type="hidden" name="id" value={product.id} />}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" defaultValue={product?.name} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                name="type"
                defaultValue={product?.type ?? "PRODUCTO"}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="PRODUCTO">Producto</option>
                <option value="SERVICIO">Servicio</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category">Categoría (opcional)</Label>
              <Input id="category" name="category" defaultValue={product?.category ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price">Precio ({currency})</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="variableCost">Costo variable unitario ({currency})</Label>
              <Input
                id="variableCost"
                name="variableCost"
                type="number"
                step="0.01"
                min={0}
                value={variableCost}
                onChange={(e) => setVariableCost(Number(e.target.value))}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="unitsSoldMonthly">Unidades vendidas / mes</Label>
              <Input
                id="unitsSoldMonthly"
                name="unitsSoldMonthly"
                type="number"
                step="1"
                min={0}
                value={unitsSoldMonthly}
                onChange={(e) => setUnitsSoldMonthly(Number(e.target.value))}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="discountPct">Descuento (%)</Label>
              <Input
                id="discountPct"
                name="discountPct"
                type="number"
                step="0.1"
                min={0}
                max={100}
                value={discountPct}
                onChange={(e) => setDiscountPct(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="commissionPct">Comisión (%)</Label>
              <Input
                id="commissionPct"
                name="commissionPct"
                type="number"
                step="0.1"
                min={0}
                max={100}
                value={commissionPct}
                onChange={(e) => setCommissionPct(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="taxPct">Impuesto (%)</Label>
              <Input
                id="taxPct"
                name="taxPct"
                type="number"
                step="0.1"
                min={0}
                max={100}
                value={taxPct}
                onChange={(e) => setTaxPct(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm">
            <p className="font-medium text-emerald-900">Cálculo automático (spec §3 / fórmula 21.1)</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-emerald-800">
              <div>
                <p className="text-xs text-emerald-600">Margen unitario</p>
                <p className="font-semibold">{formatCurrency(economics.unitMargin, currency)}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-600">Margen %</p>
                <p className="font-semibold">{formatPercent(economics.unitMarginPct)}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-600">Contribución marginal / mes</p>
                <p className="font-semibold">{formatCurrency(economics.marginalContribution, currency)}</p>
              </div>
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

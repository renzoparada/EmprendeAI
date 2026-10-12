"use client";

import { useActionState, useEffect, useState } from "react";
import type { ImportCost, Product } from "@prisma/client";
import { saveImportCost } from "@/lib/actions/import-cost-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { CURRENCY_OPTIONS } from "@/lib/constants";

const initialState: ActionState = {};

export function ImportCostFormDialog({
  trigger,
  importedProducts,
  importCost,
}: {
  trigger: React.ReactNode;
  importedProducts: Product[];
  importCost?: ImportCost;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(saveImportCost, initialState);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{importCost ? "Editar costo de importación" : "Nuevo costo de importación"}</DialogTitle>
          <DialogDescription>FOB, flete, seguro, arancel, nacionalización y comisión bancaria (spec §4, fórmula 6.3).</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {importCost && <input type="hidden" name="id" value={importCost.id} />}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="productId">Producto importado</Label>
              <select
                id="productId"
                name="productId"
                defaultValue={importCost?.productId ?? importedProducts[0]?.id}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
                required
              >
                {importedProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="originCurrency">Moneda de origen</Label>
              <select id="originCurrency" name="originCurrency" defaultValue={importCost?.originCurrency ?? "USD"} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quantity">Unidades del lote</Label>
              <Input id="quantity" name="quantity" type="number" step="1" min={1} defaultValue={importCost?.quantity} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fobCost">Costo FOB</Label>
              <Input id="fobCost" name="fobCost" type="number" step="0.01" min={0} defaultValue={importCost?.fobCost} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="freight">Flete</Label>
              <Input id="freight" name="freight" type="number" step="0.01" min={0} defaultValue={importCost?.freight ?? 0} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="insurance">Seguro</Label>
              <Input id="insurance" name="insurance" type="number" step="0.01" min={0} defaultValue={importCost?.insurance ?? 0} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tariffPct">Arancel (%)</Label>
              <Input id="tariffPct" name="tariffPct" type="number" step="0.1" min={0} defaultValue={importCost?.tariffPct ?? 0} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nationalizationFees">Gastos de nacionalización</Label>
              <Input id="nationalizationFees" name="nationalizationFees" type="number" step="0.01" min={0} defaultValue={importCost?.nationalizationFees ?? 0} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bankFee">Comisión bancaria</Label>
              <Input id="bankFee" name="bankFee" type="number" step="0.01" min={0} defaultValue={importCost?.bankFee ?? 0} />
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

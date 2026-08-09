"use client";

import { useActionState, useEffect, useState } from "react";
import type { FixedCost } from "@prisma/client";
import { saveFixedCost } from "@/lib/actions/cost-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { FIXED_COST_CATEGORY_LABELS } from "@/lib/constants";

const initialState: ActionState = {};

export function FixedCostFormDialog({ trigger, cost }: { trigger: React.ReactNode; cost?: FixedCost }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(saveFixedCost, initialState);

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
          <DialogTitle>{cost ? "Editar costo fijo" : "Nuevo costo fijo"}</DialogTitle>
          <DialogDescription>Alquiler, sueldos, servicios, software, seguros, marketing, etc. (spec §4)</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {cost && <input type="hidden" name="id" value={cost.id} />}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fc-name">Nombre</Label>
            <Input id="fc-name" name="name" defaultValue={cost?.name} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fc-category">Categoría</Label>
              <select
                id="fc-category"
                name="category"
                defaultValue={cost?.category ?? "OTROS"}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                {Object.entries(FIXED_COST_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fc-periodicity">Periodicidad</Label>
              <select
                id="fc-periodicity"
                name="periodicity"
                defaultValue={cost?.periodicity ?? "MENSUAL"}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="MENSUAL">Mensual</option>
                <option value="ANUAL">Anual</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fc-amount">Monto</Label>
              <Input id="fc-amount" name="amount" type="number" step="0.01" min={0} defaultValue={cost?.amount} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fc-growth">Crecimiento esperado (%)</Label>
              <Input id="fc-growth" name="growthPct" type="number" step="0.1" defaultValue={cost?.growthPct ?? 0} />
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

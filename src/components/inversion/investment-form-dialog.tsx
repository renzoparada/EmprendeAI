"use client";

import { useActionState, useEffect, useState } from "react";
import type { Investment } from "@prisma/client";
import { saveInvestment } from "@/lib/actions/investment-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { INVESTMENT_CATEGORY_LABELS } from "@/lib/constants";

const initialState: ActionState = {};

export function InvestmentFormDialog({ trigger, investment }: { trigger: React.ReactNode; investment?: Investment }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(saveInvestment, initialState);

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
          <DialogTitle>{investment ? "Editar ítem de inversión" : "Nuevo ítem de inversión"}</DialogTitle>
          <DialogDescription>Equipamiento, infraestructura, tecnología, capital de trabajo, etc. (spec §5)</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {investment && <input type="hidden" name="id" value={investment.id} />}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inv-name">Nombre</Label>
            <Input id="inv-name" name="name" defaultValue={investment?.name} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="inv-category">Categoría</Label>
              <select
                id="inv-category"
                name="category"
                defaultValue={investment?.category ?? "OTROS"}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                {Object.entries(INVESTMENT_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="inv-amount">Monto</Label>
              <Input id="inv-amount" name="amount" type="number" step="0.01" min={0} defaultValue={investment?.amount} required />
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

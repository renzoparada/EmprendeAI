"use client";

import { useActionState, useEffect, useState } from "react";
import type { FinancingPlan } from "@prisma/client";
import { saveFinancingPlan } from "@/lib/actions/financing-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { FINANCING_TYPE_LABELS, GRACE_TYPE_LABELS } from "@/lib/constants";

const initialState: ActionState = {};

export function FinancingFormDialog({ trigger, plan }: { trigger: React.ReactNode; plan?: FinancingPlan }) {
  const [open, setOpen] = useState(false);
  const [graceType, setGraceType] = useState(plan?.graceType ?? "NINGUNA");
  const [state, formAction, isPending] = useActionState(saveFinancingPlan, initialState);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{plan ? "Editar financiamiento" : "Nuevo financiamiento"}</DialogTitle>
          <DialogDescription>Préstamo, socios, inversionista, crowdfunding o capital propio (spec §14).</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {plan && <input type="hidden" name="id" value={plan.id} />}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fin-name">Nombre</Label>
            <Input id="fin-name" name="name" defaultValue={plan?.name} placeholder="Ej. Préstamo Banco XYZ" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fin-type">Fuente</Label>
              <select id="fin-type" name="type" defaultValue={plan?.type ?? "PRESTAMO_BANCARIO"} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
                {Object.entries(FINANCING_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fin-principal">Monto</Label>
              <Input id="fin-principal" name="principal" type="number" step="0.01" min={0.01} defaultValue={plan?.principal} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fin-rate">Tasa de interés anual (%)</Label>
              <Input id="fin-rate" name="annualInterestRatePct" type="number" step="0.1" min={0} max={100} defaultValue={plan?.annualInterestRatePct ?? 0} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fin-term">Plazo (meses)</Label>
              <Input id="fin-term" name="termMonths" type="number" step="1" min={1} defaultValue={plan?.termMonths ?? 12} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fin-graceType">Período de gracia</Label>
              <select
                id="fin-graceType"
                name="graceType"
                defaultValue={graceType}
                onChange={(e) => setGraceType(e.target.value as typeof graceType)}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                {Object.entries(GRACE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fin-graceMonths" className={graceType === "NINGUNA" ? "text-slate-400" : undefined}>
                Meses de gracia
              </Label>
              <Input
                id="fin-graceMonths"
                name="gracePeriodMonths"
                type="number"
                step="1"
                min={0}
                disabled={graceType === "NINGUNA"}
                defaultValue={plan?.gracePeriodMonths ?? 0}
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

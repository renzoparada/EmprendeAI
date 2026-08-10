"use client";

import { useActionState, useEffect, useState } from "react";
import { saveExchangeRate } from "@/lib/actions/exchange-rate-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { CURRENCY_OPTIONS } from "@/lib/constants";

const initialState: ActionState = {};

export function ExchangeRateFormDialog({ trigger, companyCurrency }: { trigger: React.ReactNode; companyCurrency: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(saveExchangeRate, initialState);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar tipo de cambio</DialogTitle>
          <DialogDescription>Moneda de origen → {companyCurrency} (tu moneda funcional). Spec §15.1.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="toCurrency" value={companyCurrency} />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fromCurrency">Moneda de origen</Label>
              <select id="fromCurrency" name="fromCurrency" className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
                {CURRENCY_OPTIONS.filter((c) => c !== companyCurrency).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rateType">Tipo</Label>
              <select id="rateType" name="rateType" className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
                <option value="OFICIAL">Oficial</option>
                <option value="PARALELO">Paralelo</option>
                <option value="PROYECTADO">Proyectado</option>
              </select>
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="rate">Tipo de cambio (1 origen = ? {companyCurrency})</Label>
              <Input id="rate" name="rate" type="number" step="0.0001" min={0} required />
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

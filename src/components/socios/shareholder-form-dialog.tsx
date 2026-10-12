"use client";

import { useActionState, useEffect, useState } from "react";
import type { Shareholder } from "@prisma/client";
import { saveShareholder } from "@/lib/actions/captable-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const initialState: ActionState = {};

export function ShareholderFormDialog({ trigger, shareholder }: { trigger: React.ReactNode; shareholder?: Shareholder }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(saveShareholder, initialState);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{shareholder ? "Editar socio" : "Nuevo socio"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {shareholder && <input type="hidden" name="id" value={shareholder.id} />}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sh-name">Nombre</Label>
            <Input id="sh-name" name="name" defaultValue={shareholder?.name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sh-type">Tipo</Label>
            <select id="sh-type" name="type" defaultValue={shareholder?.type ?? "FOUNDER"} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
              <option value="FOUNDER">Fundador</option>
              <option value="INVERSIONISTA">Inversionista</option>
              <option value="ESOP">Pool de opciones (ESOP)</option>
              <option value="OTRO">Otro</option>
            </select>
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

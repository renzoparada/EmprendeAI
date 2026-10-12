"use client";

import { useActionState, useEffect, useState } from "react";
import type { CapTableEntry, Shareholder } from "@prisma/client";
import { saveCapTableEntry } from "@/lib/actions/captable-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";

const initialState: ActionState = {};

export function CapTableEntryFormDialog({
  trigger,
  shareholders,
  entry,
}: {
  trigger: React.ReactNode;
  shareholders: Shareholder[];
  entry?: CapTableEntry;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(saveCapTableEntry, initialState);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry ? "Editar participación" : "Nueva participación"}</DialogTitle>
          <DialogDescription>Acciones/participaciones de un socio en el cap table (spec §16.2).</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {entry && <input type="hidden" name="id" value={entry.id} />}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ct-shareholder">Socio</Label>
            <select id="ct-shareholder" name="shareholderId" defaultValue={entry?.shareholderId ?? shareholders[0]?.id} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" required>
              {shareholders.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ct-shares">Acciones / participaciones</Label>
              <Input id="ct-shares" name="shares" type="number" step="0.01" min={0} defaultValue={entry?.shares} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ct-invested">Monto invertido</Label>
              <Input id="ct-invested" name="investedAmount" type="number" step="0.01" min={0} defaultValue={entry?.investedAmount ?? 0} />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input id="ct-preferred" name="isPreferred" type="checkbox" defaultChecked={entry?.isPreferred ?? false} />
              <Label htmlFor="ct-preferred" className="text-sm">
                Acción preferente
              </Label>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ct-lpm">Múltiplo de preferencia de liquidación</Label>
              <Input id="ct-lpm" name="liquidationPreferenceMultiple" type="number" step="0.1" min={0} defaultValue={entry?.liquidationPreferenceMultiple ?? 1} />
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

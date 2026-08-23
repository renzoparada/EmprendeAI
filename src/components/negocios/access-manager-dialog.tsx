"use client";

import { useActionState, useState } from "react";
import { Users } from "lucide-react";
import { grantCompanyAccess, revokeCompanyAccess } from "@/lib/actions/access-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { DeleteButton } from "@/components/shared/delete-button";

const initialState: ActionState = {};

export interface AccessGrantItem {
  id: string;
  userName: string;
  userEmail: string;
}

export function AccessManagerDialog({ companyId, companyName, grants }: { companyId: string; companyName: string; grants: AccessGrantItem[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(grantCompanyAccess, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="w-full">
          <Users className="h-3.5 w-3.5" />
          Acceso de consultores {grants.length > 0 && `(${grants.length})`}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Acceso a {companyName}</DialogTitle>
          <DialogDescription>
            Otorgá acceso completo (lectura y escritura) a otra cuenta de EMPRENDE AI — como compartir un documento en
            modo edición. Solo vos, como dueño, podés otorgar o revocar acceso (spec §25).
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="companyId" value={companyId} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="access-email">Email de la cuenta</Label>
            <Input id="access-email" name="email" type="email" placeholder="consultor@ejemplo.com" required />
          </div>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Otorgando..." : "Otorgar acceso"}
          </Button>
        </form>

        <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-600">Con acceso actualmente</p>
          {grants.length === 0 ? (
            <p className="text-xs text-slate-400">Nadie más tiene acceso a esta empresa.</p>
          ) : (
            grants.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                <div>
                  <p className="text-sm text-slate-900">{g.userName}</p>
                  <p className="text-xs text-slate-500">{g.userEmail}</p>
                </div>
                <DeleteButton id={g.id} action={revokeCompanyAccess} confirmMessage={`¿Revocar el acceso de ${g.userName}?`} />
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

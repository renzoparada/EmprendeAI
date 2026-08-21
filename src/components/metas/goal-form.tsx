"use client";

import { useActionState } from "react";
import type { Goal } from "@prisma/client";
import { saveGoal } from "@/lib/actions/goal-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function GoalForm({ goal, currency }: { goal: Goal | null; currency: string }) {
  const [state, formAction, isPending] = useActionState(saveGoal, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="targetType">Quiero alcanzar...</Label>
          <select id="targetType" name="targetType" defaultValue={goal?.targetType ?? "UTILIDAD_NETA"} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
            <option value="UTILIDAD_NETA">Utilidad Neta mensual</option>
            <option value="VENTAS">Ventas mensuales</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="targetAmount">Monto objetivo ({currency})</Label>
          <Input id="targetAmount" name="targetAmount" type="number" step="0.01" min={0} defaultValue={goal?.targetAmount} required />
        </div>
      </div>

      <p className="text-xs font-medium text-slate-600">Supuestos editables (spec §23.9)</p>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="targetConversionPct" className="text-xs">
            Conversión leads → clientes (%)
          </Label>
          <Input id="targetConversionPct" name="targetConversionPct" type="number" step="0.1" min={0.1} max={100} defaultValue={goal?.targetConversionPct ?? 20} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="unitsPerCustomer" className="text-xs">
            Unidades por cliente/mes
          </Label>
          <Input id="unitsPerCustomer" name="unitsPerCustomer" type="number" step="0.1" min={0.1} defaultValue={goal?.unitsPerCustomer ?? 1} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="leadsPerVendedor" className="text-xs">
            Leads por vendedor/mes
          </Label>
          <Input id="leadsPerVendedor" name="leadsPerVendedor" type="number" step="1" min={1} defaultValue={goal?.leadsPerVendedor ?? 50} required />
        </div>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar meta"}
        </Button>
      </div>
    </form>
  );
}

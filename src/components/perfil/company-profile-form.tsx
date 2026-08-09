"use client";

import { useActionState } from "react";
import type { Company } from "@prisma/client";
import { updateCompanyProfile } from "@/lib/actions/profile-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CURRENCY_OPTIONS } from "@/lib/constants";

const initialState: ActionState = {};

export function CompanyProfileForm({ company }: { company: Company }) {
  const [state, formAction, isPending] = useActionState(updateCompanyProfile, initialState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="col-span-full flex flex-col gap-1.5">
        <Label htmlFor="p-name">Nombre del negocio</Label>
        <Input id="p-name" name="name" defaultValue={company.name} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="p-country">País</Label>
        <Input id="p-country" name="country" defaultValue={company.country} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="p-city">Ciudad</Label>
        <Input id="p-city" name="city" defaultValue={company.city} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="p-currency">Moneda funcional</Label>
        <select
          id="p-currency"
          name="currency"
          defaultValue={company.currency}
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
        >
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="p-sector">Sector (opcional)</Label>
        <Input id="p-sector" name="sector" defaultValue={company.sector ?? ""} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="p-employees">N° de empleados</Label>
        <Input id="p-employees" name="employeeCount" type="number" min={0} defaultValue={company.employeeCount ?? ""} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="p-tax">Tasa de impuesto a la utilidad (%)</Label>
        <Input id="p-tax" name="taxRatePct" type="number" step="0.1" min={0} max={100} defaultValue={company.taxRatePct} required />
        <p className="text-xs text-slate-500">Supuesto usado por el Financial Engine para calcular la Utilidad Neta (spec §8).</p>
      </div>
      {state.error && <p className="col-span-full text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="col-span-full text-sm text-emerald-700">Datos actualizados.</p>}
      <div className="col-span-full">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

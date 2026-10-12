"use client";

import { useActionState } from "react";
import type { SalesFunnel } from "@prisma/client";
import { saveSalesFunnel } from "@/lib/actions/funnel-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FUNNEL_STAGE_LABELS, type FunnelStages } from "@/lib/engine/funnel";

const initialState: ActionState = {};

const STAGE_KEYS: (keyof FunnelStages)[] = ["leads", "contactos", "prospectos", "reuniones", "cotizaciones", "negociaciones", "ventas"];

export function FunnelForm({ funnel, currency }: { funnel: SalesFunnel | null; currency: string }) {
  const [state, formAction, isPending] = useActionState(saveSalesFunnel, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-xs font-medium text-slate-600">Etapas del embudo (mes actual)</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STAGE_KEYS.map((key) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label htmlFor={key} className="text-xs">
                {FUNNEL_STAGE_LABELS[key]}
              </Label>
              <Input id={key} name={key} type="number" step="1" min={0} defaultValue={funnel?.[key] ?? 0} required />
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-slate-600">Ticket, marketing y ciclo de vida del cliente</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="avgTicket" className="text-xs">
              Ticket promedio ({currency})
            </Label>
            <Input id="avgTicket" name="avgTicket" type="number" step="0.01" min={0} defaultValue={funnel?.avgTicket ?? 0} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="marketingSpend" className="text-xs">
              Gasto de marketing/ventas ({currency})
            </Label>
            <Input id="marketingSpend" name="marketingSpend" type="number" step="0.01" min={0} defaultValue={funnel?.marketingSpend ?? 0} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="purchaseFrequencyPerYear" className="text-xs">
              Frecuencia de compra (veces/año)
            </Label>
            <Input
              id="purchaseFrequencyPerYear"
              name="purchaseFrequencyPerYear"
              type="number"
              step="0.1"
              min={0}
              defaultValue={funnel?.purchaseFrequencyPerYear ?? 1}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customerLifetimeYears" className="text-xs">
              Vida útil del cliente (años)
            </Label>
            <Input
              id="customerLifetimeYears"
              name="customerLifetimeYears"
              type="number"
              step="0.1"
              min={0}
              defaultValue={funnel?.customerLifetimeYears ?? 1}
              required
            />
          </div>
        </div>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar embudo"}
        </Button>
      </div>
    </form>
  );
}

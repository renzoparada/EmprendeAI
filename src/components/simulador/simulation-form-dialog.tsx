"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { BusinessSimulation } from "@prisma/client";
import { saveSimulation } from "@/lib/actions/simulation-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import type { InvestmentEvent } from "@/lib/engine/business-simulator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";

const initialState: ActionState = {};

/** `simulation.investmentEvents` llega ya deserializado desde Prisma (columna Json) — solo se re-parsea si por algún motivo llega como string. */
function parseEvents(value: unknown): InvestmentEvent[] {
  if (Array.isArray(value)) return value as InvestmentEvent[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function SimulationFormDialog({ trigger, simulation }: { trigger: React.ReactNode; simulation?: BusinessSimulation }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(saveSimulation, initialState);
  const [events, setEvents] = useState<InvestmentEvent[]>(() => parseEvents(simulation?.investmentEvents));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.success) setOpen(false);
  }, [state.success]);

  const addEvent = () => setEvents((prev) => [...prev, { month: 1, name: "", amount: 0 }]);
  const removeEvent = (i: number) => setEvents((prev) => prev.filter((_, idx) => idx !== i));
  const updateEvent = (i: number, patch: Partial<InvestmentEvent>) =>
    setEvents((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{simulation ? "Editar simulación" : "Nueva simulación"}</DialogTitle>
          <DialogDescription>Proyección mes a mes sobre tus datos actuales — todos los supuestos son editables (spec §20).</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          {simulation && <input type="hidden" name="id" value={simulation.id} />}
          <input type="hidden" name="investmentEventsJson" value={JSON.stringify(events)} />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sim-name">Nombre</Label>
              <Input id="sim-name" name="name" defaultValue={simulation?.name} placeholder="Ej. Expansión agresiva" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sim-horizon">Horizonte</Label>
              <select id="sim-horizon" name="horizonMonths" defaultValue={simulation?.horizonMonths ?? 12} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
                <option value={12}>12 meses</option>
                <option value={24}>24 meses</option>
                <option value={36}>36 meses</option>
                <option value={60}>60 meses</option>
              </select>
            </div>
          </div>

          <p className="text-xs font-medium text-slate-600">Clientes / Ventas / Precio</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sim-salesGrowth" className="text-xs">
                Crecimiento de ventas mensual (%)
              </Label>
              <Input id="sim-salesGrowth" name="monthlySalesGrowthPct" type="number" step="0.1" defaultValue={simulation?.monthlySalesGrowthPct ?? 0} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sim-price" className="text-xs">
                Ajuste de precio (%, desde el mes 1)
              </Label>
              <Input id="sim-price" name="priceAdjustmentPct" type="number" step="0.1" defaultValue={simulation?.priceAdjustmentPct ?? 0} required />
            </div>
          </div>

          <p className="text-xs font-medium text-slate-600">Costos / Inflación / Personal</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sim-inflation" className="text-xs">
                Inflación anual (%)
              </Label>
              <Input id="sim-inflation" name="annualInflationPct" type="number" step="0.1" defaultValue={simulation?.annualInflationPct ?? 0} required />
            </div>
            <div />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sim-staffCount" className="text-xs">
                N° de empleados
              </Label>
              <Input id="sim-staffCount" name="staffCount" type="number" step="1" min={0} defaultValue={simulation?.staffCount ?? 0} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sim-avgSalary" className="text-xs">
                Sueldo promedio
              </Label>
              <Input id="sim-avgSalary" name="avgSalary" type="number" step="0.01" min={0} defaultValue={simulation?.avgSalary ?? 0} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sim-staffGrowth" className="text-xs">
                Crecimiento de personal mensual (%)
              </Label>
              <Input id="sim-staffGrowth" name="monthlyStaffGrowthPct" type="number" step="0.1" defaultValue={simulation?.monthlyStaffGrowthPct ?? 0} required />
            </div>
          </div>

          <p className="text-xs font-medium text-slate-600">Marketing / Tipo de cambio / Financiamiento</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sim-marketingGrowth" className="text-xs">
                Crecimiento de gasto en marketing mensual (%)
              </Label>
              <Input id="sim-marketingGrowth" name="monthlyMarketingGrowthPct" type="number" step="0.1" defaultValue={simulation?.monthlyMarketingGrowthPct ?? 0} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sim-fxShock" className="text-xs">
                Shock de tipo de cambio (%, desde el mes 1)
              </Label>
              <Input id="sim-fxShock" name="exchangeRateShockPct" type="number" step="0.1" defaultValue={simulation?.exchangeRateShockPct ?? 0} required />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="includeFinancing" defaultChecked={simulation?.includeFinancing ?? true} className="h-4 w-4 rounded border-slate-300" />
            Incluir el servicio de deuda de mis fuentes de Financiamiento registradas
          </label>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-600">Eventos de inversión (opcional)</p>
              <Button type="button" variant="outline" size="sm" onClick={addEvent}>
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </Button>
            </div>
            {events.map((event, i) => (
              <div key={i} className="grid grid-cols-[80px_1fr_120px_36px] items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  placeholder="Mes"
                  value={event.month}
                  onChange={(e) => updateEvent(i, { month: Number(e.target.value) })}
                  aria-label="Mes del evento"
                />
                <Input placeholder="Nombre" value={event.name} onChange={(e) => updateEvent(i, { name: e.target.value })} aria-label="Nombre del evento" />
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="Monto"
                  value={event.amount}
                  onChange={(e) => updateEvent(i, { amount: Number(e.target.value) })}
                  aria-label="Monto del evento"
                />
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-600" onClick={() => removeEvent(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
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

"use client";

import { useActionState } from "react";
import { saveScenario } from "@/lib/actions/scenario-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ScenarioType } from "@/lib/engine/scenarios";

const initialState: ActionState = {};

export function ScenarioEditorForm({
  type,
  salesDeltaPct,
  priceDeltaPct,
  costDeltaPct,
}: {
  type: ScenarioType;
  salesDeltaPct: number;
  priceDeltaPct: number;
  costDeltaPct: number;
}) {
  const [state, formAction, isPending] = useActionState(saveScenario, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="type" value={type} />
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${type}-sales`} className="text-xs">
          Δ Ventas (%)
        </Label>
        <Input id={`${type}-sales`} name="salesDeltaPct" type="number" step="1" defaultValue={salesDeltaPct} className="h-8 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${type}-price`} className="text-xs">
          Δ Precio (%)
        </Label>
        <Input id={`${type}-price`} name="priceDeltaPct" type="number" step="1" defaultValue={priceDeltaPct} className="h-8 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${type}-cost`} className="text-xs">
          Δ Costos (%)
        </Label>
        <Input id={`${type}-cost`} name="costDeltaPct" type="number" step="1" defaultValue={costDeltaPct} className="h-8 text-sm" />
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        {isPending ? "Guardando..." : "Actualizar escenario"}
      </Button>
    </form>
  );
}

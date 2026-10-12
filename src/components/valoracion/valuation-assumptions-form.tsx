"use client";

import { useActionState } from "react";
import type { ValuationAssumptions } from "@prisma/client";
import { saveValuationAssumptions } from "@/lib/actions/valuation-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const initialState: ActionState = {};

function Field({ id, label, help, defaultValue, step = "0.01", required = false }: { id: string; label: string; help?: string; defaultValue: number | string | null | undefined; step?: string; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input id={id} name={id} type="number" step={step} defaultValue={defaultValue ?? ""} required={required} />
      {help && <p className="text-xs text-slate-500">{help}</p>}
    </div>
  );
}

export function ValuationAssumptionsForm({ assumptions, methods }: { assumptions: ValuationAssumptions | null; methods: string[] }) {
  const [state, formAction, isPending] = useActionState(saveValuationAssumptions, initialState);
  const a = assumptions;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Tabs defaultValue={methods.includes("DCF") ? "wacc" : "berkus"}>
        <TabsList>
          {(methods.includes("DCF") || methods.includes("MULTIPLOS") || methods.includes("CAPITALIZACION_UTILIDADES")) && <TabsTrigger value="wacc">WACC / CAPM</TabsTrigger>}
          {methods.includes("DCF") && <TabsTrigger value="dcf">DCF</TabsTrigger>}
          {methods.includes("MULTIPLOS") && <TabsTrigger value="multiplos">Múltiplos</TabsTrigger>}
          {methods.includes("BERKUS") && <TabsTrigger value="berkus">Berkus</TabsTrigger>}
          {methods.includes("SCORECARD") && <TabsTrigger value="scorecard">Scorecard</TabsTrigger>}
          {methods.includes("VC_METHOD") && <TabsTrigger value="vc">VC Method</TabsTrigger>}
        </TabsList>

        <TabsContent value="wacc">
          <p className="mb-3 text-xs text-slate-500">
            Usado para descontar flujos (DCF) y como tasa de capitalización. Si no tienes datos de mercado confiables, deja los valores por defecto — quedan marcados como supuesto (spec §21.5).
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field id="riskFreeRatePct" label="Tasa libre de riesgo (%)" defaultValue={a?.riskFreeRatePct ?? 5} />
            <Field id="beta" label="Beta (β)" defaultValue={a?.beta ?? 1} />
            <Field id="marketReturnPct" label="Retorno de mercado (%)" defaultValue={a?.marketReturnPct ?? 10} />
            <Field id="costOfDebtPct" label="Costo de deuda (%)" defaultValue={a?.costOfDebtPct ?? 8} />
            <Field id="debtRatioPct" label="Deuda / Valor (%)" defaultValue={a?.debtRatioPct ?? 0} />
          </div>
        </TabsContent>

        <TabsContent value="dcf">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field id="fclGrowthPct" label="Crecimiento anual del FCL (%)" defaultValue={a?.fclGrowthPct ?? 5} />
            <Field id="terminalGrowthPct" label="Crecimiento a perpetuidad (g) (%)" defaultValue={a?.terminalGrowthPct ?? 3} />
            <Field id="projectionYears" label="Años de proyección" defaultValue={a?.projectionYears ?? 5} step="1" />
          </div>
        </TabsContent>

        <TabsContent value="multiplos">
          <p className="mb-3 text-xs text-slate-500">Solo se usan los múltiplos que cargues — nunca se inventa un comparable (spec §13).</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field id="evEbitdaMultiple" label="EV / EBITDA" defaultValue={a?.evEbitdaMultiple} required={false} />
            <Field id="evSalesMultiple" label="EV / Ventas" defaultValue={a?.evSalesMultiple} required={false} />
            <Field id="peMultiple" label="P / E" defaultValue={a?.peMultiple} required={false} />
          </div>
        </TabsContent>

        <TabsContent value="berkus">
          <p className="mb-3 text-xs text-slate-500">Cada factor se limita al tope que definas (spec §21.8).</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field id="berkusFactorCap" label="Tope por factor" defaultValue={a?.berkusFactorCap ?? 500000} step="1000" />
            <Field id="berkusIdea" label="Idea" defaultValue={a?.berkusIdea ?? 0} step="1000" />
            <Field id="berkusPrototype" label="Prototipo" defaultValue={a?.berkusPrototype ?? 0} step="1000" />
            <Field id="berkusTeam" label="Equipo" defaultValue={a?.berkusTeam ?? 0} step="1000" />
            <Field id="berkusRelationships" label="Relaciones estratégicas" defaultValue={a?.berkusRelationships ?? 0} step="1000" />
            <Field id="berkusInitialSales" label="Ventas iniciales" defaultValue={a?.berkusInitialSales ?? 0} step="1000" />
          </div>
        </TabsContent>

        <TabsContent value="scorecard">
          <p className="mb-3 text-xs text-slate-500">100% = igual al promedio de comparables de tu sector/etapa; más alto es mejor.</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field id="scorecardComparableAvg" label="Valoración promedio comparables" defaultValue={a?.scorecardComparableAvg} step="1000" />
            <Field id="scorecardManagementScorePct" label="Equipo de gestión (%)" defaultValue={a?.scorecardManagementScorePct ?? 100} />
            <Field id="scorecardOpportunityScorePct" label="Tamaño de oportunidad (%)" defaultValue={a?.scorecardOpportunityScorePct ?? 100} />
            <Field id="scorecardProductScorePct" label="Producto / Tecnología (%)" defaultValue={a?.scorecardProductScorePct ?? 100} />
            <Field id="scorecardCompetitionScorePct" label="Entorno competitivo (%)" defaultValue={a?.scorecardCompetitionScorePct ?? 100} />
            <Field id="scorecardMarketingScorePct" label="Marketing / Canales (%)" defaultValue={a?.scorecardMarketingScorePct ?? 100} />
            <Field id="scorecardNeedInvestmentScorePct" label="Necesidad de inversión (%)" defaultValue={a?.scorecardNeedInvestmentScorePct ?? 100} />
          </div>
        </TabsContent>

        <TabsContent value="vc">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field id="vcExitValueProjected" label="Valor de salida proyectado" defaultValue={a?.vcExitValueProjected} step="1000" />
            <Field id="vcRequiredReturnMultiple" label="Múltiplo de retorno exigido" defaultValue={a?.vcRequiredReturnMultiple ?? 10} required />
            <Field id="vcInvestmentAmount" label="Monto a invertir" defaultValue={a?.vcInvestmentAmount} step="1000" />
          </div>
        </TabsContent>
      </Tabs>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-700">Supuestos actualizados.</p>}
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar supuestos"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { generateRiskAndScenarioReport, type RiskAndScenarioResult } from "@/lib/actions/risk-scenario-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RiskMatrixTable } from "@/components/sensibilidad/risk-matrix-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/utils";

const SCENARIO_LABELS = { pesimista: "Pesimista", base: "Base", optimista: "Optimista" } as const;
const CONFIDENCE_LABELS = { real: "Dato real", proyectado: "Proyectado", supuesto: "Supuesto", mixto: "Mixto" } as const;

export function RiskAndScenarioPanel({ currency }: { currency: string }) {
  const [result, setResult] = useState<RiskAndScenarioResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      const res = await generateRiskAndScenarioReport();
      setResult(res);
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">Riesgos y Escenarios (análisis IA)</CardTitle>
            <CardDescription>Narrativa por escenario y matriz de riesgos (spec §17) — el motor financiero calcula, la IA solo redacta.</CardDescription>
          </div>
          <Button onClick={handleGenerate} disabled={isPending} size="sm">
            <Sparkles className="h-4 w-4" />
            {isPending ? "Generando..." : result ? "Regenerar" : "Generar análisis"}
          </Button>
        </div>
      </CardHeader>
      {result && (
        <CardContent className="flex flex-col gap-6">
          {result.error && <p className="text-sm text-amber-700">{result.error}</p>}

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Matriz de riesgos</p>
            <RiskMatrixTable risks={result.risks} />
          </div>

          {result.report && (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium text-slate-700">Análisis narrativo por escenario</p>
              {result.report.scenarios.map((s) => (
                <div key={s.scenario_type} className="rounded-lg border border-slate-200 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant={s.scenario_type === "pesimista" ? "danger" : s.scenario_type === "optimista" ? "default" : "secondary"}>
                      {SCENARIO_LABELS[s.scenario_type]}
                    </Badge>
                    <Badge variant="outline">{CONFIDENCE_LABELS[s.data_confidence]}</Badge>
                  </div>
                  <div className="mb-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
                    <span>Ingresos: {formatCurrency(s.results.ingresos, currency)}</span>
                    <span>Utilidad Neta: {formatCurrency(s.results.utilidad_neta, currency)}</span>
                    <span>ROI: {formatPercent(s.results.roi_pct)}</span>
                  </div>
                  {s.narrative ? (
                    <div className="flex flex-col gap-2 text-sm text-slate-700">
                      <p>{s.narrative.summary}</p>
                      <p className="text-slate-600">{s.narrative.extended}</p>
                      <p>
                        <span className="font-medium text-slate-900">Acción recomendada: </span>
                        {s.narrative.recommended_action}
                      </p>
                      <p className="text-xs text-slate-500">
                        <span className="font-medium">Señal de alerta: </span>
                        {s.narrative.trigger_condition}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Sin narrativa disponible{s.missing_data ? `: ${s.missing_data.join(", ")}` : "."}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ReportType } from "@/lib/reports/pdf-report";

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  { value: "ejecutivo", label: "Reporte Ejecutivo", description: "Resumen de KPIs y escenarios — 1 página." },
  {
    value: "financiero",
    label: "Reporte Financiero / Rentabilidad",
    description: "KPIs, estado de resultados completo, productos, costos e inversión.",
  },
];

const DISABLED_SECTIONS = ["Matriz de riesgos", "Análisis de sensibilidad", "Exposición cambiaria"];

export function ReportControls() {
  const [reportType, setReportType] = useState<ReportType>("ejecutivo");
  const [includeScenarios, setIncludeScenarios] = useState(true);

  const query = `type=${reportType}&scenarios=${includeScenarios ? "1" : "0"}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label className="text-xs text-slate-500">Tipo de reporte</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {REPORT_TYPES.map((rt) => (
            <button
              key={rt.value}
              type="button"
              onClick={() => setReportType(rt.value)}
              className={cn(
                "rounded-lg border p-3 text-left text-sm transition-colors",
                reportType === rt.value ? "border-emerald-600 bg-emerald-50" : "border-slate-200 hover:bg-slate-50"
              )}
            >
              <p className="font-medium text-slate-900">{rt.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{rt.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs text-slate-500">Incluir en el reporte</Label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={includeScenarios} onChange={(e) => setIncludeScenarios(e.target.checked)} />
          Escenarios (Pesimista / Base / Optimista)
        </label>
        {DISABLED_SECTIONS.map((s) => (
          <label key={s} className="flex items-center gap-2 text-sm text-slate-400">
            <input type="checkbox" disabled />
            {s} <span className="text-xs">(Pronto)</span>
          </label>
        ))}
      </div>

      <div className="flex gap-3">
        <Button asChild>
          <a href={`/api/reports/pdf?${query}`}>
            <Download className="h-4 w-4" />
            Descargar PDF
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={`/api/reports/excel?${query}`}>
            <Download className="h-4 w-4" />
            Descargar Excel
          </a>
        </Button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { MethodologyTopicId } from "@/lib/methodology";
import { cn } from "@/lib/utils";

export type KpiStatus = "verde" | "amarillo" | "rojo" | "neutral";

const STATUS_DOT: Record<KpiStatus, string> = {
  verde: "bg-emerald-500",
  amarillo: "bg-amber-500",
  rojo: "bg-red-500",
  neutral: "bg-slate-300",
};

export interface KpiExplanation {
  meaning: string;
  why: string;
  howCalculated: string;
  isGoodOrBad: string;
  whatToDo: string;
}

/**
 * Card de KPI con semáforo y modal explicativo — spec §2/§22/§24:
 * "¿Qué significa? / ¿Por qué importa? / ¿Cómo se calcula? / ¿Está bien o
 * mal? / ¿Qué puedo hacer?". En el MVP el texto es estático (sin IA);
 * cuando se conecte la capa de IA (v1.1) este mismo modal puede recibir
 * narrativa generada, siempre citando la fórmula del engine.
 */
export function KpiCard({
  label,
  value,
  status = "neutral",
  helperText,
  explanation,
  methodologyTopic,
}: {
  label: string;
  value: string;
  status?: KpiStatus;
  helperText?: string;
  explanation: KpiExplanation;
  /** Tema de /metodologia al que enlaza este KPI (spec §22: "todo resultado numérico enlaza a esta sección"). Sin este dato, enlaza a la página general. */
  methodologyTopic?: MethodologyTopicId;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <div className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[status])} />
            <Dialog>
              <DialogTrigger asChild>
                <button type="button" className="text-slate-300 hover:text-slate-500" aria-label={`¿Cómo se calcula ${label}?`}>
                  <Info className="h-4 w-4" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{label}</DialogTitle>
                </DialogHeader>
                <dl className="flex flex-col gap-4 text-sm">
                  <div>
                    <dt className="font-medium text-slate-900">¿Qué significa?</dt>
                    <dd className="text-slate-600">{explanation.meaning}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-900">¿Por qué importa?</dt>
                    <dd className="text-slate-600">{explanation.why}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-900">¿Cómo se calcula?</dt>
                    <dd className="text-slate-600">{explanation.howCalculated}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-900">¿Está bien o mal?</dt>
                    <dd className="text-slate-600">{explanation.isGoodOrBad}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-900">¿Qué puedo hacer?</dt>
                    <dd className="text-slate-600">{explanation.whatToDo}</dd>
                  </div>
                </dl>
                <Link
                  href={methodologyTopic ? `/metodologia#${methodologyTopic}` : "/metodologia"}
                  className="mt-4 inline-block text-xs font-medium text-emerald-700 hover:underline"
                >
                  Ver metodología completa →
                </Link>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        {helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
      </CardContent>
    </Card>
  );
}

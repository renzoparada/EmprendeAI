"use client";

import { Info } from "lucide-react";
import type { ValuationMethod, ValuationMethodDetail } from "@/lib/engine/valuation";
import { VALUATION_METHOD_LABELS } from "@/lib/engine/valuation";
import { METHODOLOGY_TEXT } from "@/components/valoracion/methodology-content";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

export function MethodResultCard({ method, detail, currency }: { method: ValuationMethod; detail: ValuationMethodDetail | undefined; currency: string }) {
  const value = detail?.value ?? null;

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-slate-500">{VALUATION_METHOD_LABELS[method]}</p>
          <Dialog>
            <DialogTrigger asChild>
              <button type="button" className="text-slate-300 hover:text-slate-500" aria-label={`Ver metodología: ${VALUATION_METHOD_LABELS[method]}`}>
                <Info className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{VALUATION_METHOD_LABELS[method]}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-slate-600">{METHODOLOGY_TEXT[method]}</p>
            </DialogContent>
          </Dialog>
        </div>
        {value != null ? (
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(value, currency)}</p>
        ) : (
          <p className="mt-2 text-sm text-slate-400">{detail?.unavailableReason ?? "Sin datos suficientes"}</p>
        )}
      </CardContent>
    </Card>
  );
}

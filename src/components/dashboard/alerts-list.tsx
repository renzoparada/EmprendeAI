"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Info, Sparkles } from "lucide-react";
import type { Alert } from "@/lib/engine/alerts";
import { explainAlert, type AlertExplanationResult } from "@/lib/actions/alert-actions";
import { Button } from "@/components/ui/button";

const SEVERITY_STYLES = {
  danger: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-slate-200 bg-slate-50 text-slate-700",
} as const;

function AlertIcon({ severity }: { severity: Alert["severity"] }) {
  if (severity === "info") return <Info className="mt-0.5 h-4 w-4 shrink-0" />;
  return <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />;
}

function AlertCard({ alert }: { alert: Alert }) {
  const [result, setResult] = useState<AlertExplanationResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleExplain = () => {
    startTransition(async () => {
      const res = await explainAlert(alert.message, alert.recommendation);
      setResult(res);
    });
  };

  return (
    <div className={`flex flex-col gap-2 rounded-lg border px-4 py-3 text-sm ${SEVERITY_STYLES[alert.severity]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <AlertIcon severity={alert.severity} />
          <div>
            <p>{alert.message}</p>
            <p className="mt-0.5 text-xs opacity-80">{alert.recommendation}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleExplain} disabled={isPending} className="shrink-0 text-xs">
          <Sparkles className="h-3.5 w-3.5" />
          {isPending ? "..." : "Explicar con IA"}
        </Button>
      </div>
      {result && (
        <div className="rounded-md border border-current/20 bg-white/60 px-3 py-2 text-xs">
          {result.error && <p className="text-amber-700">{result.error}</p>}
          {result.explanation && (
            <>
              <p>{result.explanation.explanation}</p>
              <p className="mt-1 font-medium">{result.explanation.recommendation}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function AlertsList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { generateActionPlanForGoal, type GoalActionPlanResult } from "@/lib/actions/goal-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function GoalActionPlan() {
  const [result, setResult] = useState<GoalActionPlanResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      const res = await generateActionPlanForGoal();
      setResult(res);
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">Plan de acción (IA)</CardTitle>
            <CardDescription>Redactado a partir del plan ya calculado — nunca inventa una cifra nueva (spec §11).</CardDescription>
          </div>
          <Button onClick={handleGenerate} disabled={isPending} size="sm">
            <Sparkles className="h-4 w-4" />
            {isPending ? "Generando..." : result?.actionPlan ? "Regenerar" : "Generar plan de acción"}
          </Button>
        </div>
      </CardHeader>
      {result && (
        <CardContent className="flex flex-col gap-3">
          {result.error && <p className="text-sm text-amber-700">{result.error}</p>}
          {result.actionPlan && (
            <>
              <p className="text-sm text-slate-700">{result.actionPlan.summary}</p>
              <ul className="flex flex-col gap-2">
                {result.actionPlan.actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {action}
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

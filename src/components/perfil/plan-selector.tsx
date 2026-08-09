"use client";

import { useActionState } from "react";
import { Check, Lock } from "lucide-react";
import type { PlanCode } from "@prisma/client";
import { updateUserPlan } from "@/lib/actions/profile-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/plans";

const initialState: ActionState = {};

export function PlanSelector({ currentPlan }: { currentPlan: PlanCode }) {
  const [state, formAction, isPending] = useActionState(updateUserPlan, initialState);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Object.values(PLANS).map((plan) => {
          const isCurrent = plan.code === currentPlan;
          return (
            <Card key={plan.code} className={cn(isCurrent && "border-emerald-500 ring-1 ring-emerald-500")}>
              <CardContent className="flex flex-col gap-2 pt-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{plan.name}</p>
                  {!plan.available && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                </div>
                <p className="text-xs text-slate-500">{plan.description}</p>
                <ul className="mt-1 flex flex-col gap-1 text-xs text-slate-600">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-emerald-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.available ? (
                  isCurrent ? (
                    <Button size="sm" variant="secondary" disabled className="mt-2">
                      Plan actual
                    </Button>
                  ) : (
                    <form action={formAction} className="mt-2">
                      <input type="hidden" name="planCode" value={plan.code} />
                      <Button size="sm" variant="outline" type="submit" disabled={isPending} className="w-full">
                        Cambiar a {plan.name}
                      </Button>
                    </form>
                  )
                ) : (
                  <Button size="sm" variant="outline" disabled className="mt-2 w-full">
                    Próximamente
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  );
}

import type { FinancingPlan } from "@prisma/client";
import { buildAmortizationSchedule, summarizeLoan } from "@/lib/engine/financing";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FinancingFormDialog } from "@/components/financiamiento/financing-form-dialog";
import { AmortizationDialog } from "@/components/financiamiento/amortization-dialog";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteFinancingPlan } from "@/lib/actions/financing-actions";
import { formatCurrency } from "@/lib/utils";
import { FINANCING_TYPE_LABELS, GRACE_TYPE_LABELS } from "@/lib/constants";
import { Pencil } from "lucide-react";

export function FinancingPlansTable({ plans, currency }: { plans: FinancingPlan[]; currency: string }) {
  if (plans.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
        No registraste ninguna fuente de financiamiento todavía.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Fuente</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead className="text-right">Tasa anual</TableHead>
          <TableHead className="text-right">Plazo</TableHead>
          <TableHead>Gracia</TableHead>
          <TableHead className="text-right">Cuota mensual</TableHead>
          <TableHead className="text-right">Costo financiero</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.map((plan) => {
          const schedule = buildAmortizationSchedule({
            principal: plan.principal,
            annualInterestRatePct: plan.annualInterestRatePct,
            termMonths: plan.termMonths,
            gracePeriodMonths: plan.gracePeriodMonths,
            graceType: plan.graceType,
          });
          const summary = summarizeLoan(schedule);

          return (
            <TableRow key={plan.id}>
              <TableCell className="font-medium text-slate-900">{plan.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">{FINANCING_TYPE_LABELS[plan.type]}</Badge>
              </TableCell>
              <TableCell className="text-right">{formatCurrency(plan.principal, currency)}</TableCell>
              <TableCell className="text-right">{plan.annualInterestRatePct.toFixed(1)}%</TableCell>
              <TableCell className="text-right">{plan.termMonths} meses</TableCell>
              <TableCell className="text-xs text-slate-500">
                {plan.graceType === "NINGUNA" ? "—" : `${GRACE_TYPE_LABELS[plan.graceType]} (${plan.gracePeriodMonths}m)`}
              </TableCell>
              <TableCell className="text-right">{formatCurrency(summary.cuotaMensual, currency)}</TableCell>
              <TableCell className="text-right">{formatCurrency(summary.costoFinancieroTotal, currency)}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <AmortizationDialog plan={plan} currency={currency} />
                  <FinancingFormDialog
                    plan={plan}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DeleteButton id={plan.id} action={deleteFinancingPlan} confirmMessage="¿Eliminar este financiamiento?" />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

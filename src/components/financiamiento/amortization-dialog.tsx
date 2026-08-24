"use client";

import { useMemo, useState } from "react";
import { Table2 } from "lucide-react";
import type { FinancingPlan } from "@prisma/client";
import { buildAmortizationSchedule } from "@/lib/engine/financing";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

export function AmortizationDialog({ plan, currency }: { plan: FinancingPlan; currency: string }) {
  const [open, setOpen] = useState(false);

  const schedule = useMemo(
    () =>
      buildAmortizationSchedule({
        principal: plan.principal,
        annualInterestRatePct: plan.annualInterestRatePct,
        termMonths: plan.termMonths,
        gracePeriodMonths: plan.gracePeriodMonths,
        graceType: plan.graceType,
      }),
    [plan.principal, plan.annualInterestRatePct, plan.termMonths, plan.gracePeriodMonths, plan.graceType]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700" title="Ver tabla de amortización">
          <Table2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tabla de amortización — {plan.name}</DialogTitle>
          <DialogDescription>Mes a mes, calculada por el Financing Engine (spec §14) — nunca por IA.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mes</TableHead>
                <TableHead className="text-right">Saldo inicial</TableHead>
                <TableHead className="text-right">Interés</TableHead>
                <TableHead className="text-right">Capital</TableHead>
                <TableHead className="text-right">Cuota</TableHead>
                <TableHead className="text-right">Saldo final</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.map((row) => (
                <TableRow key={row.month}>
                  <TableCell>{row.month}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.saldoInicial, currency)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.interes, currency)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.capital, currency)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.cuota, currency)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.saldoFinal, currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

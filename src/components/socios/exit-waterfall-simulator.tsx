"use client";

import { useMemo, useState } from "react";
import { computeExitWaterfall, type WaterfallCommonEntry, type WaterfallPreferredEntry } from "@/lib/engine/captable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

export function ExitWaterfallSimulator({
  preferred,
  common,
  currency,
}: {
  preferred: WaterfallPreferredEntry[];
  common: WaterfallCommonEntry[];
  currency: string;
}) {
  const [exitPrice, setExitPrice] = useState(2000000);
  const [debtOutstanding, setDebtOutstanding] = useState(0);

  const result = useMemo(() => computeExitWaterfall(exitPrice, debtOutstanding, preferred, common), [exitPrice, debtOutstanding, preferred, common]);

  const hasEntries = preferred.length > 0 || common.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-900">Simulador de Salida (Exit / Waterfall)</CardTitle>
        <CardDescription>Reparto por socio según orden de prelación: deuda → preferencia de liquidación → remanente pro-rata (spec §16.4).</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {!hasEntries ? (
          <p className="text-sm text-slate-500">Registra socios con participaciones para simular una salida.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Precio de venta hipotético</Label>
                <Input type="number" step="1000" min={0} value={exitPrice} onChange={(e) => setExitPrice(Number(e.target.value))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Deuda pendiente</Label>
                <Input type="number" step="1000" min={0} value={debtOutstanding} onChange={(e) => setDebtOutstanding(Number(e.target.value))} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">1. Pago de deuda</p>
                <p className="text-lg font-semibold text-slate-900">{formatCurrency(result.debtPayment, currency)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">2. Preferencia de liquidación</p>
                <p className="text-lg font-semibold text-slate-900">{formatCurrency(result.preferredDistribution.reduce((s, d) => s + d.amount, 0), currency)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">3. Remanente a comunes</p>
                <p className="text-lg font-semibold text-emerald-700">{formatCurrency(result.commonDistribution.reduce((s, d) => s + d.amount, 0), currency)}</p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Socio</TableHead>
                  <TableHead>Clase</TableHead>
                  <TableHead className="text-right">Monto recibido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.preferredDistribution.map((d) => (
                  <TableRow key={d.shareholderId}>
                    <TableCell className="font-medium text-slate-900">{d.shareholderName}</TableCell>
                    <TableCell>Preferente</TableCell>
                    <TableCell className="text-right">{formatCurrency(d.amount, currency)}</TableCell>
                  </TableRow>
                ))}
                {result.commonDistribution.map((d) => (
                  <TableRow key={d.shareholderId}>
                    <TableCell className="font-medium text-slate-900">{d.shareholderName}</TableCell>
                    <TableCell>Común</TableCell>
                    <TableCell className="text-right">{formatCurrency(d.amount, currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}

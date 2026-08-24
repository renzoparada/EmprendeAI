"use client";

import { useActionState, useMemo, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { simulateFundingRound, type CapTableHolding } from "@/lib/engine/captable";
import { confirmFundingRound } from "@/lib/actions/captable-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatPercent } from "@/lib/utils";

const COLORS = ["#10b981", "#0f172a", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

const initialState: ActionState = {};

export function RoundSimulator({ currentHoldings, currency }: { currentHoldings: CapTableHolding[]; currency: string }) {
  const [preMoneyValuation, setPreMoneyValuation] = useState(1000000);
  const [investmentAmount, setInvestmentAmount] = useState(200000);
  const [newInvestorName, setNewInvestorName] = useState("Nuevo inversionista");
  const [roundName, setRoundName] = useState("Ronda Semilla");
  const [confirmState, confirmAction, isConfirming] = useActionState(confirmFundingRound, initialState);

  const simulation = useMemo(
    () => (currentHoldings.length > 0 ? simulateFundingRound({ currentHoldings, preMoneyValuation, investmentAmount, newInvestorName }) : null),
    [currentHoldings, preMoneyValuation, investmentAmount, newInvestorName]
  );

  const beforeData = simulation?.holdings.filter((h) => !h.isNewInvestor).map((h) => ({ name: h.shareholderName, value: h.sharesBefore })) ?? [];
  const afterData = simulation?.holdings.map((h) => ({ name: h.shareholderName, value: h.sharesAfter })) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-900">Simulador de Ronda de Inversión</CardTitle>
        <CardDescription>Monto a levantar + valoración pre-money → post-money, % a ceder y dilución (spec §16.3).</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {currentHoldings.length === 0 ? (
          <p className="text-sm text-slate-500">Registra al menos un socio con participaciones para simular una ronda.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Valoración pre-money</Label>
                <Input type="number" step="1000" min={0} value={preMoneyValuation} onChange={(e) => setPreMoneyValuation(Number(e.target.value))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Monto a invertir</Label>
                <Input type="number" step="1000" min={0} value={investmentAmount} onChange={(e) => setInvestmentAmount(Number(e.target.value))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Nombre del inversionista</Label>
                <Input value={newInvestorName} onChange={(e) => setNewInvestorName(e.target.value)} />
              </div>
            </div>

            {simulation && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-500">Precio por acción</p>
                    <p className="text-lg font-semibold text-slate-900">{formatCurrency(simulation.pricePerShare, currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Acciones nuevas emitidas</p>
                    <p className="text-lg font-semibold text-slate-900">{simulation.newSharesIssued.toLocaleString(undefined, { maximumFractionDigits: 1 })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Valoración post-money</p>
                    <p className="text-lg font-semibold text-emerald-700">{formatCurrency(simulation.postMoneyValuation, currency)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-center text-xs font-medium text-slate-600">Antes</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={beforeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(e) => `${e.name}`}>
                          {beforeData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <p className="mb-1 text-center text-xs font-medium text-slate-600">Después</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={afterData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(e) => `${e.name}`}>
                          {afterData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Socio</TableHead>
                      <TableHead className="text-right">% Antes</TableHead>
                      <TableHead className="text-right">% Después</TableHead>
                      <TableHead className="text-right">Dilución</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {simulation.holdings.map((h) => (
                      <TableRow key={h.shareholderId}>
                        <TableCell className={h.isNewInvestor ? "font-medium text-emerald-700" : "font-medium text-slate-900"}>{h.shareholderName}</TableCell>
                        <TableCell className="text-right">{formatPercent(h.pctBefore)}</TableCell>
                        <TableCell className="text-right">{formatPercent(h.pctAfter)}</TableCell>
                        <TableCell className="text-right">{h.dilutionPct > 0 ? `-${formatPercent(h.dilutionPct)}` : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <form action={confirmAction} className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
                  <input type="hidden" name="preMoneyValuation" value={preMoneyValuation} />
                  <input type="hidden" name="investmentAmount" value={investmentAmount} />
                  <input type="hidden" name="newInvestorName" value={newInvestorName} />
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Nombre de la ronda</Label>
                    <Input name="name" value={roundName} onChange={(e) => setRoundName(e.target.value)} className="h-9 w-48" />
                  </div>
                  <Button type="submit" variant="outline" size="sm" disabled={isConfirming}>
                    {isConfirming ? "Confirmando..." : "Confirmar ronda en el Cap Table"}
                  </Button>
                  {confirmState.error && <p className="text-xs text-red-600">{confirmState.error}</p>}
                  {confirmState.success && <p className="text-xs text-emerald-700">Ronda registrada.</p>}
                </form>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

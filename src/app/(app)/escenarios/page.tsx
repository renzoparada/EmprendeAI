import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScenarioEditorForm } from "@/components/escenarios/scenario-editor-form";
import { buildCompanySnapshot, computeRoi, totalInvestment } from "@/lib/engine/financial";
import { applyScenario, DEFAULT_SCENARIO_DELTAS, type ScenarioType } from "@/lib/engine/scenarios";
import { toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { SCENARIO_TYPE_LABELS } from "@/lib/constants";

const SCENARIO_ORDER: ScenarioType[] = ["PESIMISTA", "BASE", "OPTIMISTA"];

const SCENARIO_BADGE: Record<ScenarioType, "danger" | "secondary" | "default"> = {
  PESIMISTA: "danger",
  BASE: "secondary",
  OPTIMISTA: "default",
};

export default async function EscenariosPage() {
  const { company } = await requireCompany();

  const [products, fixedCosts, variableCosts, investments, storedScenarios] = await Promise.all([
    prisma.product.findMany({ where: { companyId: company.id } }),
    prisma.fixedCost.findMany({ where: { companyId: company.id } }),
    prisma.variableCost.findMany({ where: { companyId: company.id } }),
    prisma.investment.findMany({ where: { companyId: company.id } }),
    prisma.scenario.findMany({ where: { companyId: company.id } }),
  ]);

  const engineProducts = toEngineProducts(products);
  const engineFixedCosts = toEngineFixedCosts(fixedCosts);
  const engineVariableCosts = toEngineVariableCosts(variableCosts);
  const inversionTotal = totalInvestment(investments.map((i) => i.amount));

  const results = SCENARIO_ORDER.map((type) => {
    const stored = storedScenarios.find((s) => s.type === type);
    const deltas = stored
      ? { type, salesDeltaPct: stored.salesDeltaPct, priceDeltaPct: stored.priceDeltaPct, costDeltaPct: stored.costDeltaPct }
      : { type, ...DEFAULT_SCENARIO_DELTAS[type] };
    const adjusted = applyScenario({ products: engineProducts, fixedCosts: engineFixedCosts, variableCosts: engineVariableCosts }, deltas);
    const snapshot = buildCompanySnapshot(adjusted.products, adjusted.variableCosts, adjusted.fixedCosts, company.taxRatePct);
    const roi = computeRoi(snapshot.statement.utilidadNeta, inversionTotal);
    return { type, deltas, snapshot, roi };
  });

  const baseResult = results.find((r) => r.type === "BASE")!;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Escenarios</h1>
        <p className="text-sm text-slate-500">
          Pesimista / Base / Optimista — editables, calculados en vivo con el mismo Financial Engine (spec §9).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {results.map(({ type, deltas, snapshot, roi }) => (
          <Card key={type}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-900">{SCENARIO_TYPE_LABELS[type]}</CardTitle>
                <Badge variant={SCENARIO_BADGE[type]}>{SCENARIO_TYPE_LABELS[type]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ScenarioEditorForm type={type} salesDeltaPct={deltas.salesDeltaPct} priceDeltaPct={deltas.priceDeltaPct} costDeltaPct={deltas.costDeltaPct} />
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500">Ventas</p>
                <p className="text-lg font-semibold text-slate-900">{formatCurrency(snapshot.statement.ventas, company.currency)}</p>
                <p className="mt-2 text-xs text-slate-500">Utilidad Neta</p>
                <p className={`text-lg font-semibold ${snapshot.statement.utilidadNeta >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {formatCurrency(snapshot.statement.utilidadNeta, company.currency)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {type !== "BASE" &&
                    baseResult.snapshot.statement.utilidadNeta !== 0 &&
                    `${(((snapshot.statement.utilidadNeta - baseResult.snapshot.statement.utilidadNeta) / Math.abs(baseResult.snapshot.statement.utilidadNeta)) * 100).toFixed(1)}% vs. Base`}
                </p>
                <p className="mt-2 text-xs text-slate-500">ROI</p>
                <p className="text-sm font-medium text-slate-900">{formatPercent(roi)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Tabla comparativa</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Métrica</TableHead>
                {results.map(({ type }) => (
                  <TableHead key={type} className="text-right">
                    {SCENARIO_TYPE_LABELS[type]}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Ingresos</TableCell>
                {results.map(({ type, snapshot }) => (
                  <TableCell key={type} className="text-right">
                    {formatCurrency(snapshot.statement.ventas, company.currency)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Costos totales</TableCell>
                {results.map(({ type, snapshot }) => (
                  <TableCell key={type} className="text-right">
                    {formatCurrency(snapshot.statement.costoVentas + snapshot.statement.gastosOperativos, company.currency)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Utilidad Neta</TableCell>
                {results.map(({ type, snapshot }) => (
                  <TableCell key={type} className="text-right">
                    {formatCurrency(snapshot.statement.utilidadNeta, company.currency)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Margen Neto</TableCell>
                {results.map(({ type, snapshot }) => (
                  <TableCell key={type} className="text-right">
                    {formatPercent(snapshot.statement.margenNetoPct)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">ROI</TableCell>
                {results.map(({ type, roi }) => (
                  <TableCell key={type} className="text-right">
                    {formatPercent(roi)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Flujo de Caja (mes)</TableCell>
                {results.map(({ type, snapshot }) => (
                  <TableCell key={type} className={`text-right ${snapshot.cashFlow.flujoNeto < 0 ? "text-red-600" : ""}`}>
                    {formatCurrency(snapshot.cashFlow.flujoNeto, company.currency)}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

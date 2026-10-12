import { requireCompany } from "@/lib/actions/guard";
import { prisma } from "@/lib/db";
import { buildCompanySnapshot } from "@/lib/engine/financial";
import { ensureCurrentMonthSnapshot } from "@/lib/actions/snapshot-actions";
import {
  buildTemporalSeries,
  computePeriodChange,
  findPreviousMonth,
  findSameMonthLastYear,
  sortSnapshots,
  type SnapshotLike,
} from "@/lib/engine/temporal-benchmark";
import { toEngineFixedCosts, toEngineProducts, toEngineVariableCosts } from "@/lib/mappers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TemporalChart } from "@/components/historico/temporal-chart";
import { PeriodDeltaBadge } from "@/components/historico/period-delta-badge";
import { CaptureSnapshotButton } from "@/components/historico/capture-snapshot-button";
import { formatCurrency, formatPercent } from "@/lib/utils";

const METRICS: { key: "ventas" | "margenNetoPct" | "ebitda" | "utilidadNeta" | "flujoNeto"; label: string; kind: "currency" | "percent" }[] = [
  { key: "ventas", label: "Ventas", kind: "currency" },
  { key: "margenNetoPct", label: "Margen Neto", kind: "percent" },
  { key: "ebitda", label: "EBITDA", kind: "currency" },
  { key: "utilidadNeta", label: "Utilidad Neta", kind: "currency" },
  { key: "flujoNeto", label: "Flujo de Caja", kind: "currency" },
];

export default async function HistoricoPage() {
  const { company } = await requireCompany();

  const [products, fixedCosts, variableCosts] = await Promise.all([
    prisma.product.findMany({ where: { companyId: company.id } }),
    prisma.fixedCost.findMany({ where: { companyId: company.id } }),
    prisma.variableCost.findMany({ where: { companyId: company.id } }),
  ]);

  const hasData = products.length > 0;
  if (hasData) {
    const snapshot = buildCompanySnapshot(toEngineProducts(products), toEngineVariableCosts(variableCosts), toEngineFixedCosts(fixedCosts), company.taxRatePct);
    await ensureCurrentMonthSnapshot(company.id, hasData, snapshot);
  }

  const rows = await prisma.monthlySnapshot.findMany({ where: { companyId: company.id } });
  const snapshots: SnapshotLike[] = sortSnapshots(
    rows.map((r) => ({
      periodYear: r.periodYear,
      periodMonth: r.periodMonth,
      ventas: r.ventas,
      costoVentas: r.costoVentas,
      utilidadBruta: r.utilidadBruta,
      gastosOperativos: r.gastosOperativos,
      ebitda: r.ebitda,
      utilidadNeta: r.utilidadNeta,
      margenNetoPct: r.margenNetoPct,
      flujoNeto: r.flujoNeto,
      breakEvenAmount: r.breakEvenAmount,
    }))
  );

  const latest = snapshots[snapshots.length - 1] ?? null;
  const previousMonth = latest ? findPreviousMonth(snapshots, latest.periodYear, latest.periodMonth) : null;
  const sameMonthLastYear = latest ? findSameMonthLastYear(snapshots, latest.periodYear, latest.periodMonth) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Histórico</h1>
          <p className="text-sm text-slate-500">
            Tu negocio comparado contra sí mismo en el tiempo — foto mensual real, nunca estimada (spec §20/§13).
          </p>
        </div>
        {hasData && <CaptureSnapshotButton />}
      </div>

      {!hasData && (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Carga productos/servicios en Mi Negocio para empezar a capturar snapshots mensuales.
        </p>
      )}

      {hasData && snapshots.length < 2 && (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Tenés {snapshots.length} {snapshots.length === 1 ? "mes capturado" : "meses capturados"}. Necesitás al menos 2 meses de historia
          para ver una comparación — la próxima foto se toma sola la primera vez que abras el Dashboard o esta página el mes que viene.
        </p>
      )}

      {hasData && snapshots.length >= 1 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {METRICS.map((metric) => {
            const points = buildTemporalSeries(snapshots, metric.key);
            const currentValue = latest ? latest[metric.key] : null;
            const vsPrevious = latest && previousMonth ? computePeriodChange(latest[metric.key], previousMonth[metric.key]) : null;
            const vsLastYear = latest && sameMonthLastYear ? computePeriodChange(latest[metric.key], sameMonthLastYear[metric.key]) : null;
            const formattedValue = currentValue == null ? "—" : metric.kind === "percent" ? formatPercent(currentValue) : formatCurrency(currentValue, company.currency);

            return (
              <Card key={metric.key}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-slate-900">{metric.label}</CardTitle>
                    <p className="text-lg font-semibold text-slate-900">{formattedValue}</p>
                  </div>
                  <CardDescription className="flex flex-wrap gap-1.5 pt-1">
                    <PeriodDeltaBadge change={vsPrevious} label="vs. mes anterior" />
                    <PeriodDeltaBadge change={vsLastYear} label="vs. año anterior" />
                    {!vsPrevious && !vsLastYear && <span className="text-xs text-slate-400">Todavía sin punto de comparación</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TemporalChart points={points} currency={company.currency} kind={metric.kind} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

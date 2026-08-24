import { requireCompany } from "@/lib/actions/guard";
import { buildReportData } from "@/lib/reports/build-report-data";
import { SOLIDITY_LABELS } from "@/lib/reports/labels";
import { ReportControls } from "@/components/reportes/report-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default async function ReportesPage() {
  const { company } = await requireCompany();
  const data = await buildReportData(company.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Reportes</h1>
        <p className="text-sm text-slate-500">Exporta un reporte en PDF o Excel con los datos calculados por el Financial Engine (spec §23.7).</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Vista previa</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-sm font-medium text-slate-700">Semáforo de solidez del reporte</span>
              <span className="text-sm font-semibold text-slate-900">{SOLIDITY_LABELS[data.solidity]}</span>
            </div>

            {!data.hasData ? (
              <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                Carga productos y costos en la plataforma para que el reporte tenga cifras reales.
              </p>
            ) : (
              <>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium text-slate-600">Ventas (mes)</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(data.statement!.ventas, company.currency)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-slate-600">Utilidad Neta</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(data.statement!.utilidadNeta, company.currency)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-slate-600">Margen Neto</TableCell>
                      <TableCell className="text-right font-semibold">{formatPercent(data.statement!.margenNetoPct)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-slate-600">Flujo de Caja (mes)</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(data.cashFlow!.flujoNeto, company.currency)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-slate-600">ROI</TableCell>
                      <TableCell className="text-right font-semibold">{formatPercent(data.roiPct)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {data.scenarios.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Escenarios</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Escenario</TableHead>
                          <TableHead className="text-right">Ventas</TableHead>
                          <TableHead className="text-right">Utilidad Neta</TableHead>
                          <TableHead className="text-right">Margen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.scenarios.map((s) => (
                          <TableRow key={s.type}>
                            <TableCell>{s.label}</TableCell>
                            <TableCell className="text-right">{formatCurrency(s.ventas, company.currency)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(s.utilidadNeta, company.currency)}</TableCell>
                            <TableCell className="text-right">{formatPercent(s.margenNetoPct)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Exportar</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportControls />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

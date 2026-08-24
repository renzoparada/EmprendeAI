import type { SimulationMonthResult } from "@/lib/engine/business-simulator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

export function SimulationTable({ results, currency }: { results: SimulationMonthResult[]; currency: string }) {
  return (
    <div className="max-h-[420px] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mes</TableHead>
            <TableHead className="text-right">Ventas</TableHead>
            <TableHead className="text-right">EBITDA</TableHead>
            <TableHead className="text-right">Utilidad Neta</TableHead>
            <TableHead className="text-right">Capex</TableHead>
            <TableHead className="text-right">Servicio Deuda</TableHead>
            <TableHead className="text-right">Flujo Acumulado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((row) => (
            <TableRow key={row.month}>
              <TableCell>{row.month}</TableCell>
              <TableCell className="text-right">{formatCurrency(row.ventas, currency)}</TableCell>
              <TableCell className="text-right">{formatCurrency(row.ebitda, currency)}</TableCell>
              <TableCell className="text-right">{formatCurrency(row.utilidadNeta, currency)}</TableCell>
              <TableCell className="text-right">{row.capex > 0 ? formatCurrency(row.capex, currency) : "—"}</TableCell>
              <TableCell className="text-right">{row.servicioDeuda > 0 ? formatCurrency(row.servicioDeuda, currency) : "—"}</TableCell>
              <TableCell className={`text-right font-medium ${row.flujoAcumulado >= 0 ? "text-slate-900" : "text-red-600"}`}>
                {formatCurrency(row.flujoAcumulado, currency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

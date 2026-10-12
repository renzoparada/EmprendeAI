import type { ExchangeRate } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteExchangeRate } from "@/lib/actions/exchange-rate-actions";

const RATE_TYPE_LABELS = { OFICIAL: "Oficial", PARALELO: "Paralelo", PROYECTADO: "Proyectado" } as const;

export function ExchangeRatesTable({ rates }: { rates: ExchangeRate[] }) {
  if (rates.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        No cargaste tipos de cambio todavía. Necesitas al menos uno para calcular costos de importación.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Origen → Destino</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Tasa</TableHead>
          <TableHead>Vigente desde</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rates.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium text-slate-900">
              {r.fromCurrency} → {r.toCurrency}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{RATE_TYPE_LABELS[r.rateType]}</Badge>
            </TableCell>
            <TableCell className="text-right">{r.rate}</TableCell>
            <TableCell className="text-xs text-slate-500">{new Date(r.effectiveDate).toLocaleDateString()}</TableCell>
            <TableCell>
              <div className="flex justify-end">
                <DeleteButton id={r.id} action={deleteExchangeRate} confirmMessage="¿Eliminar este tipo de cambio?" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

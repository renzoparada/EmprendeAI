import type { HeatmapCell } from "@/lib/engine/sensitivity";
import { formatCurrency } from "@/lib/utils";

function cellColor(value: number, maxAbs: number): string {
  if (maxAbs === 0) return "rgb(241,245,249)";
  const ratio = Math.min(1, Math.abs(value) / maxAbs);
  if (value >= 0) {
    // verde, más intenso cuanto más alto
    const g = Math.round(150 - ratio * 40);
    return `rgb(${Math.round(220 - ratio * 170)}, ${g + 40}, ${Math.round(180 - ratio * 100)})`;
  }
  const r = Math.round(220 - ratio * 30);
  return `rgb(${r}, ${Math.round(200 - ratio * 150)}, ${Math.round(200 - ratio * 150)})`;
}

export function HeatmapGrid({ data, currency }: { data: HeatmapCell[][]; currency: string }) {
  const flat = data.flat();
  const maxAbs = Math.max(1, ...flat.map((c) => Math.abs(c.utilidadNeta)));
  const salesDeltas = data[0]?.map((c) => c.salesDeltaPct) ?? [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="p-1 text-left text-[10px] font-medium text-slate-500">Precio \ Ventas</th>
            {salesDeltas.map((s) => (
              <th key={s} className="p-1 text-center text-[10px] font-medium text-slate-500">
                {s > 0 ? "+" : ""}
                {s}%
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((rowCells) => (
            <tr key={rowCells[0]?.priceDeltaPct}>
              <td className="p-1 text-[10px] font-medium text-slate-500">
                {rowCells[0]?.priceDeltaPct > 0 ? "+" : ""}
                {rowCells[0]?.priceDeltaPct}%
              </td>
              {rowCells.map((cell) => (
                <td
                  key={cell.salesDeltaPct}
                  title={formatCurrency(cell.utilidadNeta, currency)}
                  className="p-1 text-center align-middle"
                  style={{ backgroundColor: cellColor(cell.utilidadNeta, maxAbs) }}
                >
                  <span className="font-medium text-slate-800">{formatCurrency(cell.utilidadNeta, currency)}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

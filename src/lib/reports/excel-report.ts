/**
 * Genera el workbook Excel del reporte (spec §23.7). Mismas reglas que el
 * generador de PDF: solo escribe cifras que ya vienen calculadas en
 * `ReportData`, nunca recalcula nada.
 */
import ExcelJS from "exceljs";
import type { ReportData } from "@/lib/reports/build-report-data";
import type { ReportType } from "@/lib/reports/pdf-report";
import { SOLIDITY_LABELS } from "@/lib/reports/labels";

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FF334155" } };
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  });
}

export async function buildReportWorkbook(data: ReportData, reportType: ReportType, includeScenarios: boolean): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "EMPRENDE AI";
  workbook.created = data.generatedAt;

  const summary = workbook.addWorksheet("Resumen");
  summary.columns = [
    { header: "Indicador", key: "label", width: 32 },
    { header: `Valor (${data.company.currency})`, key: "value", width: 22 },
  ];
  styleHeaderRow(summary.getRow(1));
  summary.addRow({ label: "Empresa", value: data.company.name });
  summary.addRow({ label: "País / Ciudad", value: `${data.company.country} / ${data.company.city}` });
  summary.addRow({ label: "Generado el", value: data.generatedAt.toLocaleString() });
  summary.addRow({ label: "Solidez del negocio", value: SOLIDITY_LABELS[data.solidity] });
  summary.addRow({});
  if (data.statement && data.cashFlow) {
    summary.addRow({ label: "Ventas (mes)", value: data.statement.ventas });
    summary.addRow({ label: "Utilidad Neta", value: data.statement.utilidadNeta });
    summary.addRow({ label: "Margen Neto (%)", value: data.statement.margenNetoPct });
    summary.addRow({ label: "Punto de Equilibrio", value: data.breakEvenAmount ?? "—" });
    summary.addRow({ label: "Flujo de Caja (mes)", value: data.cashFlow.flujoNeto });
    summary.addRow({ label: "Inversión Total", value: data.inversionTotal });
    summary.addRow({ label: "ROI (%)", value: data.roiPct });
  } else {
    summary.addRow({ label: "Sin datos", value: "Carga productos y costos para completar este reporte" });
  }

  if (data.statement) {
    const stmt = workbook.addWorksheet("Estado de Resultados");
    stmt.columns = [
      { header: "Concepto", key: "label", width: 28 },
      { header: `Monto (${data.company.currency})`, key: "value", width: 20 },
    ];
    styleHeaderRow(stmt.getRow(1));
    const s = data.statement;
    [
      ["Ventas", s.ventas],
      ["Costo de Ventas", -s.costoVentas],
      ["Utilidad Bruta", s.utilidadBruta],
      ["Gastos Operativos", -s.gastosOperativos],
      ["EBITDA", s.ebitda],
      ["Depreciación", -s.depreciacion],
      ["EBIT", s.ebit],
      ["Impuestos", -s.impuestos],
      ["Utilidad Neta", s.utilidadNeta],
    ].forEach(([label, value]) => stmt.addRow({ label, value }));
  }

  if (reportType === "financiero" && data.products.length > 0) {
    const products = workbook.addWorksheet("Productos");
    products.columns = [
      { header: "Nombre", key: "name", width: 26 },
      { header: "Precio", key: "price", width: 14 },
      { header: "Costo variable u.", key: "cost", width: 18 },
      { header: "Margen %", key: "marginPct", width: 12 },
      { header: "Unidades/mes", key: "units", width: 14 },
      { header: "Contribución marginal", key: "contribution", width: 20 },
    ];
    styleHeaderRow(products.getRow(1));
    data.products.forEach((p) =>
      products.addRow({
        name: p.name,
        price: p.price,
        cost: p.unitVariableCost,
        marginPct: p.unitMarginPct,
        units: p.unitsSoldMonthly,
        contribution: p.marginalContribution,
      })
    );
  }

  if (reportType === "financiero" && data.fixedCosts.length > 0) {
    const costs = workbook.addWorksheet("Costos Fijos");
    costs.columns = [
      { header: "Nombre", key: "name", width: 26 },
      { header: "Categoría", key: "category", width: 20 },
      { header: "Monto mensual", key: "amount", width: 18 },
    ];
    styleHeaderRow(costs.getRow(1));
    data.fixedCosts.forEach((c) => costs.addRow({ name: c.name, category: c.category, amount: c.amountMonthly }));
  }

  if (includeScenarios && data.scenarios.length > 0) {
    const scenarios = workbook.addWorksheet("Escenarios");
    scenarios.columns = [
      { header: "Escenario", key: "label", width: 16 },
      { header: "Ventas", key: "ventas", width: 16 },
      { header: "Costos", key: "costos", width: 16 },
      { header: "Utilidad Neta", key: "utilidadNeta", width: 16 },
      { header: "Margen %", key: "margenNetoPct", width: 12 },
      { header: "ROI %", key: "roiPct", width: 12 },
    ];
    styleHeaderRow(scenarios.getRow(1));
    data.scenarios.forEach((s) => scenarios.addRow(s));
  }

  return workbook.xlsx.writeBuffer();
}

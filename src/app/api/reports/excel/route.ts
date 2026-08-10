import { NextRequest, NextResponse } from "next/server";
import { requireCompanyForApi } from "@/lib/actions/guard";
import { buildReportData } from "@/lib/reports/build-report-data";
import { buildReportWorkbook } from "@/lib/reports/excel-report";
import type { ReportType } from "@/lib/reports/pdf-report";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const result = await requireCompanyForApi();
  if ("error" in result) return result.error;
  const { company } = result;

  const { searchParams } = new URL(request.url);
  const reportType: ReportType = searchParams.get("type") === "financiero" ? "financiero" : "ejecutivo";
  const includeScenarios = searchParams.get("scenarios") !== "0";

  const data = await buildReportData(company.id);
  const buffer = await buildReportWorkbook(data, reportType, includeScenarios);

  const filename = `emprendeai-reporte-${reportType}-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

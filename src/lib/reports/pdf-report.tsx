/**
 * Documento PDF (spec §23.7): Reporte Ejecutivo (resumido) y Reporte
 * Financiero/Rentabilidad (completo). react-pdf renderiza en Node sin
 * necesitar un navegador — apto para correr en cualquier hosting serverless.
 * Todas las cifras vienen ya calculadas en `ReportData` (build-report-data.ts).
 */
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ReportData } from "@/lib/reports/build-report-data";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { SOLIDITY_LABELS } from "@/lib/reports/labels";

export type ReportType = "ejecutivo" | "financiero";

const styles = StyleSheet.create({
  page: { padding: 34, fontSize: 10, fontFamily: "Helvetica", color: "#0f172a" },
  h1: { fontSize: 18, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 9, color: "#64748b", marginBottom: 4 },
  meta: { fontSize: 8, color: "#94a3b8", marginBottom: 18 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "#cbd5e1", paddingBottom: 4 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap" },
  kpiCard: { width: "31%", padding: 8, backgroundColor: "#f8fafc", borderRadius: 4, marginRight: "2%", marginBottom: 8 },
  kpiLabel: { fontSize: 7.5, color: "#64748b" },
  kpiValue: { fontSize: 13, fontWeight: 700, marginTop: 2 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#f1f5f9", paddingVertical: 5 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0", paddingVertical: 4 },
  th: { flex: 1, fontSize: 7.5, fontWeight: 700, color: "#475569", paddingHorizontal: 4 },
  td: { flex: 1, fontSize: 8.5, paddingHorizontal: 4, color: "#1e293b" },
  note: { fontSize: 8, color: "#64748b", marginTop: 6 },
  emptyState: { fontSize: 9, color: "#94a3b8", padding: 12, backgroundColor: "#f8fafc", borderRadius: 4 },
  footer: { position: "absolute", bottom: 18, left: 34, right: 34, fontSize: 7.5, color: "#94a3b8", textAlign: "center" },
});

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );
}

function Header({ data, reportType }: { data: ReportData; reportType: ReportType }) {
  return (
    <View>
      <Text style={styles.h1}>{data.company.name}</Text>
      <Text style={styles.subtitle}>
        {reportType === "ejecutivo" ? "Reporte Ejecutivo" : "Reporte Financiero / Rentabilidad"} — EMPRENDE AI
      </Text>
      <Text style={styles.meta}>
        Generado el {data.generatedAt.toLocaleString()} · Moneda: {data.company.currency} · Solidez del negocio:{" "}
        {SOLIDITY_LABELS[data.solidity]}
      </Text>
    </View>
  );
}

function KpiSection({ data }: { data: ReportData }) {
  if (!data.hasData || !data.statement || !data.cashFlow) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Indicadores principales</Text>
        <Text style={styles.emptyState}>
          Todavía no hay productos ni costos cargados en la plataforma — este reporte se completará automáticamente
          cuando se registren datos en Mi Negocio y Estructura de Costos.
        </Text>
      </View>
    );
  }

  const { statement, cashFlow } = data;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Indicadores principales (dato real, mes actual)</Text>
      <View style={styles.kpiGrid}>
        <Kpi label="Ventas" value={formatCurrency(statement.ventas, data.company.currency)} />
        <Kpi label="Utilidad Neta" value={formatCurrency(statement.utilidadNeta, data.company.currency)} />
        <Kpi label="Margen Neto" value={formatPercent(statement.margenNetoPct)} />
        <Kpi
          label="Punto de Equilibrio"
          value={data.breakEvenAmount != null && Number.isFinite(data.breakEvenAmount) ? formatCurrency(data.breakEvenAmount, data.company.currency) : "—"}
        />
        <Kpi label="Flujo de Caja (mes)" value={formatCurrency(cashFlow.flujoNeto, data.company.currency)} />
        <Kpi label="ROI" value={formatPercent(data.roiPct)} />
      </View>
    </View>
  );
}

function ScenariosSection({ data }: { data: ReportData }) {
  if (data.scenarios.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Escenarios (Pesimista / Base / Optimista)</Text>
      <View style={styles.tableHeaderRow}>
        <Text style={styles.th}>Escenario</Text>
        <Text style={styles.th}>Ventas</Text>
        <Text style={styles.th}>Costos</Text>
        <Text style={styles.th}>Utilidad Neta</Text>
        <Text style={styles.th}>Margen</Text>
        <Text style={styles.th}>ROI</Text>
      </View>
      {data.scenarios.map((s) => (
        <View key={s.type} style={styles.tableRow}>
          <Text style={styles.td}>{s.label}</Text>
          <Text style={styles.td}>{formatCurrency(s.ventas, data.company.currency)}</Text>
          <Text style={styles.td}>{formatCurrency(s.costos, data.company.currency)}</Text>
          <Text style={styles.td}>{formatCurrency(s.utilidadNeta, data.company.currency)}</Text>
          <Text style={styles.td}>{formatPercent(s.margenNetoPct)}</Text>
          <Text style={styles.td}>{formatPercent(s.roiPct)}</Text>
        </View>
      ))}
      <Text style={styles.note}>
        Los escenarios son proyecciones (supuesto), calculadas aplicando los ajustes de % definidos en el módulo
        Escenarios sobre los datos reales cargados en la plataforma.
      </Text>
    </View>
  );
}

function IncomeStatementSection({ data }: { data: ReportData }) {
  if (!data.statement) return null;
  const s = data.statement;
  const rows: [string, number][] = [
    ["Ventas", s.ventas],
    ["Costo de Ventas", -s.costoVentas],
    ["Utilidad Bruta", s.utilidadBruta],
    ["Gastos Operativos", -s.gastosOperativos],
    ["EBITDA", s.ebitda],
    ["Depreciación", -s.depreciacion],
    ["EBIT", s.ebit],
    ["Impuestos", -s.impuestos],
    ["Utilidad Neta", s.utilidadNeta],
  ];
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Estado de Resultados (mensual, dato real)</Text>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.tableRow}>
          <Text style={[styles.td, { flex: 2, fontWeight: label === "Utilidad Neta" ? 700 : 400 }]}>{label}</Text>
          <Text style={[styles.td, { textAlign: "right" }]}>{formatCurrency(value, data.company.currency)}</Text>
        </View>
      ))}
    </View>
  );
}

function ProductsSection({ data }: { data: ReportData }) {
  if (data.products.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Rentabilidad por producto/servicio</Text>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.th, { flex: 1.5 }]}>Nombre</Text>
        <Text style={styles.th}>Precio</Text>
        <Text style={styles.th}>Costo variable</Text>
        <Text style={styles.th}>Margen %</Text>
        <Text style={styles.th}>Unid./mes</Text>
        <Text style={styles.th}>Contrib. marginal</Text>
      </View>
      {data.products.map((p) => (
        <View key={p.name} style={styles.tableRow}>
          <Text style={[styles.td, { flex: 1.5 }]}>{p.name}</Text>
          <Text style={styles.td}>{formatCurrency(p.price, data.company.currency)}</Text>
          <Text style={styles.td}>{formatCurrency(p.unitVariableCost, data.company.currency)}</Text>
          <Text style={styles.td}>{formatPercent(p.unitMarginPct)}</Text>
          <Text style={styles.td}>{p.unitsSoldMonthly}</Text>
          <Text style={styles.td}>{formatCurrency(p.marginalContribution, data.company.currency)}</Text>
        </View>
      ))}
    </View>
  );
}

function CostsSection({ data }: { data: ReportData }) {
  if (data.fixedCosts.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Costos fijos mensuales</Text>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.th, { flex: 1.5 }]}>Nombre</Text>
        <Text style={styles.th}>Categoría</Text>
        <Text style={styles.th}>Monto mensual</Text>
      </View>
      {data.fixedCosts.map((c) => (
        <View key={c.name} style={styles.tableRow}>
          <Text style={[styles.td, { flex: 1.5 }]}>{c.name}</Text>
          <Text style={styles.td}>{c.category}</Text>
          <Text style={styles.td}>{formatCurrency(c.amountMonthly, data.company.currency)}</Text>
        </View>
      ))}
    </View>
  );
}

function InvestmentSection({ data }: { data: ReportData }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Inversión y retorno</Text>
      <View style={styles.kpiGrid}>
        <Kpi label="Inversión Total" value={formatCurrency(data.inversionTotal, data.company.currency)} />
        <Kpi label="ROI" value={formatPercent(data.roiPct)} />
      </View>
    </View>
  );
}

export function ReportPdfDocument({
  data,
  reportType,
  includeScenarios,
}: {
  data: ReportData;
  reportType: ReportType;
  includeScenarios: boolean;
}) {
  return (
    <Document title={`${data.company.name} — Reporte ${reportType}`}>
      <Page size="A4" style={styles.page}>
        <Header data={data} reportType={reportType} />
        <KpiSection data={data} />
        {includeScenarios && <ScenariosSection data={data} />}
        {reportType === "financiero" && (
          <>
            <IncomeStatementSection data={data} />
            <ProductsSection data={data} />
            <CostsSection data={data} />
            <InvestmentSection data={data} />
          </>
        )}
        <Text style={styles.footer} fixed>
          EMPRENDE AI — Reporte generado automáticamente por el Financial Engine. Las cifras de escenarios son
          proyecciones basadas en supuestos, no datos reales.
        </Text>
      </Page>
    </Document>
  );
}

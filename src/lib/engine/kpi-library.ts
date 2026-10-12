/**
 * KPI LIBRARY — biblioteca de KPIs (spec §12):
 *   Financieros: Ventas, Margen, EBITDA, Utilidad, ROI, ROIC, ROE, Cash Flow, CAC, LTV
 *   Comerciales: Leads, Conversión, Ticket promedio, Ventas por vendedor, Frecuencia de compra
 *   Operativos: Productividad, Costo unitario, Capacidad, Utilización
 *   Marketing: CPL, CAC, ROAS, Conversión
 *
 * Determinístico y puro (spec §0.3/§27): cada valor viene de un engine ya
 * existente (Financial/Funnel/Financing), nunca se recalcula ni se inventa
 * aquí. Cuando la plataforma no captura el dato necesario para un KPI de la
 * spec, el ítem se devuelve con `value: null` y `unavailableReason` — nunca
 * se rellena con un número aproximado o simulado (spec §0.3).
 */

import type { CompanySnapshot } from "@/lib/engine/financial";
import type { FunnelStages, LtvCacResult } from "@/lib/engine/funnel";

export type KpiCategory = "financiero" | "comercial" | "operativo" | "marketing";
export type KpiKind = "currency" | "percent" | "number" | "ratio";

export interface KpiLibraryItem {
  id: string;
  category: KpiCategory;
  label: string;
  formula: string;
  kind: KpiKind;
  suffix?: string;
  value: number | null;
  /** Aclaración sobre el número (ej. por qué coincide con otro KPI en este modelo) — nunca oculta el dato, lo explica. */
  note?: string;
  /** Por qué el valor es `null` — obligatorio cuando `value` es `null`. */
  unavailableReason?: string;
}

export interface KpiLibraryFunnelContext {
  stages: FunnelStages;
  avgTicket: number;
  purchaseFrequencyPerYear: number;
  ltvCac: LtvCacResult;
  costPerLead: number;
  overallConversionPct: number;
}

export interface KpiLibraryContext {
  hasData: boolean;
  snapshot: CompanySnapshot | null;
  inversionTotal: number;
  /** ROI = Utilidad Neta / Inversión Total × 100 (fórmula 21.3) — ya calculado por el Financial Engine. */
  roi: number;
  /** ROE = Utilidad Neta / (Inversión Total − Total Financiado) × 100 (Financing Engine) — `null` si lo financiado cubre o supera la inversión. */
  roe: number | null;
  funnel: KpiLibraryFunnelContext | null;
}

const NO_PRODUCT_DATA = "Carga productos/servicios en Mi Negocio.";
const NO_INVESTMENT_DATA = "Registra tu Inversión Inicial.";
const NO_FUNNEL_DATA = "Carga tu embudo de ventas en Ventas / Embudo.";

export function buildKpiLibrary(ctx: KpiLibraryContext): KpiLibraryItem[] {
  const { snapshot, funnel } = ctx;
  const hasFinancial = ctx.hasData && snapshot != null;
  const hasInvestment = hasFinancial && ctx.inversionTotal > 0;
  const hasFunnel = funnel != null && funnel.stages.leads > 0;
  const hasUnitCost = hasFinancial && snapshot.weightedUnitsSoldMonthly > 0;

  const items: KpiLibraryItem[] = [
    // Financieros
    {
      id: "ventas",
      category: "financiero",
      label: "Ventas",
      formula: "Σ (Precio neto × Unidades vendidas) — fórmula 21.1",
      kind: "currency",
      value: hasFinancial ? snapshot.statement.ventas : null,
      unavailableReason: hasFinancial ? undefined : NO_PRODUCT_DATA,
    },
    {
      id: "margen_neto",
      category: "financiero",
      label: "Margen Neto",
      formula: "Utilidad Neta / Ventas × 100 — fórmula 21.1",
      kind: "percent",
      value: hasFinancial ? snapshot.statement.margenNetoPct : null,
      unavailableReason: hasFinancial ? undefined : NO_PRODUCT_DATA,
    },
    {
      id: "ebitda",
      category: "financiero",
      label: "EBITDA",
      formula: "Utilidad Bruta − Gastos Operativos — spec §8",
      kind: "currency",
      value: hasFinancial ? snapshot.statement.ebitda : null,
      unavailableReason: hasFinancial ? undefined : NO_PRODUCT_DATA,
    },
    {
      id: "utilidad_neta",
      category: "financiero",
      label: "Utilidad",
      formula: "EBIT − Impuestos — spec §8",
      kind: "currency",
      value: hasFinancial ? snapshot.statement.utilidadNeta : null,
      unavailableReason: hasFinancial ? undefined : NO_PRODUCT_DATA,
    },
    {
      id: "roi",
      category: "financiero",
      label: "ROI",
      formula: "Utilidad Neta / Inversión Total × 100 — fórmula 21.3",
      kind: "percent",
      value: hasInvestment ? ctx.roi : null,
      unavailableReason: hasInvestment ? undefined : NO_INVESTMENT_DATA,
    },
    {
      id: "roic",
      category: "financiero",
      label: "ROIC",
      formula: "NOPAT / Capital Invertido (deuda + patrimonio)",
      kind: "percent",
      value: hasInvestment ? ctx.roi : null,
      unavailableReason: hasInvestment ? undefined : NO_INVESTMENT_DATA,
      note: "En este modelo coincide con el ROI: el Estado de Resultados no modela una línea de gastos financieros propia, así que NOPAT = Utilidad Neta y el capital invertido total = tu Inversión Total.",
    },
    {
      id: "roe",
      category: "financiero",
      label: "ROE",
      formula: "Utilidad Neta / (Inversión Total − Total Financiado)",
      kind: "percent",
      value: hasInvestment ? ctx.roe : null,
      unavailableReason: hasInvestment ? undefined : NO_INVESTMENT_DATA,
      note: "Si no registraste financiamiento en Financiamiento, coincide con tu ROI: todo el capital es propio.",
    },
    {
      id: "cash_flow",
      category: "financiero",
      label: "Cash Flow (mes)",
      formula: "Ingresos − Egresos — spec §8",
      kind: "currency",
      value: hasFinancial ? snapshot.cashFlow.flujoNeto : null,
      unavailableReason: hasFinancial ? undefined : NO_PRODUCT_DATA,
    },
    {
      id: "cac_financiero",
      category: "financiero",
      label: "CAC",
      formula: "Gasto de Marketing / Clientes nuevos — fórmula 21.12",
      kind: "currency",
      value: hasFunnel ? funnel.ltvCac.cac : null,
      unavailableReason: hasFunnel ? undefined : NO_FUNNEL_DATA,
    },
    {
      id: "ltv",
      category: "financiero",
      label: "LTV",
      formula: "Ticket promedio × Frecuencia anual × Vida útil (años) — fórmula 21.12",
      kind: "currency",
      value: hasFunnel ? funnel.ltvCac.ltv : null,
      unavailableReason: hasFunnel ? undefined : NO_FUNNEL_DATA,
    },

    // Comerciales
    {
      id: "leads",
      category: "comercial",
      label: "Leads (mes)",
      formula: "Dato cargado en el embudo de ventas",
      kind: "number",
      value: hasFunnel ? funnel.stages.leads : null,
      unavailableReason: hasFunnel ? undefined : NO_FUNNEL_DATA,
    },
    {
      id: "conversion_comercial",
      category: "comercial",
      label: "Conversión (Leads → Ventas)",
      formula: "Ventas / Leads × 100",
      kind: "percent",
      value: hasFunnel ? funnel.overallConversionPct : null,
      unavailableReason: hasFunnel ? undefined : NO_FUNNEL_DATA,
    },
    {
      id: "ticket_promedio",
      category: "comercial",
      label: "Ticket promedio",
      formula: "Dato cargado o derivado de Mi Negocio",
      kind: "currency",
      value: hasFunnel ? funnel.avgTicket : null,
      unavailableReason: hasFunnel ? undefined : NO_FUNNEL_DATA,
    },
    {
      id: "ventas_por_vendedor",
      category: "comercial",
      label: "Ventas por vendedor",
      formula: "Ventas / N° de vendedores activos",
      kind: "currency",
      value: null,
      unavailableReason: "La plataforma no captura el número de vendedores activos todavía (sí el supuesto de leads/vendedor en Mis Metas).",
    },
    {
      id: "frecuencia_compra",
      category: "comercial",
      label: "Frecuencia de compra",
      formula: "Dato cargado en el embudo de ventas",
      kind: "number",
      suffix: " veces/año",
      value: hasFunnel ? funnel.purchaseFrequencyPerYear : null,
      unavailableReason: hasFunnel ? undefined : NO_FUNNEL_DATA,
    },

    // Operativos
    {
      id: "costo_unitario",
      category: "operativo",
      label: "Costo unitario promedio",
      formula: "Costo Variable Total / Unidades vendidas",
      kind: "currency",
      value: hasUnitCost ? snapshot.aggregate.costoVariableTotal / snapshot.weightedUnitsSoldMonthly : null,
      unavailableReason: hasUnitCost ? undefined : "Carga productos con unidades vendidas en Mi Negocio.",
    },
    {
      id: "productividad",
      category: "operativo",
      label: "Productividad",
      formula: "Producción / Horas u obreros invertidos",
      kind: "number",
      value: null,
      unavailableReason: "La plataforma no captura datos de producción u horas-hombre todavía.",
    },
    {
      id: "capacidad",
      category: "operativo",
      label: "Capacidad",
      formula: "Capacidad máxima de producción/atención",
      kind: "number",
      value: null,
      unavailableReason: "La plataforma no captura capacidad instalada todavía.",
    },
    {
      id: "utilizacion",
      category: "operativo",
      label: "Utilización",
      formula: "Producción real / Capacidad máxima × 100",
      kind: "percent",
      value: null,
      unavailableReason: "Requiere el dato de Capacidad, que no se captura todavía.",
    },

    // Marketing
    {
      id: "cpl",
      category: "marketing",
      label: "CPL (Costo por Lead)",
      formula: "Gasto de Marketing / N° de leads",
      kind: "currency",
      value: hasFunnel ? funnel.costPerLead : null,
      unavailableReason: hasFunnel ? undefined : NO_FUNNEL_DATA,
    },
    {
      id: "cac_marketing",
      category: "marketing",
      label: "CAC",
      formula: "Gasto de Marketing / Clientes nuevos — fórmula 21.12",
      kind: "currency",
      value: hasFunnel ? funnel.ltvCac.cac : null,
      unavailableReason: hasFunnel ? undefined : NO_FUNNEL_DATA,
    },
    {
      id: "roas",
      category: "marketing",
      label: "ROAS",
      formula: "Ventas atribuidas a marketing / Gasto de Marketing",
      kind: "ratio",
      value: null,
      unavailableReason:
        "Requiere trackear qué ventas provienen específicamente de campañas de marketing (atribución) — el embudo captura el total de ventas de la empresa, no solo las originadas por marketing.",
    },
    {
      id: "conversion_marketing",
      category: "marketing",
      label: "Conversión",
      formula: "Ventas / Leads × 100",
      kind: "percent",
      value: hasFunnel ? funnel.overallConversionPct : null,
      unavailableReason: hasFunnel ? undefined : NO_FUNNEL_DATA,
    },
  ];

  return items;
}

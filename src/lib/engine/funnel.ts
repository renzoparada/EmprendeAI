/**
 * FUNNEL ENGINE — Sales Forecast / embudo comercial (spec §7, fórmula 21.12).
 * Determinístico y puro (spec §27).
 */

export interface FunnelStages {
  leads: number;
  contactos: number;
  prospectos: number;
  reuniones: number;
  cotizaciones: number;
  negociaciones: number;
  ventas: number;
}

const STAGE_ORDER: (keyof FunnelStages)[] = ["leads", "contactos", "prospectos", "reuniones", "cotizaciones", "negociaciones", "ventas"];

export const FUNNEL_STAGE_LABELS: Record<keyof FunnelStages, string> = {
  leads: "Leads",
  contactos: "Contactos",
  prospectos: "Prospectos",
  reuniones: "Reuniones",
  cotizaciones: "Cotizaciones",
  negociaciones: "Negociaciones",
  ventas: "Ventas",
};

export interface FunnelStageConversion {
  fromStage: string;
  toStage: string;
  fromCount: number;
  toCount: number;
  conversionPct: number;
}

/** Conversión etapa a etapa del embudo (spec §7: "Calcula conversión por etapa"). */
export function computeFunnelConversions(stages: FunnelStages): FunnelStageConversion[] {
  const result: FunnelStageConversion[] = [];
  for (let i = 0; i < STAGE_ORDER.length - 1; i++) {
    const from = STAGE_ORDER[i];
    const to = STAGE_ORDER[i + 1];
    const fromCount = stages[from];
    const toCount = stages[to];
    result.push({
      fromStage: FUNNEL_STAGE_LABELS[from],
      toStage: FUNNEL_STAGE_LABELS[to],
      fromCount,
      toCount,
      conversionPct: fromCount > 0 ? (toCount / fromCount) * 100 : 0,
    });
  }
  return result;
}

/** Conversión global Leads → Ventas. */
export function computeOverallConversionPct(stages: FunnelStages): number {
  return stages.leads > 0 ? (stages.ventas / stages.leads) * 100 : 0;
}

/** Costo por lead = Gasto de marketing / N° de leads. */
export function computeCostPerLead(marketingSpend: number, leads: number): number {
  return leads > 0 ? marketingSpend / leads : 0;
}

/** CAC = Gasto total Marketing y Ventas / N° clientes nuevos — fórmula 21.12. */
export function computeCAC(marketingSpend: number, newCustomers: number): number {
  return newCustomers > 0 ? marketingSpend / newCustomers : 0;
}

/** LTV = Ticket promedio × Frecuencia de compra anual × Vida útil del cliente (años) — fórmula 21.12. */
export function computeLTV(avgTicket: number, purchaseFrequencyPerYear: number, customerLifetimeYears: number): number {
  return avgTicket * purchaseFrequencyPerYear * customerLifetimeYears;
}

export interface LtvCacResult {
  ltv: number;
  cac: number;
  /** LTV/CAC — relación saludable: ≥ 3 (spec 21.12). */
  ratio: number;
  healthy: boolean;
}

export function computeLtvCacRatio(ltv: number, cac: number): LtvCacResult {
  const ratio = cac > 0 ? ltv / cac : Infinity;
  return { ltv, cac, ratio, healthy: ratio >= 3 };
}

/** Ventas esperadas del mes según el ritmo actual de leads y la conversión global del embudo. */
export function computeExpectedSales(leads: number, overallConversionPct: number): number {
  return leads * (overallConversionPct / 100);
}

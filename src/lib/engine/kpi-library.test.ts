import { describe, expect, it } from "vitest";
import { buildKpiLibrary, type KpiLibraryContext } from "./kpi-library";
import type { CompanySnapshot } from "./financial";

const snapshot: CompanySnapshot = {
  economics: [],
  aggregate: { ventas: 10000, costoVariableTotal: 4000, contribucionMarginalTotal: 6000, contributionMarginRatio: 0.6, margenBrutoPct: 60 },
  breakEven: { units: 100, amount: 5000 },
  statement: {
    ventas: 10000,
    costoVentas: 4000,
    utilidadBruta: 6000,
    gastosOperativos: 3000,
    ebitda: 3000,
    depreciacion: 0,
    ebit: 3000,
    impuestos: 750,
    utilidadNeta: 2250,
    margenNetoPct: 22.5,
  },
  cashFlow: { saldoInicial: 0, ingresos: 10000, egresos: 7750, flujoNeto: 2250, saldoFinal: 2250, alertaFlujoNegativo: false },
  weightedUnitsSoldMonthly: 200,
};

const funnel = {
  stages: { leads: 500, contactos: 300, prospectos: 200, reuniones: 100, cotizaciones: 80, negociaciones: 60, ventas: 50 },
  avgTicket: 200,
  purchaseFrequencyPerYear: 4,
  ltvCac: { ltv: 3200, cac: 400, ratio: 8, healthy: true },
  costPerLead: 10,
  overallConversionPct: 10,
};

function baseContext(overrides: Partial<KpiLibraryContext> = {}): KpiLibraryContext {
  return { hasData: true, snapshot, inversionTotal: 15000, roi: 15, roe: 15, funnel: null, ...overrides };
}

describe("kpi library", () => {
  it("sin datos de negocio, todos los KPIs financieros/comerciales/operativos quedan no disponibles", () => {
    const items = buildKpiLibrary({ hasData: false, snapshot: null, inversionTotal: 0, roi: 0, roe: null, funnel: null });
    for (const item of items) {
      expect(item.value).toBeNull();
      expect(item.unavailableReason).toBeTruthy();
    }
  });

  it("con snapshot pero sin inversión registrada, ROI/ROIC/ROE quedan no disponibles", () => {
    const items = buildKpiLibrary(baseContext({ inversionTotal: 0 }));
    for (const id of ["roi", "roic", "roe"]) {
      const item = items.find((i) => i.id === id)!;
      expect(item.value).toBeNull();
      expect(item.unavailableReason).toContain("Inversión Inicial");
    }
    // Los que no dependen de inversión sí están disponibles.
    expect(items.find((i) => i.id === "ventas")!.value).toBe(10000);
  });

  it("ROIC siempre coincide con ROI en este modelo", () => {
    const items = buildKpiLibrary(baseContext({ roi: 18.3 }));
    expect(items.find((i) => i.id === "roic")!.value).toBe(18.3);
    expect(items.find((i) => i.id === "roi")!.value).toBe(18.3);
  });

  it("ROE puede diferir de ROI cuando hay financiamiento (se pasa ya calculado)", () => {
    const items = buildKpiLibrary(baseContext({ roi: 15, roe: 30 }));
    expect(items.find((i) => i.id === "roe")!.value).toBe(30);
    expect(items.find((i) => i.id === "roi")!.value).toBe(15);
  });

  it("costo unitario promedio se deriva del snapshot", () => {
    const items = buildKpiLibrary(baseContext());
    const item = items.find((i) => i.id === "costo_unitario")!;
    expect(item.value).toBeCloseTo(4000 / 200);
  });

  it("sin embudo cargado, los KPIs de embudo/marketing quedan no disponibles", () => {
    const items = buildKpiLibrary(baseContext({ funnel: null }));
    for (const id of ["cac_financiero", "ltv", "leads", "conversion_comercial", "ticket_promedio", "frecuencia_compra", "cpl", "cac_marketing", "conversion_marketing"]) {
      const item = items.find((i) => i.id === id)!;
      expect(item.value).toBeNull();
    }
  });

  it("con embudo cargado, los KPIs de embudo/marketing están disponibles", () => {
    const items = buildKpiLibrary(baseContext({ funnel }));
    expect(items.find((i) => i.id === "leads")!.value).toBe(500);
    expect(items.find((i) => i.id === "cac_marketing")!.value).toBe(400);
    expect(items.find((i) => i.id === "ltv")!.value).toBe(3200);
    expect(items.find((i) => i.id === "cpl")!.value).toBe(10);
  });

  it("los KPIs no capturados por la plataforma (ROAS, Productividad, Capacidad, Utilización, Ventas por vendedor) siempre son null con razón", () => {
    const items = buildKpiLibrary(baseContext({ funnel }));
    for (const id of ["roas", "productividad", "capacidad", "utilizacion", "ventas_por_vendedor"]) {
      const item = items.find((i) => i.id === id)!;
      expect(item.value).toBeNull();
      expect(item.unavailableReason).toBeTruthy();
    }
  });

  it("cada ítem no disponible trae una razón, y cada disponible no trae razón", () => {
    const items = buildKpiLibrary(baseContext({ funnel, inversionTotal: 0 }));
    for (const item of items) {
      if (item.value == null) expect(item.unavailableReason).toBeTruthy();
      else expect(item.unavailableReason).toBeUndefined();
    }
  });
});

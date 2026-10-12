import { describe, expect, it } from "vitest";
import { buildAlerts, type AlertContext } from "./alerts";
import type { CompanySnapshot } from "./financial";

function baseSnapshot(overrides: Partial<CompanySnapshot["statement"] & CompanySnapshot["cashFlow"] & { breakEvenAmount: number }> = {}): CompanySnapshot {
  const statement = {
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
    ...overrides,
  };
  const cashFlow = {
    saldoInicial: 0,
    ingresos: statement.ventas,
    egresos: statement.costoVentas + statement.gastosOperativos + statement.impuestos,
    flujoNeto: 2250,
    saldoFinal: 2250,
    alertaFlujoNegativo: false,
    ...overrides,
  };

  return {
    economics: [],
    aggregate: { ventas: statement.ventas, costoVariableTotal: statement.costoVentas, contribucionMarginalTotal: 6000, contributionMarginRatio: 0.6, margenBrutoPct: 60 },
    breakEven: { units: 100, amount: overrides.breakEvenAmount ?? 5000 },
    statement,
    cashFlow,
    weightedUnitsSoldMonthly: 100,
  };
}

function baseContext(overrides: Partial<AlertContext> = {}): AlertContext {
  return { hasData: true, snapshot: baseSnapshot(), products: [], ...overrides };
}

describe("alert engine", () => {
  it("con hasData=false devuelve una única alerta informativa", () => {
    const alerts = buildAlerts({ hasData: false, snapshot: null, products: [] });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].id).toBe("sin_datos");
  });

  it("no genera alertas cuando todo está saludable", () => {
    const alerts = buildAlerts(baseContext());
    expect(alerts).toHaveLength(0);
  });

  it("detecta flujo de caja negativo", () => {
    const snapshot = baseSnapshot({ flujoNeto: -100, alertaFlujoNegativo: true });
    const alerts = buildAlerts(baseContext({ snapshot }));
    expect(alerts.some((a) => a.id === "flujo_negativo" && a.severity === "danger")).toBe(true);
  });

  it("detecta margen neto bajo", () => {
    const snapshot = baseSnapshot({ margenNetoPct: 5 });
    const alerts = buildAlerts(baseContext({ snapshot }));
    expect(alerts.some((a) => a.id === "margen_bajo")).toBe(true);
  });

  it("detecta ventas por debajo del punto de equilibrio", () => {
    const snapshot = baseSnapshot({ ventas: 1000, breakEvenAmount: 5000 });
    const alerts = buildAlerts(baseContext({ snapshot }));
    expect(alerts.some((a) => a.id === "bajo_punto_equilibrio")).toBe(true);
  });

  it("detecta producto con margen unitario negativo", () => {
    const alerts = buildAlerts(
      baseContext({
        products: [
          { productId: "1", name: "Combo A", unitMarginPct: 20 },
          { productId: "2", name: "Combo B", unitMarginPct: -5 },
        ],
      })
    );
    const alert = alerts.find((a) => a.id === "producto_margen_negativo");
    expect(alert?.severity).toBe("danger");
    expect(alert?.message).toContain("Combo B");
  });

  it("detecta producto más y menos rentable cuando la brecha es amplia y ambos son positivos", () => {
    const alerts = buildAlerts(
      baseContext({
        products: [
          { productId: "1", name: "Premium", unitMarginPct: 40 },
          { productId: "2", name: "Básico", unitMarginPct: 10 },
        ],
      })
    );
    const alert = alerts.find((a) => a.id === "producto_mas_rentable");
    expect(alert).toBeDefined();
    expect(alert?.message).toContain("Premium");
    expect(alert?.message).toContain("Básico");
  });

  it("no alerta rentabilidad de producto si la brecha es pequeña", () => {
    const alerts = buildAlerts(
      baseContext({
        products: [
          { productId: "1", name: "A", unitMarginPct: 22 },
          { productId: "2", name: "B", unitMarginPct: 18 },
        ],
      })
    );
    expect(alerts.some((a) => a.id === "producto_mas_rentable" || a.id === "producto_margen_negativo")).toBe(false);
  });

  it("detecta LTV/CAC por debajo de 3x", () => {
    const alerts = buildAlerts(baseContext({ funnel: { ltvCac: { ltv: 100, cac: 60, ratio: 100 / 60, healthy: false } } }));
    expect(alerts.some((a) => a.id === "ltv_cac_bajo")).toBe(true);
  });

  it("no alerta LTV/CAC cuando es saludable", () => {
    const alerts = buildAlerts(baseContext({ funnel: { ltvCac: { ltv: 300, cac: 60, ratio: 5, healthy: true } } }));
    expect(alerts.some((a) => a.id === "ltv_cac_bajo")).toBe(false);
  });

  it("detecta servicio de deuda mayor al flujo de caja operativo", () => {
    const snapshot = baseSnapshot({ flujoNeto: 500 });
    const alerts = buildAlerts(baseContext({ snapshot, financing: { monthlyDebtService: 800 } }));
    expect(alerts.some((a) => a.id === "servicio_deuda_alto")).toBe(true);
  });

  it("detecta meta lejos de cumplirse", () => {
    const alerts = buildAlerts(baseContext({ goal: { progressPct: 20, targetType: "VENTAS" } }));
    const alert = alerts.find((a) => a.id === "meta_lejos");
    expect(alert).toBeDefined();
    expect(alert?.message).toContain("20%");
  });

  it("no alerta la meta cuando el avance es igual o mayor a 50%", () => {
    const alerts = buildAlerts(baseContext({ goal: { progressPct: 75, targetType: "UTILIDAD_NETA" } }));
    expect(alerts.some((a) => a.id === "meta_lejos")).toBe(false);
  });

  it("sin historia, no genera alertas de tendencia", () => {
    const alerts = buildAlerts(baseContext());
    expect(alerts.some((a) => a.category === "tendencia")).toBe(false);
  });

  it("con historia insuficiente (1 mes), tampoco genera alertas de tendencia", () => {
    const alerts = buildAlerts(
      baseContext({ history: [{ periodYear: 2026, periodMonth: 1, ventas: 1, costoVentas: 1, utilidadBruta: 1, gastosOperativos: 1, ebitda: 1, utilidadNeta: 1, margenNetoPct: 1, flujoNeto: 1, breakEvenAmount: 1 }] })
    );
    expect(alerts.some((a) => a.category === "tendencia")).toBe(false);
  });

  it("con ≥2 meses de historia, integra las alertas del Temporal Benchmark Engine bajo categoría 'tendencia'", () => {
    const alerts = buildAlerts(
      baseContext({
        history: [
          { periodYear: 2026, periodMonth: 1, ventas: 10000, costoVentas: 4000, utilidadBruta: 6000, gastosOperativos: 3000, ebitda: 3000, utilidadNeta: 2250, margenNetoPct: 30, flujoNeto: 2250, breakEvenAmount: 5000 },
          { periodYear: 2026, periodMonth: 2, ventas: 10000, costoVentas: 4000, utilidadBruta: 6000, gastosOperativos: 3000, ebitda: 3000, utilidadNeta: 1000, margenNetoPct: 15, flujoNeto: 1000, breakEvenAmount: 5000 },
        ],
      })
    );
    const trend = alerts.find((a) => a.id === "margen_cae");
    expect(trend).toBeDefined();
    expect(trend?.category).toBe("tendencia");
  });
});

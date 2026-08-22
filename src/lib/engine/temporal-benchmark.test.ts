import { describe, expect, it } from "vitest";
import {
  buildTemporalSeries,
  computePeriodChange,
  detectTrendAlerts,
  findPreviousMonth,
  findSameMonthLastYear,
  sortSnapshots,
  type SnapshotLike,
} from "./temporal-benchmark";

function snapshot(overrides: Partial<SnapshotLike> & Pick<SnapshotLike, "periodYear" | "periodMonth">): SnapshotLike {
  return {
    ventas: 10000,
    costoVentas: 4000,
    utilidadBruta: 6000,
    gastosOperativos: 3000,
    ebitda: 3000,
    utilidadNeta: 2250,
    margenNetoPct: 22.5,
    flujoNeto: 2250,
    breakEvenAmount: 5000,
    ...overrides,
  };
}

describe("temporal benchmark engine", () => {
  it("computePeriodChange calcula delta absoluto y porcentual", () => {
    expect(computePeriodChange(120, 100)).toEqual({ deltaAbs: 20, deltaPct: 20 });
    expect(computePeriodChange(80, 100)).toEqual({ deltaAbs: -20, deltaPct: -20 });
  });

  it("computePeriodChange devuelve deltaPct null si el período anterior es 0", () => {
    const result = computePeriodChange(500, 0);
    expect(result.deltaAbs).toBe(500);
    expect(result.deltaPct).toBeNull();
  });

  it("sortSnapshots ordena cronológicamente sin importar el orden de entrada", () => {
    const sorted = sortSnapshots([
      snapshot({ periodYear: 2026, periodMonth: 3 }),
      snapshot({ periodYear: 2025, periodMonth: 12 }),
      snapshot({ periodYear: 2026, periodMonth: 1 }),
    ]);
    expect(sorted.map((s) => `${s.periodYear}-${s.periodMonth}`)).toEqual(["2025-12", "2026-1", "2026-3"]);
  });

  it("findPreviousMonth cruza el límite de año (enero -> diciembre del año anterior)", () => {
    const snapshots = [snapshot({ periodYear: 2025, periodMonth: 12, ventas: 999 })];
    const found = findPreviousMonth(snapshots, 2026, 1);
    expect(found?.ventas).toBe(999);
  });

  it("findPreviousMonth devuelve null si no existe la foto", () => {
    expect(findPreviousMonth([snapshot({ periodYear: 2026, periodMonth: 1 })], 2026, 3)).toBeNull();
  });

  it("findSameMonthLastYear compara año contra año en el mismo mes", () => {
    const snapshots = [snapshot({ periodYear: 2025, periodMonth: 6, ventas: 500 }), snapshot({ periodYear: 2026, periodMonth: 6, ventas: 800 })];
    expect(findSameMonthLastYear(snapshots, 2026, 6)?.ventas).toBe(500);
  });

  it("buildTemporalSeries arma la serie ordenada de una métrica", () => {
    const series = buildTemporalSeries(
      [snapshot({ periodYear: 2026, periodMonth: 2, ventas: 200 }), snapshot({ periodYear: 2026, periodMonth: 1, ventas: 100 })],
      "ventas"
    );
    expect(series).toEqual([
      { year: 2026, month: 1, value: 100 },
      { year: 2026, month: 2, value: 200 },
    ]);
  });

  it("detectTrendAlerts no genera nada con menos de 2 meses de historia", () => {
    expect(detectTrendAlerts([snapshot({ periodYear: 2026, periodMonth: 1 })])).toHaveLength(0);
    expect(detectTrendAlerts([])).toHaveLength(0);
  });

  it("detecta costos que suben ≥18% vs el mes anterior", () => {
    const alerts = detectTrendAlerts([
      snapshot({ periodYear: 2026, periodMonth: 1, costoVentas: 4000, gastosOperativos: 3000 }), // total 7000
      snapshot({ periodYear: 2026, periodMonth: 2, costoVentas: 5000, gastosOperativos: 3500 }), // total 8500, +21.4%
    ]);
    expect(alerts.some((a) => a.id === "costos_suben")).toBe(true);
  });

  it("no alerta un aumento de costos menor al umbral", () => {
    const alerts = detectTrendAlerts([
      snapshot({ periodYear: 2026, periodMonth: 1, costoVentas: 4000, gastosOperativos: 3000 }),
      snapshot({ periodYear: 2026, periodMonth: 2, costoVentas: 4200, gastosOperativos: 3100 }),
    ]);
    expect(alerts.some((a) => a.id === "costos_suben")).toBe(false);
  });

  it("detecta caída de margen neto ≥7 puntos", () => {
    const alerts = detectTrendAlerts([
      snapshot({ periodYear: 2026, periodMonth: 1, margenNetoPct: 25 }),
      snapshot({ periodYear: 2026, periodMonth: 2, margenNetoPct: 15 }),
    ]);
    expect(alerts.some((a) => a.id === "margen_cae")).toBe(true);
  });

  it("detecta flujo de caja negativo dos meses consecutivos", () => {
    const alerts = detectTrendAlerts([
      snapshot({ periodYear: 2026, periodMonth: 1, flujoNeto: -100 }),
      snapshot({ periodYear: 2026, periodMonth: 2, flujoNeto: -50 }),
    ]);
    expect(alerts.some((a) => a.id === "flujo_negativo_consecutivo" && a.severity === "danger")).toBe(true);
  });

  it("no alerta flujo negativo consecutivo si solo el mes actual es negativo", () => {
    const alerts = detectTrendAlerts([
      snapshot({ periodYear: 2026, periodMonth: 1, flujoNeto: 200 }),
      snapshot({ periodYear: 2026, periodMonth: 2, flujoNeto: -50 }),
    ]);
    expect(alerts.some((a) => a.id === "flujo_negativo_consecutivo")).toBe(false);
  });

  it("detecta que el punto de equilibrio subió", () => {
    const alerts = detectTrendAlerts([
      snapshot({ periodYear: 2026, periodMonth: 1, breakEvenAmount: 5000 }),
      snapshot({ periodYear: 2026, periodMonth: 2, breakEvenAmount: 6000 }),
    ]);
    expect(alerts.some((a) => a.id === "punto_equilibrio_subio")).toBe(true);
  });

  it("ignora el punto de equilibrio cuando es Infinity (sin margen de contribución)", () => {
    const alerts = detectTrendAlerts([
      snapshot({ periodYear: 2026, periodMonth: 1, breakEvenAmount: Infinity }),
      snapshot({ periodYear: 2026, periodMonth: 2, breakEvenAmount: Infinity }),
    ]);
    expect(alerts.some((a) => a.id === "punto_equilibrio_subio")).toBe(false);
  });

  it("compara siempre las dos últimas fotos disponibles, aunque haya un hueco de meses", () => {
    const alerts = detectTrendAlerts([
      snapshot({ periodYear: 2026, periodMonth: 1, margenNetoPct: 30 }),
      snapshot({ periodYear: 2026, periodMonth: 6, margenNetoPct: 20 }), // hueco feb-may, nunca interpolado
    ]);
    expect(alerts.some((a) => a.id === "margen_cae")).toBe(true);
  });
});
